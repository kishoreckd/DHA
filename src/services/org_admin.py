import base64
import hashlib
import hmac
import json
import re
import secrets
import smtplib
import threading
import time
from datetime import UTC, datetime, timedelta
from email.message import EmailMessage
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

from fastapi import HTTPException, status

from app.core.config import settings
from app.models.admin import (
    AuditLogEntry,
    AuthSessionResponse,
    BearerTokenResponse,
    InvitationTokenResponse,
    MicrosoftLoginRequest,
    OrganizationRole,
    OrganizationSettings,
    OrganizationSettingsUpdate,
    OrganizationUser,
    UserInvitation,
)


STATE_LOCK = threading.Lock()
ROLE_PERMISSIONS = {
    OrganizationRole.super_admin: {
        "organization:manage",
        "tenant:manage",
        "auth_policy:manage",
        "domain:manage",
        "user:invite",
        "user:manage",
        "user:disable",
        "role:assign",
        "audit:read",
        "security:manage",
        "project:create",
        "project:manage",
        "report:run",
        "report:read",
    },
    OrganizationRole.admin: {
        "user:invite",
        "user:manage",
        "role:assign",
        "project:create",
        "project:manage",
        "report:run",
        "report:read",
    },
    OrganizationRole.security_admin: {
        "audit:read",
        "security:manage",
        "report:read",
    },
    OrganizationRole.analyst: {
        "report:run",
        "report:read",
    },
    OrganizationRole.viewer: {
        "report:read",
    },
}
ELEVATED_ROLES = {
    OrganizationRole.super_admin,
    OrganizationRole.admin,
    OrganizationRole.security_admin,
}
ROLE_DEFINITIONS = {
    OrganizationRole.super_admin: {
        "description": "Full control across organization, tenant, security, users, projects, and reports.",
        "can_be_assigned_by": [OrganizationRole.super_admin.value],
    },
    OrganizationRole.admin: {
        "description": "Manage users, projects, role assignments for non-admin users, and reports.",
        "can_be_assigned_by": [OrganizationRole.super_admin.value],
    },
    OrganizationRole.security_admin: {
        "description": "Review audit logs and manage security policy.",
        "can_be_assigned_by": [OrganizationRole.super_admin.value],
    },
    OrganizationRole.analyst: {
        "description": "Run assessments, generate reports, and read reports.",
        "can_be_assigned_by": [OrganizationRole.super_admin.value, OrganizationRole.admin.value],
    },
    OrganizationRole.viewer: {
        "description": "Read-only report access.",
        "can_be_assigned_by": [OrganizationRole.super_admin.value, OrganizationRole.admin.value],
    },
}


def login_user(email: str, password: str) -> BearerTokenResponse:
    email = _normalize_email(email)
    with STATE_LOCK:
        state = _load_state()
        _ensure_admin_user(state)
        user_data = state["users"].get(email)
        if not user_data or not user_data.get("password_hash"):
            _audit(state, "login_failed", email, target_email=email, details={"reason": "unknown_user"})
            _save_state(state)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
        user = OrganizationUser(**user_data)
        if not user.is_active:
            _audit(state, "login_failed", email, target_email=email, details={"reason": "disabled"})
            _save_state(state)
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled.")
        if not _verify_password(password, str(user_data["password_hash"])):
            _audit(state, "login_failed", email, target_email=email, details={"reason": "bad_password"})
            _save_state(state)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
        user.last_login_at = _now()
        user.updated_at = user.updated_at or _now()
        state["users"][email].update(user.dict())
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.admin_token_expire_minutes)
        token = _create_token(user, int(expires_at.timestamp()))
        _audit(state, "login_success", email, target_email=email)
        _save_state(state)
        return BearerTokenResponse(
            access_token=token,
            expires_at=expires_at.isoformat(),
            user=user,
            permissions=permissions_for_role(user.role),
        )



