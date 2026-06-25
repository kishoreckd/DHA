"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/types/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function AuthFrame({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return (
    <main className="auth-page">
      <section className="auth-context">
        <div className="brand light"><span className="brand-mark"><ShieldCheck /></span><span><strong>DHA</strong><small>Digital Assessment Platform</small></span></div>
        <div>
          <span className="eyebrow">SECURE OPERATIONS WORKSPACE</span>
          <h1>Assessment work without the operational noise.</h1>
          <p>Run assessment tools, manage secure user access, and keep authentication activity auditable.</p>
        </div>
        <small>Protected sessions · Role-aware access · Auditable workflows</small>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <header><h2>{title}</h2><p>{description}</p></header>
          {children}
        </div>
      </section>
    </main>
  );
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function submit(values: z.infer<typeof loginSchema>) {
    try {
      await authApi.login(values);
      toast.success("Signed in successfully");
      router.replace(params.get("returnTo") || "/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to sign in. Check your connection and try again.";
      form.setError("root", { message });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="form-stack" noValidate>
      {params.get("reset") === "success" && <div className="success-banner">Password reset complete. You can sign in now.</div>}
      {form.formState.errors.root && <div className="form-alert" role="alert">{form.formState.errors.root.message}</div>}
      <label>Email address<input type="email" autoComplete="email" {...form.register("email")} aria-invalid={!!form.formState.errors.email} /><small>{form.formState.errors.email?.message}</small></label>
      <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} autoComplete="current-password" {...form.register("password")} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button></div><small>{form.formState.errors.password?.message}</small></label>
      <div className="form-between"><label className="check-label"><input type="checkbox" />Remember this device</label><Link href="/forgot-password">Forgot password?</Link></div>
      <button className="button primary full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <LoaderCircle className="spin" />}Sign in</button>
      <p className="auth-footnote">First deployment? <Link href="/setup/admin">Set up the administrator</Link></p>
    </form>
  );
}
