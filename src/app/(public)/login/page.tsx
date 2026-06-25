import { Suspense } from "react";
import { AuthFrame, LoginForm } from "@/features/auth/auth-form";

export default function LoginPage() {
  return <AuthFrame title="Welcome back" description="Sign in with your DHA account."><Suspense><LoginForm /></Suspense></AuthFrame>;
}
