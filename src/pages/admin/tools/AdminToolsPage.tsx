import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState, PageHeader } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";
import { useAdminTools } from "@/features/methodologies/hooks";

export function AdminToolsPage() {
  const { user } = useAuth();
  const toolsQuery = useAdminTools();
  const canManage = user?.role === "admin" || user?.permissions.includes("methodology.manage");

  if (!canManage) return <Navigate to="/dashboard" replace />;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Tool mappings"
      />
      <Card>
        <CardHeader>
          <CardTitle>Admin tool catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {toolsQuery.isLoading && <LoadingState label="Loading admin tools..." />}
          {toolsQuery.isError && <ErrorState message="Unable to load admin tool catalog." />}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">Tool</th>
                  <th className="px-3 py-2 font-semibold">Metric area</th>
                  <th className="px-3 py-2 font-semibold">Mapped metrics</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {toolsQuery.data?.map((tool) => (
                  <tr key={tool.key}>
                    <td className="px-3 py-3">
                      <strong className="block">{tool.name}</strong>
                      <span className="text-xs text-muted-foreground">{tool.key}</span>
                    </td>
                    <td className="px-3 py-3">{tool.metric_area}</td>
                    <td className="px-3 py-3">{tool.mapped_metric_count}</td>
                    <td className="px-3 py-3">
                      <Badge variant={tool.is_enabled ? "success" : "secondary"}>
                        {tool.is_enabled ? "enabled" : "disabled"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
