"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";
import { usersApi } from "@/lib/api/users";
import { ApiError } from "@/types/api";

const schema = z.object({
  username: z.string().min(2).max(80),
  display_name: z.string().max(120),
  first_name: z.string().max(80),
  last_name: z.string().max(80),
  profile_image: z.string().url().or(z.literal("")),
});

export function ProfilePage() {
  const { user, refetch } = useAuth();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { username: "", display_name: "", first_name: "", last_name: "", profile_image: "" } });
  useEffect(() => {
    if (user) form.reset({
      username: user.username ?? "",
      display_name: user.display_name ?? "",
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      profile_image: user.profile_image ?? "",
    });
  }, [form, user]);
  async function submit(values: z.infer<typeof schema>) {
    try {
      await usersApi.updateMe({ ...values, profile_image: values.profile_image || null });
      toast.success("Profile updated");
      refetch();
    } catch (error) {
      form.setError("root", { message: error instanceof ApiError ? error.message : "Unable to update your profile." });
    }
  }
  return (
    <>
      <PageHeader eyebrow="ACCOUNT SETTINGS" title="Profile" description="Keep your account identity and display information current." />
      <section className="panel settings-panel">
        <div className="profile-heading"><span>{(user?.display_name || user?.email || "U").slice(0, 1).toUpperCase()}</span><div><h2>{user?.display_name || user?.username}</h2><p>{user?.email}</p></div></div>
        <form className="form-stack" onSubmit={form.handleSubmit(submit)}>
          {form.formState.errors.root && <div className="form-alert">{form.formState.errors.root.message}</div>}
          <div className="form-grid"><label>Username<input {...form.register("username")} /><small>{form.formState.errors.username?.message}</small></label><label>Display name<input {...form.register("display_name")} /></label><label>First name<input {...form.register("first_name")} /></label><label>Last name<input {...form.register("last_name")} /></label><label className="wide">Profile image URL<input {...form.register("profile_image")} /><small>{form.formState.errors.profile_image?.message}</small></label></div>
          <div><button className="button primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <LoaderCircle className="spin" /> : <Save />}Save profile</button></div>
        </form>
      </section>
    </>
  );
}
