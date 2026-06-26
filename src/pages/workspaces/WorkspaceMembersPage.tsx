import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailSkeleton, ErrorState, TableSkeleton } from "@/components/common/product-ui";
import { WorkspaceHeader } from "@/features/workspaces/components/WorkspaceHeader";
import { useWorkspace, useWorkspaceMembers } from "@/features/workspaces/hooks";

export function WorkspaceMembersPage() {
  const { workspaceId } = useParams();
  const workspaceQuery = useWorkspace(workspaceId);
  const membersQuery = useWorkspaceMembers(workspaceId);

  if (workspaceQuery.isLoading) return <DetailSkeleton cards={1} />;
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <ErrorState message="Workspace members are unavailable." />;
  }

  return (
    <>
      <WorkspaceHeader workspace={workspaceQuery.data} />
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {membersQuery.isLoading && <TableSkeleton columns={5} />}
          {membersQuery.isError && <ErrorState message="Unable to load workspace members." />}
          {membersQuery.data && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Role</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Permissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {membersQuery.data.map((member) => (
                    <tr key={member.id}>
                      <td className="px-3 py-3 font-medium">{member.display_name || "Unnamed member"}</td>
                      <td className="px-3 py-3 text-muted-foreground">{member.email}</td>
                      <td className="px-3 py-3 capitalize">{member.role}</td>
                      <td className="px-3 py-3">
                        <Badge variant={member.status === "active" ? "success" : "warning"}>{member.status}</Badge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{member.permissions.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
