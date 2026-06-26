import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { appToast } from "@/lib/toast";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/types/api";
import { ErrorState, LoadingState, StatusBadge } from "@/components/common/product-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const passwordFields = {
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
};
const passwordsMatch = <T extends { password: string; confirmPassword: string }>(value: T) =>
  value.password === value.confirmPassword;

const setupSchema = z
  .object({ username: z.string().min(2).max(80), email: z.string().email(), ...passwordFields })
  .refine(passwordsMatch, { path: ["confirmPassword"], message: "Passwords do not match" });

const tokenPasswordSchema = z
  .object(passwordFields)
  .refine(passwordsMatch, { path: ["confirmPassword"], message: "Passwords do not match" });

export function AdminSetupForm() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });
  async function submit(values: z.infer<typeof setupSchema>) {
    try {
      await authApi.signup({ username: values.username, email: values.email, password: values.password });
      appToast.success("Administrator account created");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Setup could not be completed.";
      if (/bootstrap|already|completed/i.test(message)) navigate("/login", { replace: true });
      else form.setError("root", { message });
    }
  }
  return (
    <PasswordAccountForm form={form} onSubmit={submit} includeIdentity submitLabel="Create administrator" />
  );
}

export function ForgotPasswordForm() {
  const form = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().email("Enter a valid email address") })),
    defaultValues: { email: "" },
  });
  const submitted = form.formState.isSubmitSuccessful;

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <h3 className="font-semibold">Check your inbox</h3>
        <p className="text-sm text-muted-foreground">
          If an active account exists for this email, a reset link has been sent.
        </p>
        <Button variant="outline" asChild>
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(async ({ email }) => {
        try {
          await authApi.forgotPassword(email);
        } catch {
          /* privacy-preserving identical state */
        }
      })}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-[11px] text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <LoaderCircle className="animate-spin" />}
        Send reset link
      </Button>
      <Link to="/login" className="text-center text-sm font-semibold text-primary hover:underline">
        Return to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const form = useForm<z.infer<typeof tokenPasswordSchema>>({
    resolver: zodResolver(tokenPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  return (
    <PasswordAccountForm
      form={form}
      onSubmit={async ({ password }) => {
        try {
          await authApi.resetPassword({ token, password });
          appToast.success("Password updated");
          navigate("/login?reset=success", { replace: true });
        } catch (error) {
          form.setError("root", {
            message:
              error instanceof ApiError ? error.message : "The reset link is invalid or expired.",
          });
        }
      }}
      submitLabel="Reset password"
      disabled={!token}
    />
  );
}

export function InvitationPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const invitation = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => authApi.verifyInvitation(token),
    enabled: !!token,
    retry: false,
  });
  const schema = z
    .object({ username: z.string().min(2).max(80), ...passwordFields })
    .refine(passwordsMatch, { path: ["confirmPassword"], message: "Passwords do not match" });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (invitation.data?.display_name && !form.getValues("username")) {
      form.setValue(
        "username",
        invitation.data.display_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      );
    }
  }, [form, invitation.data]);

  if (!token) return <ErrorState message="This invitation link is missing its token." />;
  if (invitation.isLoading) return <LoadingState label="Checking invitation…" />;
  if (invitation.isError || !invitation.data) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <ShieldAlert className="h-10 w-10 text-amber-500" />
        <h3 className="font-semibold">Invitation unavailable</h3>
        <p className="text-sm text-muted-foreground">
          The invitation may be expired, revoked, invalid, or already activated.
        </p>
        <Button variant="outline" asChild>
          <Link to="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-border bg-muted/40 p-3 mb-4 flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <small className="text-muted-foreground">Invited email</small>
          <strong>{invitation.data.email}</strong>
        </div>
        <div className="flex justify-between items-center text-sm">
          <small className="text-muted-foreground">Assigned role</small>
          <StatusBadge value={invitation.data.role} />
        </div>
        <div className="flex justify-between text-sm">
          <small className="text-muted-foreground">Expires</small>
          <strong>{new Date(invitation.data.expires_at).toLocaleString()}</strong>
        </div>
      </div>
      <PasswordAccountForm
        form={form}
        onSubmit={async ({ username, password }) => {
          try {
            await authApi.setPassword({ token, username, password });
            appToast.success("Account activated");
            navigate("/dashboard", { replace: true });
          } catch (error) {
            form.setError("root", {
              message:
                error instanceof ApiError ? error.message : "Unable to activate this account.",
            });
          }
        }}
        includeUsername
        submitLabel="Activate account"
      />
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
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {errors.root?.message && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errors.root.message}
        </div>
      )}
      {(includeIdentity || includeUsername) && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input id="username" {...form.register("username")} />
          {errors.username && (
            <p className="text-[11px] text-destructive">{errors.username.message}</p>
          )}
        </div>
      )}
      {includeIdentity && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-email">Admin email</Label>
          <Input id="admin-email" type="email" {...form.register("email")} />
          {errors.email && (
            <p className="text-[11px] text-destructive">{errors.email.message}</p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
        {errors.password && (
          <p className="text-[11px] text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input id="confirm-password" type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-[11px] text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={disabled || form.formState.isSubmitting}>
        {form.formState.isSubmitting && <LoaderCircle className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
