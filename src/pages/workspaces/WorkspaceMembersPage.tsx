import { useParams } from "react-router-dom";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { appToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DetailSkeleton, ErrorState, TableSkeleton } from "@/components/common/product-ui";
import { WorkspaceHeader } from "@/features/workspaces/components/WorkspaceHeader";
import {
  useAddWorkspaceMember,
  useRemoveWorkspaceMember,
  useUpdateWorkspaceMember,
  useWorkspace,
  useWorkspaceMembers,
} from "@/features/workspaces/hooks";
import type { WorkspaceMemberRole } from "@/features/workspaces/types";

const roles: WorkspaceMemberRole[] = ["owner", "admin", "editor", "analyst", "viewer"];

export function WorkspaceMembersPage() {
  const { workspaceId = "" } = useParams();
  const workspaceQuery = useWorkspace(workspaceId);
  const membersQuery = useWorkspaceMembers(workspaceId);
  const addMember = useAddWorkspaceMember(workspaceId);
  const updateMember = useUpdateWorkspaceMember(workspaceId);
  const removeMember = useRemoveWorkspaceMember(workspaceId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceMemberRole>("viewer");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await addMember.mutateAsync({ user_email: email, role });
    setEmail("");
    setRole("viewer");
    appToast.success("Workspace member added");
  }

  async function changeRole(memberId: string, nextRole: WorkspaceMemberRole) {
    await updateMember.mutateAsync({ memberId, role: nextRole });
    appToast.success("Member role updated");
  }

  async function remove(memberId: string) {
    await removeMember.mutateAsync(memberId);
    appToast.success("Member removed");
  }

  if (workspaceQuery.isLoading) return <DetailSkeleton cards={1} />;
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <ErrorState message="Workspace members are unavailable." />;
  }

  return (
    <>
      <WorkspaceHeader workspace={workspaceQuery.data} />
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Add member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="member-email">User email</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(value: WorkspaceMemberRole) => setRole(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {roles.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button disabled={addMember.isPending || !email}>
              {addMember.isPending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
              Add member
            </Button>
          </form>
        </CardContent>
      </Card>
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
                    <th className="px-3 py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {membersQuery.data.map((member) => (
                    <tr key={member.id}>
                      <td className="px-3 py-3 font-medium">{member.display_name || "Unnamed member"}</td>
                      <td className="px-3 py-3 text-muted-foreground">{member.email}</td>
                      <td className="px-3 py-3 capitalize">
                        <Select
                          value={member.role}
                          onValueChange={(nextRole: WorkspaceMemberRole) => void changeRole(member.id, nextRole)}
                        >
                          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {roles.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={member.status === "active" ? "success" : "warning"}>{member.status}</Badge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{member.permissions.length}</td>
                      <td className="px-3 py-3">
                        <Button variant="ghost" size="icon" onClick={() => remove(member.id)} disabled={removeMember.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
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
