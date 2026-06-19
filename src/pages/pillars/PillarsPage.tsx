import { Link } from "react-router-dom";
import { Download, Filter, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { pillarGroups, pillarPages } from "@/data/pillars";

export function PillarsPage() {
  return (
    <>
      <PageHeader
        eyebrow="DX Health Vitals"
        title="Editable metric baseline"
        description="The Lysol DX workbook becomes editable metric pages. P01 to P13 are Experience, and the remaining pages are grouped using the automation review pillar model."
        actions={
          <>
            <Button variant="outline">
              <RefreshCcw className="h-4 w-4" />
              Sync Baseline
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Export Sheet
            </Button>
          </>
        }
      />
      <div className="page-shell">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select defaultValue="all" className="max-w-xs">
            <option value="all">All pillar groups</option>
            {pillarGroups.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </Select>
          <Select defaultValue="all" className="max-w-48">
            <option value="all">All statuses</option>
            <option>Needs sync</option>
            <option>Draft</option>
            <option>Missing evidence</option>
            <option>Synced</option>
          </Select>
        </div>

        {pillarGroups.map((group) => (
          <section key={group} className="space-y-3">
            <h2 className="text-lg font-semibold">{group}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pillarPages
                .filter((page) => page.pillar === group)
                .map((page) => (
                  <Link key={page.id} to={`/projects/lysol/pillars/${page.id}`}>
                    <MetricCard page={page} />
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
