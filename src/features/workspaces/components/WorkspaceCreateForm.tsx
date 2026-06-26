import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/types/api";
import { useCreateWorkspace } from "../hooks";

export function WorkspaceCreateForm() {
  const navigate = useNavigate();
  const createWorkspace = useCreateWorkspace();
  const [name, setName] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const workspace = await createWorkspace.mutateAsync({
        name,
        primary_domain: primaryDomain || undefined,
        description: description || undefined,
      });
      toast.success("Workspace created");
      navigate(`/workspaces/${workspace.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create workspace.");
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-4">
      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspace-name">Workspace name</Label>
        <Input
          id="workspace-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspace-domain">Primary domain</Label>
        <Input
          id="workspace-domain"
          value={primaryDomain}
          onChange={(event) => setPrimaryDomain(event.target.value)}
          placeholder="https://example.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspace-description">Description</Label>
        <Input
          id="workspace-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Assessment context or business unit"
        />
      </div>
      <Button type="submit" className="w-fit" disabled={createWorkspace.isPending || !name.trim()}>
        {createWorkspace.isPending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
        Create workspace
      </Button>
    </form>
  );
}
