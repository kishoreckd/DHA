import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { appToast } from "@/lib/toast";
import { permissionsApi } from "@/lib/api/collection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, ListRowsSkeleton, PageHeader } from "@/components/common/product-ui";
import { ActionCard, Field, JsonBlock, TextAreaField } from "@/components/common/api-panels";

export function PermissionsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("Assessment Reviewer");
  const [description, setDescription] = useState("Can review evidence, baselines, and reports.");
  const [permissions, setPermissions] = useState("evidence.review, assessment.review, report.edit");
  const [subjectEmail, setSubjectEmail] = useState("");
  const [groupId, setGroupId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [auditAction, setAuditAction] = useState("");

  const catalogQuery = useQuery({ queryKey: ["admin", "permissions", "catalog"], queryFn: permissionsApi.catalog });
  const groupsQuery = useQuery({ queryKey: ["admin", "permissions", "groups"], queryFn: permissionsApi.groups });
  const adminAuditQuery = useQuery({
    queryKey: ["admin", "audit-events", auditAction],
    queryFn: () => permissionsApi.adminAudit(auditAction),
  });
  const workspaceAuditQuery = useQuery({
    queryKey: ["workspaces", workspaceId, "audit-events"],
    queryFn: () => permissionsApi.workspaceAudit(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const createGroup = useMutation({
    mutationFn: () =>
      permissionsApi.createGroup({
        name,
        description,
        permissions: permissions.split(",").map((item) => item.trim()).filter(Boolean),
      }),
    onSuccess: (group) => {
      appToast.success("Permission group saved");
      setGroupId(group.id);
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions", "groups"] });
    },
  });

  const assign = useMutation({
    mutationFn: () =>
      permissionsApi.assign({
        subject_type: "user",
        subject_email: subjectEmail,
        group_id: groupId || undefined,
        permissions: permissions.split(",").map((item) => item.trim()).filter(Boolean),
        expires_at: null,
      }),
    onSuccess: () => appToast.success("Permissions assigned"),
  });

  return (
    <>
      <PageHeader
        eyebrow="Permissions and audit"
        title="Access control"
        description="Manage permission catalog views, groups, assignments, admin audit events, and workspace audit events."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ActionCard
          title="Create permission group"
          description="Maps to POST /admin/permissions/groups."
          action={{ label: "Create group", onClick: () => createGroup.mutate() }}
          pending={createGroup.isPending}
        >
          <Field id="permission-name" label="Name" value={name} onChange={setName} />
          <Field id="permission-description" label="Description" value={description} onChange={setDescription} />
          <TextAreaField id="permission-list" label="Permissions" value={permissions} onChange={setPermissions} rows={3} />
        </ActionCard>

        <ActionCard
          title="Assign permissions"
          description="Maps to POST /admin/permissions/assignments."
          action={{ label: "Assign", onClick: () => assign.mutate() }}
          pending={assign.isPending}
        >
          <Field id="subject-email" label="Subject email" value={subjectEmail} onChange={setSubjectEmail} />
          <Field id="group-id" label="Group ID" value={groupId} onChange={setGroupId} />
          <TextAreaField id="direct-permissions" label="Direct permissions" value={permissions} onChange={setPermissions} rows={3} />
        </ActionCard>

        <Card>
          <CardHeader>
            <CardTitle>Permission groups</CardTitle>
            <CardDescription>Existing groups returned by GET /admin/permissions/groups.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {groupsQuery.isError && <ErrorState message="Unable to load permission groups." retry={() => void groupsQuery.refetch()} />}
            {groupsQuery.isLoading ? (
              <ListRowsSkeleton rows={4} />
            ) : (groupsQuery.data ?? []).length === 0 ? (
              <EmptyState icon={<Users />} title="No permission groups" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupsQuery.data?.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.status || "active"}</TableCell>
                      <TableCell className="max-w-[420px] truncate">
                        {(group.permissions ?? []).join(", ") || group.description || group.id}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setGroupId(group.id)}>
                          Use
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permission catalog</CardTitle>
            <CardDescription>Raw catalog from GET /admin/permissions/catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            {catalogQuery.isLoading ? <ListRowsSkeleton rows={3} actions={false} /> : <JsonBlock value={catalogQuery.data} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin audit events</CardTitle>
            <CardDescription>Filter by action and inspect the latest events.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field id="audit-action" label="Action filter" value={auditAction} onChange={setAuditAction} />
            <JsonBlock value={adminAuditQuery.data} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace audit events</CardTitle>
            <CardDescription>Maps to GET /workspaces/&lbrace;workspace_id&rbrace;/audit-events.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field id="audit-workspace" label="Workspace ID" value={workspaceId} onChange={setWorkspaceId} />
            {workspaceId ? <JsonBlock value={workspaceAuditQuery.data} /> : <EmptyState icon={<ShieldCheck />} title="Enter a workspace ID" />}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
