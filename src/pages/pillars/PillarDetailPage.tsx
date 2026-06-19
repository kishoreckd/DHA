import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileDown, RefreshCcw, Save } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pillarPages } from "@/data/pillars";

const severityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "secondary",
  Low: "outline",
} as const;

export function PillarDetailPage() {
  const { pillarId } = useParams();
  const page = pillarPages.find((item) => item.id === pillarId) ?? pillarPages[0];

  return (
    <>
      <PageHeader
        eyebrow={`${page.code} / ${page.pillar}`}
        title={page.title}
        description={page.summary}
        actions={
          <>
            <Link to="/projects/lysol/pillars">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button variant="outline">
              <RefreshCcw className="h-4 w-4" />
              Sync PDF
            </Button>
            <Button>
              <Save className="h-4 w-4" />
              Save Metric
            </Button>
          </>
        }
      />
      <div className="page-shell">
        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Editable findings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Desktop / Status</TableHead>
                    <TableHead>Finding</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {page.findings.map((finding) => (
                    <TableRow key={finding.metric}>
                      <TableCell className="min-w-44">
                        <Input defaultValue={finding.metric} />
                      </TableCell>
                      <TableCell className="min-w-28">
                        <Input defaultValue={finding.mobile ?? ""} placeholder="n/a" />
                      </TableCell>
                      <TableCell className="min-w-36">
                        <Input defaultValue={finding.desktop ?? finding.status ?? ""} placeholder="Status" />
                      </TableCell>
                      <TableCell className="min-w-[320px]">
                        <Input defaultValue={finding.finding ?? ""} />
                      </TableCell>
                      <TableCell className="min-w-36">
                        <Select defaultValue={finding.severity}>
                          <option>Critical</option>
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Metric status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Page focus</span>
                  <Badge variant="secondary">{page.pageFocus}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sync status</span>
                  <Badge variant={page.syncStatus === "Missing evidence" ? "danger" : "warning"}>
                    {page.syncStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Baseline score</span>
                  <span className="font-semibold">{page.score}/100</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Evidence mapping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {page.findings.map((finding) => (
                  <div key={finding.metric} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{finding.metric}</div>
                      <Badge variant={severityVariant[finding.severity]}>{finding.severity}</Badge>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{finding.evidence}</p>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <FileDown className="h-4 w-4" />
                  Export this metric
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
