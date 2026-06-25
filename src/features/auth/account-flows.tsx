"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState, StatusBadge } from "@/components/common/product-ui";

const passwordFields = {
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
};
const passwordsMatch = <T extends { password: string; confirmPassword: string }>(value: T) => value.password === value.confirmPassword;

const setupSchema = z.object({
  username: z.string().min(2).max(80),
  email: z.string().email(),
  ...passwordFields,
}).refine(passwordsMatch, { path: ["confirmPassword"], message: "Passwords do not match" });

const tokenPasswordSchema = z.object(passwordFields).refine(passwordsMatch, { path: ["confirmPassword"], message: "Passwords do not match" });

export function AdminSetupForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof setupSchema>>({ resolver: zodResolver(setupSchema), defaultValues: { username: "", email: "", password: "", confirmPassword: "" } });
  async function submit(values: z.infer<typeof setupSchema>) {
    try {
      await authApi.signup({ username: values.username, email: values.email, password: values.password });
      toast.success("Administrator account created");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Setup could not be completed.";
      if (/bootstrap|already|completed/i.test(message)) router.replace("/login");
      else form.setError("root", { message });
    }
  }
  return <PasswordAccountForm form={form} onSubmit={submit} includeIdentity submitLabel="Create administrator" />;
}

export function ForgotPasswordForm() {
  const form = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().email("Enter a valid email address") })), defaultValues: { email: "" } });
  const submitted = form.formState.isSubmitSuccessful;
  if (submitted) return <div className="success-panel"><CheckCircle2 /><h3>Check your inbox</h3><p>If an active account exists for this email, a reset link has been sent.</p><Link className="button secondary" href="/login">Back to sign in</Link></div>;
  return (
    <form className="form-stack" onSubmit={form.handleSubmit(async ({ email }) => {
      try { await authApi.forgotPassword(email); } catch { /* privacy-preserving identical state */ }
    })}>
      <label>Email address<input type="email" {...form.register("email")} /><small>{form.formState.errors.email?.message}</small></label>
      <button className="button primary full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <LoaderCircle className="spin" />}Send reset link</button>
      <Link className="center-link" href="/login">Return to sign in</Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const form = useForm<z.infer<typeof tokenPasswordSchema>>({ resolver: zodResolver(tokenPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });
  return <PasswordAccountForm form={form} onSubmit={async ({ password }) => {
    try {
      await authApi.resetPassword({ token, password });
      toast.success("Password updated");
      router.replace("/login?reset=success");
    } catch (error) {
      form.setError("root", { message: error instanceof ApiError ? error.message : "The reset link is invalid or expired." });
    }
  }} submitLabel="Reset password" disabled={!token} />;
}

export function InvitationPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const invitation = useQuery({ queryKey: ["invitation", token], queryFn: () => authApi.verifyInvitation(token), enabled: !!token, retry: false });
  const schema = z.object({ username: z.string().min(2).max(80), ...passwordFields }).refine(passwordsMatch, { path: ["confirmPassword"], message: "Passwords do not match" });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { username: "", password: "", confirmPassword: "" } });

  useEffect(() => {
    if (invitation.data?.display_name && !form.getValues("username")) {
      form.setValue("username", invitation.data.display_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [form, invitation.data]);

  if (!token) return <ErrorState message="This invitation link is missing its token." />;
  if (invitation.isLoading) return <LoadingState label="Checking invitation…" />;
  if (invitation.isError || !invitation.data) return <div className="invalid-state"><ShieldAlert /><h3>Invitation unavailable</h3><p>The invitation may be expired, revoked, invalid, or already activated.</p><Link className="button secondary" href="/login">Go to sign in</Link></div>;

  return (
    <>
      <div className="invitation-summary">
        <div><small>Invited email</small><strong>{invitation.data.email}</strong></div>
        <div><small>Assigned role</small><StatusBadge value={invitation.data.role} /></div>
        <div><small>Expires</small><strong>{new Date(invitation.data.expires_at).toLocaleString()}</strong></div>
      </div>
      <PasswordAccountForm form={form} onSubmit={async ({ username, password }) => {
        try {
          await authApi.setPassword({ token, username, password });
          toast.success("Account activated");
          router.replace("/dashboard");
          router.refresh();
        } catch (error) {
          form.setError("root", { message: error instanceof ApiError ? error.message : "Unable to activate this account." });
        }
      }} includeUsername submitLabel="Activate account" />
    </>
  );
}

function PasswordAccountForm({
  form,
  onSubmit,
  submitLabel,
  includeIdentity,
  includeUsername,
  disabled,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: ReturnType<typeof useForm<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (value: any) => Promise<void>;
  submitLabel: string;
  includeIdentity?: boolean;
  includeUsername?: boolean;
  disabled?: boolean;
}) {
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;
  return (
    <form className="form-stack" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {errors.root?.message && <div className="form-alert" role="alert">{errors.root.message}</div>}
      {(includeIdentity || includeUsername) && <label>Username<input {...form.register("username")} /><small>{errors.username?.message}</small></label>}
      {includeIdentity && <label>Admin email<input type="email" {...form.register("email")} /><small>{errors.email?.message}</small></label>}
      <label>Password<input type="password" autoComplete="new-password" {...form.register("password")} /><small>{errors.password?.message}</small></label>
      <label>Confirm password<input type="password" autoComplete="new-password" {...form.register("confirmPassword")} /><small>{errors.confirmPassword?.message}</small></label>
      <button className="button primary full" disabled={disabled || form.formState.isSubmitting}>{form.formState.isSubmitting && <LoaderCircle className="spin" />}{submitLabel}</button>
    </form>
  );
}
