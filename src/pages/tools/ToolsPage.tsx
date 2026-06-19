import { RefreshCcw, Settings2, Wrench } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { automationTools } from "@/data/tools";

const statusVariant = {
  Ready: "success",
  Blocked: "danger",
  Manual: "warning",
  Backlog: "outline",
} as const;

export function ToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Automate Review"
        title="Project tool automation"
        description="Tools from the Automate Review workbook are visible per project. This page shows what can be automated, what needs manual review, APIs, owners, ETA, and sync status."
        actions={
          <>
            <Button variant="outline">
              <Settings2 className="h-4 w-4" />
              Tool settings
            </Button>
            <Button>
              <RefreshCcw className="h-4 w-4" />
              Sync tools
            </Button>
          </>
        }
      />
      <div className="page-shell">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Automation matrix</CardTitle>
              <div className="flex gap-2">
                <Select defaultValue="all" className="w-56">
                  <option value="all">All pillar groups</option>
                  <option>Experience Quality & Platform Health</option>
                  <option>Brand Findability & Conversion</option>
                  <option>Digital Brand & Trust</option>
                </Select>
                <Select defaultValue="all" className="w-40">
                  <option value="all">All statuses</option>
                  <option>Ready</option>
                  <option>Blocked</option>
                  <option>Manual</option>
                  <option>Backlog</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric / tool</TableHead>
                  <TableHead>Pillar group</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Feasibility</TableHead>
                  <TableHead>API</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automationTools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <Wrench className="h-4 w-4 text-primary" />
                        {tool.name}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{tool.metric}</div>
                      <div className="mt-1 max-w-md text-xs text-muted-foreground">{tool.notes}</div>
                    </TableCell>
                    <TableCell>{tool.pillarGroup}</TableCell>
                    <TableCell>{tool.role}</TableCell>
                    <TableCell>
                      <Badge variant={tool.feasibility === "Automate" ? "success" : "warning"}>
                        {tool.feasibility}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-64 truncate">{tool.api || "No API"}</TableCell>
                    <TableCell>
                      <div>{tool.reviewer}</div>
                      <div className="text-xs text-muted-foreground">{tool.eta}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[tool.status]}>{tool.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