def create_signup_session(email: str, password: str, username: str | None = None, name: str | None = None) -> BearerTokenResponse:
    email = _normalize_email(email)
    now = _now()
    with STATE_LOCK:
        state = _load_state()
        user = OrganizationUser(
            email=email,
            username=username,
            name=name,
            role=OrganizationRole.super_admin,
            is_active=True,
            created_at=now,
            updated_at=now,
            last_login_at=now,
        )
        user_data = user.dict()
        user_data["password_hash"] = _hash_password(password)
        state["users"][email] = user_data
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.admin_token_expire_minutes)
        token = _create_token(user, int(expires_at.timestamp()))
        _audit(state, "signup_session_created", email, target_email=email)
        _save_state(state)
        return BearerTokenResponse(
            access_token=token,
            expires_at=expires_at.isoformat(),
            user=user,
            permissions=permissions_for_role(user.role),
        )
def authenticate_bearer_token(token: str) -> OrganizationUser:
    email = _verify_token(token)
    with STATE_LOCK:
        state = _load_state()
        user_data = state["users"].get(email)
        if not user_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token user is not registered.")
        user = OrganizationUser(**user_data)
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token user is disabled.")
        return user


def handle_microsoft_login(profile: MicrosoftLoginRequest) -> AuthSessionResponse:
    now = _now()
    email = _normalize_email(profile.email)
    name = profile.name

    with STATE_LOCK:
        state = _load_state()
        org_settings = _organization_settings(state)
        _validate_tenant(profile.tenant_id, org_settings)
        _validate_domain(email, org_settings.allowed_email_domains)

        users = state["users"]
        invitations = state["invitations"]

        if email in users:
            user = OrganizationUser(**users[email])
            if not user.is_active:
                _audit(state, "login_denied_disabled_user", email, target_email=email)
                _save_state(state)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account is disabled. Please contact the CXOntology administrator.",
                )
            user.name = name or user.name
            user.tenant_id = profile.tenant_id or user.tenant_id
            user.microsoft_object_id = profile.microsoft_object_id or user.microsoft_object_id
            user.last_login_at = now
            user.updated_at = now
            users[email] = user.dict()
            _audit(state, "login_success", email, target_email=email)
            _save_state(state)
            return _session(user)

        role = _bootstrap_role(email, users)
        invited_by = None
        invitation = invitations.get(email)
        if role is None:
            if invitation and not invitation.get("is_used"):
                role = OrganizationRole(invitation["role"])
                invited_by = invitation["invited_by"]
                invitation["is_used"] = True
                invitation["status"] = "accepted"
                invitation["used_at"] = now
                invitations[email] = invitation
            else:
                _audit(state, "login_denied_not_invited", email, target_email=email)
                _save_state(state)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account has not yet been approved. Please contact the CXOntology administrator.",
                )

        user = OrganizationUser(
            email=email,
            username=(invitation or {}).get("username"),
            name=name,
            role=role,
            is_active=True,
            tenant_id=profile.tenant_id,
            microsoft_object_id=profile.microsoft_object_id,
            invited_by=invited_by,
            created_at=now,
            updated_at=now,
            last_login_at=now,
        )
        users[email] = user.dict()
        _audit(state, "user_created_from_microsoft_login", email, target_email=email, details={"role": role.value})
        _save_state(state)
        return _session(user)


