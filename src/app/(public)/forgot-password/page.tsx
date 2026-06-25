import { AuthFrame } from "@/features/auth/auth-form";
import { ForgotPasswordForm } from "@/features/auth/account-flows";

export default function ForgotPasswordPage() {
  return <AuthFrame title="Forgot your password?" description="Enter your account email and we’ll send reset instructions."><ForgotPasswordForm /></AuthFrame>;
}
