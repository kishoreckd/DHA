import { Suspense } from "react";
import { AuthFrame } from "@/features/auth/auth-form";
import { InvitationPasswordForm } from "@/features/auth/account-flows";

export default function SetPasswordPage() {
  return <AuthFrame title="Activate your account" description="Verify the invitation and create your password."><Suspense><InvitationPasswordForm /></Suspense></AuthFrame>;
}
