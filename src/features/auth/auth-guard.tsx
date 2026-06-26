import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { ProductShell } from "@/components/layout/product-shell";
import { LoadingState } from "@/components/common/product-ui";

export function AuthGuard() {
  const location = useLocation();

  // Use the query directly so we can check isFetching (covers the post-login
  // invalidation window where isLoading=false but data hasn't refreshed yet)
  const { data: user, isLoading, isFetching } = useQuery({
    queryKey: ["session"],
    queryFn: authApi.me,
    retry: false,
  });

  // Hold while initial load OR a background refetch (e.g. post-login invalidation)
  if (isLoading || isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Loading session…" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return (
    <ProductShell>
      <Outlet />
    </ProductShell>
  );
}
