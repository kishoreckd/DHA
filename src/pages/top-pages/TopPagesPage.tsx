import { Download, RefreshCcw, Save } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { topPages } from "@/data/topPages";

const pageTypeVariant = {
  Homepage: "success",
  PDP: "warning",
  PLP: "secondary",
  Other: "outline",
} as const;

export function TopPagesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Semrush"
        title="Top Pages classification"
        description="After project creation, the backend can call Semrush Top Pages. The UI lets the team choose priority URLs and define each as Homepage, PDP, PLP, or another project-specific page type."
        actions={
          <>
            <Button variant="outline">
              <RefreshCcw className="h-4 w-4" />
              Sync Semrush
            </Button>
            <Button>
              <Save className="h-4 w-4" />
              Save Classification
            </Button>
          </>
        }
      />
      <div className="page-shell">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Imported Top Pages</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export selection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Use</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Traffic</TableHead>
                  <TableHead>Top keyword</TableHead>
                  <TableHead className="w-44">Page type</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <input className="h-4 w-4 accent-primary" type="checkbox" defaultChecked={page.selected} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{page.title}</div>
                      <div className="max-w-xl truncate text-xs text-muted-foreground">{page.url}</div>
                    </TableCell>
                    <TableCell>{page.traffic}</TableCell>
                    <TableCell>{page.keyword}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={pageTypeVariant[page.pageType]}>{page.pageType}</Badge>
                        <Select defaultValue={page.pageType} className="h-8">
                          <option>Homepage</option>
                          <option>PDP</option>
                          <option>PLP</option>
                          <option>Other</option>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>{page.source}</TableCell>
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
