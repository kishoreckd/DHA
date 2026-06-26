import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/product-ui";
import { WorkspaceCreateForm } from "@/features/workspaces/components/WorkspaceCreateForm";

export function WorkspaceCreatePage() {
  return (
    <>
      <PageHeader
        eyebrow="Workspaces"
        title="Create workspace"
      />
      <Card>
        <CardHeader>
          <CardTitle>Workspace details</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkspaceCreateForm />
        </CardContent>
      </Card>
    </>
  );
}
