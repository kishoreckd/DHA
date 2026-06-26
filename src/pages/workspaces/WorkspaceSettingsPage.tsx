import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, FormSkeleton } from "@/components/common/product-ui";
import { WorkspaceHeader } from "@/features/workspaces/components/WorkspaceHeader";
import { useUpdateWorkspace, useWorkspace } from "@/features/workspaces/hooks";

export function WorkspaceSettingsPage() {
  const { workspaceId = "" } = useParams();
  const workspaceQuery = useWorkspace(workspaceId);
  const updateWorkspace = useUpdateWorkspace(workspaceId);
  const [name, setName] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!workspaceQuery.data) return;
    setName(workspaceQuery.data.name);
    setPrimaryDomain(workspaceQuery.data.primary_domain ?? "");
    setDescription(workspaceQuery.data.description ?? "");
  }, [workspaceQuery.data]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateWorkspace.mutateAsync({
      name,
      primary_domain: primaryDomain || undefined,
      description: description || undefined,
    });
    appToast.success("Workspace updated");
  }

  if (workspaceQuery.isLoading) return <FormSkeleton />;
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <ErrorState message="Workspace settings are unavailable." />;
  }

  return (
    <>
      <WorkspaceHeader workspace={workspaceQuery.data} />
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex max-w-2xl flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-name">Workspace name</Label>
              <Input id="settings-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-domain">Primary domain</Label>
              <Input
                id="settings-domain"
                value={primaryDomain}
                onChange={(event) => setPrimaryDomain(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-description">Description</Label>
              <Input
                id="settings-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-fit" disabled={updateWorkspace.isPending || !name.trim()}>
              {updateWorkspace.isPending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
