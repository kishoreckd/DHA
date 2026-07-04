import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ArtifactSummary } from "../types";
import { useArtifact } from "../hooks";
import { useState } from "react";

export function ToolRunArtifacts({
  workspaceId,
  artifacts,
}: {
  workspaceId: string;
  artifacts: ArtifactSummary[];
}) {
  const [artifactId, setArtifactId] = useState("");
  const artifactQuery = useArtifact(workspaceId, artifactId);

  if (artifacts.length === 0) {
    return <p className="text-sm text-muted-foreground">No artifacts were saved for this run.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {artifacts.map((artifact) => (
        <div key={artifact.id} className="flex items-center justify-between gap-3 rounded-md border px-4 py-3">
          <div className="min-w-0">
            <strong className="block truncate text-sm">{artifact.name}</strong>
            <span className="block text-xs text-muted-foreground">{artifact.artifact_type}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setArtifactId(artifact.id)}>
            <ExternalLink data-icon="inline-start" />
            Inspect
          </Button>
        </div>
      ))}
      {artifactQuery.data && (
        <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">
          {JSON.stringify(artifactQuery.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