def create_invitation(
    actor_email: str,
    email: str,
    *,
    username: str | None = None,
    name: str | None = None,
    role: OrganizationRole,
) -> UserInvitation:
    actor_email = _normalize_email(actor_email)
    email = _normalize_email(email)
    now = _now()

    with STATE_LOCK:
        state = _load_state()
        _require_permission(state, actor_email, "user:invite")
        _validate_domain(email, _organization_settings(state).allowed_email_domains)
        if role in ELEVATED_ROLES:
            _require_role(state, actor_email, OrganizationRole.super_admin)
        invite_token = _create_invitation_token()
        invitation_expires_at = (datetime.now(UTC) + timedelta(hours=settings.invitation_token_expire_hours)).isoformat()
        invitation = UserInvitation(
            email=email,
            username=username,
            name=name,
            role=role,
            invited_by=actor_email,
            created_at=now,
            email_sent_at=now,
            email_delivery_status="queued",
        )
        email_status = _queue_invitation_email(invitation, invite_token)
        invitation.email_delivery_status = email_status
        invitation_data = invitation.dict()
        invitation_data["token_hash"] = _hash_invitation_token(invite_token)
        invitation_data["expires_at"] = invitation_expires_at
        state["invitations"][email] = invitation_data
        _audit(
            state,
            "user_invited",
            actor_email,
            target_email=email,
            details={"role": role.value, "username": username, "email_delivery_status": email_status},
        )
        _save_state(state)
        return invitation



def validate_invitation_token(token: str) -> InvitationTokenResponse:
    with STATE_LOCK:
        state = _load_state()
        _, invitation = _invitation_for_token(state, token)
        return InvitationTokenResponse(
            email=invitation["email"],
            username=invitation.get("username"),
            name=invitation.get("name"),
            role=OrganizationRole(invitation["role"]),
            status=invitation.get("status", "pending"),
            expires_at=invitation.get("expires_at"),
        )


