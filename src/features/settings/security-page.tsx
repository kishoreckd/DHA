"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/common/product-ui";
import { usersApi } from "@/lib/api/users";
import { ApiError } from "@/types/api";

const schema = z.object({
  current_password: z.string().min(8, "Enter your current password"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((value) => value.new_password === value.confirm_password, { path: ["confirm_password"], message: "Passwords do not match" });

export function SecurityPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { current_password: "", new_password: "", confirm_password: "" } });
  async function submit(values: z.infer<typeof schema>) {
    try {
      await usersApi.changePassword({ current_password: values.current_password, new_password: values.new_password });
      toast.success("Password changed. Sign in again.");
      router.replace("/login?password=changed");
      router.refresh();
    } catch (error) {
      form.setError("root", { message: error instanceof ApiError ? error.message : "Unable to change your password." });
    }
  }
  return (
    <>
      <PageHeader eyebrow="ACCOUNT SETTINGS" title="Security" description="Change your password. All active access is ended after a successful change." />
      <section className="panel settings-panel narrow">
        <div className="security-intro"><span><KeyRound /></span><div><h2>Change password</h2><p>You will be signed out and must authenticate again.</p></div></div>
        <form className="form-stack" onSubmit={form.handleSubmit(submit)}>
          {form.formState.errors.root && <div className="form-alert">{form.formState.errors.root.message}</div>}
          <label>Current password<input type="password" autoComplete="current-password" {...form.register("current_password")} /><small>{form.formState.errors.current_password?.message}</small></label>
          <label>New password<input type="password" autoComplete="new-password" {...form.register("new_password")} /><small>{form.formState.errors.new_password?.message}</small></label>
          <label>Confirm new password<input type="password" autoComplete="new-password" {...form.register("confirm_password")} /><small>{form.formState.errors.confirm_password?.message}</small></label>
          <button className="button primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <LoaderCircle className="spin" />}Update password</button>
        </form>
      </section>
    </>
  );
}
