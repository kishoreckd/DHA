import { Link } from "react-router-dom";
import { ArrowRight, FolderPlus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { projects } from "@/data/projects";

export function ProjectsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Client project system"
        description="Each project represents a client/domain. The backend can create folders, run Semrush, maintain SharePoint evidence, and expose project-specific metrics and tools."
        actions={
          <Link to="/projects/new">
            <Button>
              <FolderPlus className="h-4 w-4" />
              Create Project
            </Button>
          </Link>
        }
      />
      <div className="page-shell">
        <Card>
          <CardHeader>
            <CardTitle>Project list</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Semrush</TableHead>
                  <TableHead>SharePoint</TableHead>
                  <TableHead className="w-28">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.clientName}</TableCell>
                    <TableCell>{project.domain}</TableCell>
                    <TableCell>
                      <Badge variant="success">{project.status}</Badge>
                    </TableCell>
                    <TableCell>{project.semrushStatus}</TableCell>
                    <TableCell>{project.sharePointStatus}</TableCell>
                    <TableCell>
                      <Link to={`/projects/${project.id}/top-pages`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
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