def set_password_with_invitation_token(token: str, new_password: str) -> BearerTokenResponse:
    if len(new_password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 8 characters.")

    with STATE_LOCK:
        state = _load_state()
        email, invitation = _invitation_for_token(state, token)
        now = _now()
        role = OrganizationRole(invitation["role"])
        existing_user = state["users"].get(email)

        if existing_user:
            user = OrganizationUser(**existing_user)
            user.username = invitation.get("username") or user.username
            user.name = invitation.get("name") or user.name
            user.role = role
            user.is_active = True
            user.updated_at = now
        else:
            user = OrganizationUser(
                email=email,
                username=invitation.get("username"),
                name=invitation.get("name"),
                role=role,
                invited_by=invitation.get("invited_by"),
                is_active=True,
                created_at=now,
                updated_at=now,
            )

        user_data = user.dict()
        user_data["password_hash"] = _hash_password(new_password)
        state["users"][email] = user_data

        invitation["is_used"] = True
        invitation["status"] = "accepted"
        invitation["used_at"] = now
        invitation["token_hash"] = None
        state["invitations"][email] = invitation

        expires_at = datetime.now(UTC) + timedelta(minutes=settings.admin_token_expire_minutes)
        access_token = _create_token(user, int(expires_at.timestamp()))
        _audit(state, "invited_user_password_set", email, target_email=email, details={"role": role.value})
        _save_state(state)
        return BearerTokenResponse(
            access_token=access_token,
            expires_at=expires_at.isoformat(),
            user=user,
            permissions=permissions_for_role(user.role),
        )


def list_users(actor_email: str) -> list[OrganizationUser]:
    with STATE_LOCK:
        state = _load_state()
        _require_permission(state, _normalize_email(actor_email), "user:manage")
        return [OrganizationUser(**user) for user in state["users"].values()]


def list_invitations(actor_email: str) -> list[UserInvitation]:
    with STATE_LOCK:
        state = _load_state()
        _require_permission(state, _normalize_email(actor_email), "user:invite")
        return [UserInvitation(**invitation) for invitation in state["invitations"].values()]


def update_user(
    actor_email: str,
    target_email: str,
    *,
    name: str | None = None,
    username: str | None = None,
    role: OrganizationRole | None = None,
    is_active: bool | None = None,
) -> OrganizationUser:
    actor_email = _normalize_email(actor_email)
    target_email = _normalize_email(target_email)

    with STATE_LOCK:
        state = _load_state()
        _require_permission(state, actor_email, "user:manage")
        if target_email not in state["users"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        user = OrganizationUser(**state["users"][target_email])
        if role is not None:
            _require_permission(state, actor_email, "role:assign")
            if role in ELEVATED_ROLES:
                _require_role(state, actor_email, OrganizationRole.super_admin)
            user.role = role
        if name is not None:
            user.name = name
        if username is not None:
            user.username = username
        if is_active is not None:
            if user.role == OrganizationRole.super_admin and not is_active:
                _require_another_active_super_admin(state, target_email)
            user.is_active = is_active
        user.updated_at = _now()
        state["users"][target_email] = user.dict()
        _audit(
            state,
            "user_updated",
            actor_email,
            target_email=target_email,
            details={"role": user.role.value, "is_active": user.is_active},
        )
        _save_state(state)
        return user


def update_own_profile(actor_email: str, *, username: str | None = None, name: str | None = None) -> OrganizationUser:
    actor_email = _normalize_email(actor_email)
    with STATE_LOCK:
        state = _load_state()
        _require_permission(state, actor_email, "user:manage")
        user = OrganizationUser(**state["users"][actor_email])
        if username is not None:
            user.username = username
        if name is not None:
            user.name = name
        user.updated_at = _now()
        state["users"][actor_email].update(user.dict())
        _audit(state, "own_profile_updated", actor_email, target_email=actor_email)
        _save_state(state)
        return user


def reset_user_password(actor_email: str, target_email: str, new_password: str) -> OrganizationUser:
    actor_email = _normalize_email(actor_email)
    target_email = _normalize_email(target_email)
    if len(new_password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 8 characters.")
    with STATE_LOCK:
        state = _load_state()
        _require_permission(state, actor_email, "user:manage")
        if target_email not in state["users"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        target = OrganizationUser(**state["users"][target_email])
        if target.role in ELEVATED_ROLES:
            _require_role(state, actor_email, OrganizationRole.super_admin)
        state["users"][target_email]["password_hash"] = _hash_password(new_password)
        state["users"][target_email]["updated_at"] = _now()
        user = OrganizationUser(**state["users"][target_email])
        _audit(state, "user_password_reset", actor_email, target_email=target_email)
        _save_state(state)
        return user


def get_settings(actor_email: str) -> OrganizationSettings:
    with STATE_LOCK:
        state = _load_state()
        _require_permission(state, _normalize_email(actor_email), "organization:manage")
        return _organization_settings(state)


def update_settings(actor_email: str, update: OrganizationSettingsUpdate) -> OrganizationSettings:
    actor_email = _normalize_email(actor_email)
    with STATE_LOCK:
        state = _load_state()
        _require_permission(state, actor_email, "organization:manage")
        org_settings = _organization_settings(state)
        if update.allowed_email_domains is not None:
            org_settings.allowed_email_domains = [_normalize_domain(domain) for domain in update.allowed_email_domains]
        if update.microsoft_tenant_id is not None:
            org_settings.microsoft_tenant_id = update.microsoft_tenant_id.strip() or None
        if update.require_invitation is not None:
            org_settings.require_invitation = update.require_invitation
        if update.mfa_enforced_by_entra_id is not None:
            org_settings.mfa_enforced_by_entra_id = update.mfa_enforced_by_entra_id
        state["settings"] = org_settings.dict()
        _audit(state, "organization_settings_updated", actor_email, details=org_settings.dict())
        _save_state(state)
        return org_settings


def list_audit_logs(actor_email: str) -> list[AuditLogEntry]:
    with STATE_LOCK:
        state = _load_state()
        _require_permission(state, _normalize_email(actor_email), "audit:read")
        return [AuditLogEntry(**entry) for entry in state["audit_logs"]]


def get_user_for_actor(actor_email: str) -> OrganizationUser:
    with STATE_LOCK:
        state = _load_state()
        user = state["users"].get(_normalize_email(actor_email))
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authenticated user is not registered.")
        org_user = OrganizationUser(**user)
        if not org_user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Authenticated user is disabled.")
        return org_user


def ensure_permission(actor_email: str, permission: str) -> OrganizationUser:
    actor_email = _normalize_email(actor_email)
    with STATE_LOCK:
        state = _load_state()
        _require_permission(state, actor_email, permission)
        return OrganizationUser(**state["users"][actor_email])


def permissions_for_role(role: OrganizationRole) -> list[str]:
    return sorted(ROLE_PERMISSIONS[role])


def role_definitions() -> list[dict[str, Any]]:
    return [
        {
            "role": role.value,
            "description": ROLE_DEFINITIONS[role]["description"],
            "permissions": permissions_for_role(role),
            "can_be_assigned_by": ROLE_DEFINITIONS[role]["can_be_assigned_by"],
        }
        for role in OrganizationRole
    ]


def _session(user: OrganizationUser) -> AuthSessionResponse:
    return AuthSessionResponse(user=user, permissions=permissions_for_role(user.role))


def _bootstrap_role(email: str, users: dict[str, Any]) -> OrganizationRole | None:
    super_admin_email = _normalize_email(settings.super_admin_email) if settings.super_admin_email else None
    if super_admin_email and email == super_admin_email:
        return OrganizationRole.super_admin
    if not users and not super_admin_email:
        return OrganizationRole.super_admin
    return None


def _require_permission(state: dict[str, Any], actor_email: str, permission: str) -> None:
    actor = state["users"].get(actor_email)
    if not actor:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Actor is not registered.")
    user = OrganizationUser(**actor)
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Actor is disabled.")
    if permission not in ROLE_PERMISSIONS[user.role]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Actor does not have permission.")


def _require_role(state: dict[str, Any], actor_email: str, role: OrganizationRole) -> None:
    actor = state["users"].get(actor_email)
    if not actor or OrganizationUser(**actor).role != role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{role.value} role is required.")


def _require_another_active_super_admin(state: dict[str, Any], target_email: str) -> None:
    for email, data in state["users"].items():
        user = OrganizationUser(**data)
        if email != target_email and user.role == OrganizationRole.super_admin and user.is_active:
            return
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one active Super Admin is required.")


def _validate_tenant(tenant_id: str | None, org_settings: OrganizationSettings) -> None:
    expected_tenant = org_settings.microsoft_tenant_id
    if expected_tenant and tenant_id != expected_tenant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Microsoft tenant is not allowed.")


def _validate_domain(email: str, allowed_domains: list[str]) -> None:
    domain = email.rsplit("@", 1)[-1]
    if allowed_domains and domain not in allowed_domains:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email domain is not allowed.")


def _organization_settings(state: dict[str, Any]) -> OrganizationSettings:
    return OrganizationSettings(**state.get("settings", _default_settings().dict()))


def _default_settings() -> OrganizationSettings:
    return OrganizationSettings(
        allowed_email_domains=settings.allowed_email_domains,
        microsoft_tenant_id=settings.microsoft_tenant_id,
        require_invitation=True,
        mfa_enforced_by_entra_id=True,
    )


def _load_state() -> dict[str, Any]:
    path = _state_path()
    if not path.exists():
        return {
            "settings": _default_settings().dict(),
            "users": {},
            "invitations": {},
            "audit_logs": [],
        }
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Organization state is invalid JSON.") from exc
    data.setdefault("settings", _default_settings().dict())
    data.setdefault("users", {})
    data.setdefault("invitations", {})
    data.setdefault("audit_logs", [])
    return data


def _ensure_admin_user(state: dict[str, Any]) -> None:
    admin_email = _normalize_email(settings.super_admin_email) if settings.super_admin_email else None
    if not admin_email or admin_email in state["users"]:
        return
    now = _now()
    user = OrganizationUser(
        email=admin_email,
        username="admin",
        name="CXOntology Admin",
        role=OrganizationRole.super_admin,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    user_data = user.dict()
    user_data["password_hash"] = _hash_password(settings.super_admin_password)
    state["users"][admin_email] = user_data
    _audit(state, "admin_user_bootstrapped", admin_email, target_email=admin_email)


def _save_state(state: dict[str, Any]) -> None:
    path = _state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


def _state_path() -> Path:
    return settings.org_admin_state_path


def _audit(
    state: dict[str, Any],
    action: str,
    actor_email: str | None,
    *,
    target_email: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    state["audit_logs"].append(
        AuditLogEntry(
            timestamp=_now(),
            actor_email=actor_email,
            action=action,
            target_email=target_email,
            details=details or {},
        ).dict()
    )


def _normalize_email(email: str | None) -> str:
    value = (email or "").strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A valid email address is required.")
    return value


def _normalize_domain(domain: str) -> str:
    value = domain.strip().lower().lstrip("@")
    if not value:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Email domain cannot be empty.")
    return value


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return f"pbkdf2_sha256$120000${salt}${digest.hex()}"


def _verify_password(password: str, encoded: str) -> bool:
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


def _create_token(user: OrganizationUser, exp: int) -> str:
    header = _b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode("utf-8"))
    payload = _b64encode(
        json.dumps(
            {
                "sub": user.email,
                "username": user.username,
                "role": user.role.value,
                "permissions": permissions_for_role(user.role),
                "iat": int(time.time()),
                "exp": exp,
            },
            separators=(",", ":"),
        ).encode("utf-8")
    )
    signature = _sign(f"{header}.{payload}")
    return f"{header}.{payload}.{signature}"


def _verify_token(token: str) -> str:
    try:
        header, payload, signature = token.split(".", 2)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT bearer token.") from exc
    if not hmac.compare_digest(signature, _sign(f"{header}.{payload}")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT bearer token.")
    try:
        header_data = json.loads(_b64decode(header).decode("utf-8"))
        data = json.loads(_b64decode(payload).decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT bearer token.") from exc
    if header_data.get("alg") != "HS256" or header_data.get("typ") != "JWT":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT bearer token.")
    if int(data.get("exp") or 0) < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="JWT bearer token has expired.")
    return _normalize_email(data.get("sub"))


def _sign(payload: str) -> str:
    digest = hmac.new(settings.api_token_secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest()
    return _b64encode(digest)


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padded = value + "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii"))



def _create_invitation_token() -> str:
    return secrets.token_urlsafe(32)


def _hash_invitation_token(token: str) -> str:
    return hmac.new(settings.api_token_secret.encode("utf-8"), token.encode("utf-8"), hashlib.sha256).hexdigest()


def _invitation_for_token(state: dict[str, Any], token: str) -> tuple[str, dict[str, Any]]:
    token_hash = _hash_invitation_token(token)
    for email, invitation in state["invitations"].items():
        stored_hash = invitation.get("token_hash")
        if not stored_hash or not hmac.compare_digest(stored_hash, token_hash):
            continue
        if invitation.get("is_used") or invitation.get("status") == "accepted":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invitation token has already been used.")
        expires_at = invitation.get("expires_at")
        if expires_at and datetime.fromisoformat(expires_at) < datetime.now(UTC):
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invitation token has expired.")
        return email, invitation
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invitation token.")
def _queue_invitation_email(invitation: UserInvitation, invite_token: str) -> str:
    outbox_path = settings.invitation_outbox_path
    outbox_path.parent.mkdir(parents=True, exist_ok=True)

    if outbox_path.exists():
        try:
            outbox = json.loads(outbox_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            outbox = []
    else:
        outbox = []

    subject = "Welcome to DHA Assessment"

    setup_url = f"{settings.frontend_base_url.rstrip('/')}/set-password?token={quote_plus(invite_token)}"

    body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f4f7fb;">
        <tr>
            <td align="center">

                <table width="600" cellpadding="0" cellspacing="0"
                       style="background:#ffffff;border-radius:16px;
                              overflow:hidden;
                              box-shadow:0 8px 24px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="
                            background:linear-gradient(135deg,#0f172a,#1e293b);
                            padding:40px;
                            text-align:center;
                        ">
                            <h1 style="color:white;margin:0;font-size:30px;">
                                DHA Assessment
                            </h1>

                            <p style="
                                color:#cbd5e1;
                                margin-top:10px;
                                font-size:16px;
                            ">
                                Digital Health Assessment Platform
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:40px;">

                            <h2 style="color:#1e293b;margin-top:0;">
                                Hello {invitation.name or invitation.email},
                            </h2>

                            <p style="
                                color:#475569;
                                font-size:16px;
                                line-height:1.8;
                            ">
                                You have been invited to join
                                <strong>DHA Assessment</strong>.
                            </p>

                            <p style="
                                color:#475569;
                                font-size:16px;
                                line-height:1.8;
                            ">
                                Your assigned role is:
                            </p>

                            <div style="
                                display:inline-block;
                                background:#dbeafe;
                                color:#1d4ed8;
                                padding:10px 18px;
                                border-radius:20px;
                                font-weight:bold;
                                font-size:14px;
                            ">
                                {invitation.role.value.upper()}
                            </div>

                            <p style="
                                margin-top:30px;
                                color:#475569;
                                line-height:1.8;
                            ">
                                Set your password to activate your access.
                            </p>

                            <div style="text-align:center;margin:40px 0;">
                                <a href="{setup_url}"
                                   style="
                                   background:#2563eb;
                                   color:white;
                                   text-decoration:none;
                                   padding:16px 36px;
                                   border-radius:10px;
                                   font-size:16px;
                                   font-weight:600;
                                   display:inline-block;
                                   ">
                                    Set Password
                                </a>
                            </div>

                            <hr style="border:none;border-top:1px solid #e2e8f0">

                            <table width="100%">
                                <tr>
                                    <td>
                                        <p style="color:#64748b;font-size:14px;">
                                            <strong>Invited By:</strong><br>
                                            {invitation.invited_by}
                                        </p>
                                    </td>

                                    <td align="right">
                                        <p style="color:#64748b;font-size:14px;">
                                            <strong>Role</strong><br>
                                            {invitation.role.value}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="
                                color:#94a3b8;
                                font-size:13px;
                                margin-top:30px;
                            ">
                                If you weren't expecting this invitation, you can safely ignore this email.
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="
                            background:#f8fafc;
                            padding:25px;
                            text-align:center;
                            color:#94a3b8;
                            font-size:13px;
                        ">
                            © 2026 CXOntology • DHA Assessment Platform
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

    </body>
    </html>
    """

    status_value = _send_invitation_email(
        invitation.email,
        subject,
        body,
    )

    outbox.append(
        {
            "queued_at": _now(),
            "to": invitation.email,
            "subject": subject,
            "body": body,
            "status": status_value,
            "setup_url": setup_url,
        }
    )

    outbox_path.write_text(
        json.dumps(outbox, indent=2),
        encoding="utf-8"
    )

    return status_value

def _send_invitation_email(to_email: str, subject: str, body: str) -> str:
    if not settings.smtp_host:
        return "queued"

    message = EmailMessage()
    message["From"] = settings.smtp_from_email
    message["To"] = to_email
    message["Subject"] = subject

    # Plain text fallback
    message.set_content(
        "You have been invited to DHA Assessment."
    )

    # HTML email
    message.add_alternative(body, subtype="html")

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()

            if settings.smtp_username and settings.smtp_password:
                smtp.login(
                    settings.smtp_username,
                    settings.smtp_password,
                )

            smtp.send_message(message)

        return "sent"

    except Exception as e:
        print(f"Email Error: {e}")
        return "failed"




