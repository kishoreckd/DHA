import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AlertCircle, CheckCircle2, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { AuthProvider } from "@/features/auth/auth-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster
        closeButton
        expand
        richColors={false}
        position="top-right"
        visibleToasts={4}
        icons={{
          success: <CheckCircle2 />,
          error: <AlertCircle />,
          info: <Info />,
          warning: <TriangleAlert />,
          loading: <LoaderCircle className="animate-spin" />,
        }}
        toastOptions={{
          duration: 3600,
          classNames: {
            toast: "dha-toast",
            title: "dha-toast-title",
            description: "dha-toast-description",
            actionButton: "dha-toast-action",
            cancelButton: "dha-toast-cancel",
            closeButton: "dha-toast-close",
            success: "dha-toast-success",
            error: "dha-toast-error",
            warning: "dha-toast-warning",
            info: "dha-toast-info",
            loading: "dha-toast-loading",
          },
        }}
      />
    </QueryClientProvider>
  );
}
