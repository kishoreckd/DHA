import { callBackend } from "@/lib/api/server";
import type { User } from "@/types/auth";
import { AdminUsersPage } from "@/features/users/admin-users-page";

export default async function Page() {
  const { response, payload } = await callBackend<User>("/users/me", {}, "user");
  if (!response.ok || payload.data?.role !== "admin") {
    return <section className="error-state"><strong>Administrator access required</strong><p>This route is restricted to verified administrators.</p></section>;
  }
  return <AdminUsersPage />;
}
