import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { PillarPage } from "@/data/types";

const statusVariant = {
  Synced: "success",
  "Needs sync": "warning",
  Draft: "outline",
  "Missing evidence": "danger",
} as const;

export function MetricCard({ page }: { page: PillarPage }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-primary">{page.code}</div>
            <CardTitle className="mt-1 leading-5">{page.title}</CardTitle>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">{page.summary}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Baseline score</span>
            <span className="text-muted-foreground">{page.score}/100</span>
          </div>
          <Progress value={page.score} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{page.pillar}</Badge>
          <Badge variant={statusVariant[page.syncStatus]}>{page.syncStatus}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
