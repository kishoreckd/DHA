import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-provider";
import { ProductShell } from "@/components/layout/product-shell";
import { LoadingState } from "@/components/common/product-ui";

export function AuthGuard() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Loading session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return (
    <ProductShell>
      <Outlet />
    </ProductShell>
  );
}
