import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function AuthFrame({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-[minmax(380px,.95fr)_minmax(500px,1.05fr)] bg-white">
      {/* Left — brand context */}
      <section className="flex flex-col justify-between bg-[#101b31] text-white px-8 md:px-[clamp(38px,6vw,90px)] py-10 md:min-h-screen">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-primary text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <strong className="text-[17px] tracking-wide">DHA</strong>
            <small className="text-[11px] text-slate-400 mt-0.5">Digital Assessment Platform</small>
          </span>
        </div>
        <div className="hidden md:block">
          <span className="text-[10px] font-extrabold tracking-widest text-[#74a7ff] uppercase">
            SECURE OPERATIONS WORKSPACE
          </span>
          <h1 className="mt-3 mb-4 text-[clamp(38px,5vw,62px)] font-bold leading-[1.03] tracking-[-0.055em] max-w-xl">
            Assessment work without the operational noise.
          </h1>
          <p className="max-w-xl text-[17px] leading-[1.7] text-[#b8c5d8]">
            Run assessment tools, manage secure user access, and keep authentication activity
            auditable.
          </p>
        </div>
        <small className="text-[#8495ae] hidden md:block">
          Protected sessions · Role-aware access · Auditable workflows
        </small>
      </section>

      {/* Right — card */}
      <section className="flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[430px]">
          <header className="mb-6">
            <h2 className="text-[29px] font-bold tracking-[-0.025em] mb-2">{title}</h2>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: z.infer<typeof loginSchema>) {
    try {
      await authApi.login(values);
      toast.success("Signed in successfully");
      navigate(searchParams.get("returnTo") || "/dashboard", { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to sign in. Check your connection and try again.";
      form.setError("root", { message });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      {searchParams.get("reset") === "success" && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Password reset complete. You can sign in now.
        </div>
      )}
      {form.formState.errors.root && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {form.formState.errors.root.message}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-[11px] text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-11"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-[11px] text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 font-normal cursor-pointer">
          <input type="checkbox" className="w-auto" />
          Remember this device
        </Label>
        <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <LoaderCircle className="animate-spin" />}
        Sign in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        First deployment?{" "}
        <Link to="/setup/admin" className="font-semibold text-primary hover:underline">
          Set up the administrator
        </Link>
      </p>
    </form>
  );
}
