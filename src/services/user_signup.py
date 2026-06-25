import hashlib
import hmac
import re
import secrets

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.Auth.user import AuditLog, Organization, Role, User
from app.models.admin import OrganizationRole, SignupRequest, SignupResponse


def signup_admin_user(db: Session, request: SignupRequest) -> SignupResponse:
    email = _normalize_email(request.email)
    expected_email = _normalize_email(settings.super_admin_email)
    if email != expected_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only {settings.super_admin_email} can be used for admin signup.",
        )
    if len(request.password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 8 characters.")

    try:
        existing_user = db.scalar(select(User).where(User.email == email))
        if existing_user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admin user already exists.")

        role = db.scalar(select(Role).where(Role.name == OrganizationRole.super_admin.value))
        if not role:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Super Admin role is missing. Run Alembic migrations first.")

        organization = db.scalar(select(Organization).where(Organization.name == (request.organization_name or settings.default_organization_name)))
        if not organization:
            organization = Organization(
                name=request.organization_name or settings.default_organization_name,
                allowed_email_domains=settings.allowed_email_domains,
                microsoft_tenant_id=settings.microsoft_tenant_id,
                require_invitation=True,
                mfa_enforced_by_entra_id=True,
            )
            db.add(organization)
            db.flush()

        user = User(
            organization_id=organization.id,
            role_id=role.id,
            email=email,
            username=request.username,
            full_name=request.name,
            password_hash=_hash_password(request.password),
            status="active",
        )
        db.add(user)
        db.flush()
        db.add(
            AuditLog(
                organization_id=organization.id,
                actor_user_id=user.id,
                target_user_id=user.id,
                action="admin_user_signed_up",
                metadata_json={"email": email, "role": role.name},
            )
        )
        db.commit()
        db.refresh(user)
        return SignupResponse(
            organization_id=str(organization.id),
            user_id=str(user.id),
            email=user.email,
            username=user.username,
            name=user.full_name,
            role=OrganizationRole.super_admin,
            status=user.status,
        )
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database signup failed.") from exc


def _normalize_email(email: str | None) -> str:
    value = (email or "").strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A valid email address is required.")
    return value


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return f"pbkdf2_sha256$120000${salt}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iterations),
        )
        return hmac.compare_digest(digest.hex(), expected)
    except Exception:
        return False



