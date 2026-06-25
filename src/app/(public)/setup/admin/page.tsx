import { AuthFrame } from "@/features/auth/auth-form";
import { AdminSetupForm } from "@/features/auth/account-flows";

export default function AdminSetupPage() {
  return <AuthFrame title="Initial administrator setup" description="Create the first account for this deployment."><AdminSetupForm /></AuthFrame>;
}
