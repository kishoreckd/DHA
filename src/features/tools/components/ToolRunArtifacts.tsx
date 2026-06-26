import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ArtifactSummary } from "../types";

export function ToolRunArtifacts({
  artifacts,
  onOpen,
}: {
  artifacts: ArtifactSummary[];
  onOpen: (artifactId: string) => void;
}) {
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
          <Button variant="outline" size="sm" onClick={() => onOpen(artifact.id)}>
            <ExternalLink data-icon="inline-start" />
            Open
          </Button>
        </div>
      ))}
    </div>
  );
}
