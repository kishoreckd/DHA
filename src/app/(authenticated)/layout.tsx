import { redirect } from "next/navigation";
import { ProductShell } from "@/components/layout/product-shell";
import { callBackend } from "@/lib/api/server";
import type { User } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  try {
    const { response } = await callBackend<User>("/users/me", {}, "user");
    if (response.status === 401) redirect("/login");
    if (response.status === 403) {
      return <main className="authz-error"><h1>Access denied</h1><p>Your session is valid, but this account cannot access the requested application area.</p></main>;
    }
  } catch {
    // API-specific pages surface a retryable connection error. Cookie presence was
    // already checked by proxy.ts, so temporary backend downtime does not erase it.
  }
  return <ProductShell>{children}</ProductShell>;
}
