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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  username: z.string().min(2).max(80),
  display_name: z.string().max(120),
  first_name: z.string().max(80),
  last_name: z.string().max(80),
  profile_image: z.string().url().or(z.literal("")),
});

export function ProfilePage() {
  const { user, refetch } = useAuth();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", display_name: "", first_name: "", last_name: "", profile_image: "" },
  });

  useEffect(() => {
    if (user)
      form.reset({
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
      form.setError("root", {
        message: error instanceof ApiError ? error.message : "Unable to update your profile.",
      });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="ACCOUNT SETTINGS"
        title="Profile"
        description="Keep your account identity and display information current."
      />
      <Card className="max-w-[900px]">
        <CardContent className="pt-6">
          {/* Profile heading */}
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-border">
            <Avatar className="h-12 w-12 text-lg">
              <AvatarFallback>
                {(user?.display_name || user?.email || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-base m-0">
                {user?.display_name || user?.username}
              </h2>
              <p className="text-sm text-muted-foreground m-0">{user?.email}</p>
            </div>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(submit)}>
            {form.formState.errors.root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...form.register("username")} />
                {form.formState.errors.username && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.username.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="display_name">Display name</Label>
                <Input id="display_name" {...form.register("display_name")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" {...form.register("first_name")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" {...form.register("last_name")} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="profile_image">Profile image URL</Label>
                <Input id="profile_image" {...form.register("profile_image")} />
                {form.formState.errors.profile_image && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.profile_image.message}</p>
                )}
              </div>
            </div>

            <Separator />
            <div>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Save />
                )}
                Save profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
