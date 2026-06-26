import { Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/product-ui";
import type { ToolDefinition } from "../types";

export function ToolCatalog({ tools }: { tools: ToolDefinition[] }) {
  const groups = tools.reduce<Record<string, ToolDefinition[]>>((acc, tool) => {
    const metricArea = tool.metric_area || "General";
    acc[metricArea] = [...(acc[metricArea] ?? []), tool];
    return acc;
  }, {});

  if (tools.length === 0) {
    return (
      <EmptyState
        icon={<Wrench />}
        title="No tools available"
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Object.entries(groups).map(([metricArea, groupTools]) => (
        <Card key={metricArea}>
          <CardHeader>
            <CardTitle>{metricArea}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {groupTools.map((tool) => (
              <div key={tool.key} className="rounded-md border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm">{tool.name}</strong>
                  <span className="text-xs text-muted-foreground">{tool.key}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {tool.description || "No description provided."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Supports {tool.supported_page_types.join(", ") || "configured page types"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
