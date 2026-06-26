import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/common/product-ui";
import { usersApi } from "@/lib/api/users";
import { ApiError } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const schema = z
  .object({
    current_password: z.string().min(8, "Enter your current password"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

export function SecurityPage() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  async function submit(values: z.infer<typeof schema>) {
    try {
      await usersApi.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      toast.success("Password changed. Sign in again.");
      navigate("/login?password=changed");
    } catch (error) {
      form.setError("root", {
        message: error instanceof ApiError ? error.message : "Unable to change your password.",
      });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="ACCOUNT SETTINGS"
        title="Security"
      />
      <Card className="max-w-[620px]">
        <CardContent className="pt-6">
          {/* Intro */}
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-border">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary shrink-0">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-base m-0">Change password</h2>
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(submit)}>
            {form.formState.errors.root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current_password">Current password</Label>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                {...form.register("current_password")}
              />
              {form.formState.errors.current_password && (
                <p className="text-[11px] text-destructive">{form.formState.errors.current_password.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_password">New password</Label>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                {...form.register("new_password")}
              />
              {form.formState.errors.new_password && (
                <p className="text-[11px] text-destructive">{form.formState.errors.new_password.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm_password">Confirm new password</Label>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                {...form.register("confirm_password")}
              />
              {form.formState.errors.confirm_password && (
                <p className="text-[11px] text-destructive">{form.formState.errors.confirm_password.message}</p>
              )}
            </div>

            <Separator />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <LoaderCircle className="animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
