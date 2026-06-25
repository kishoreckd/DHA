import { Suspense } from "react";
import { AuthFrame } from "@/features/auth/auth-form";
import { ResetPasswordForm } from "@/features/auth/account-flows";

export default function ResetPasswordPage() {
  return <AuthFrame title="Choose a new password" description="Use at least eight characters."><Suspense><ResetPasswordForm /></Suspense></AuthFrame>;
}
