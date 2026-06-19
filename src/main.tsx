import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ProjectsPage } from "@/pages/projects/ProjectsPage";
import { ProjectCreatePage } from "@/pages/projects/ProjectCreatePage";
import { TopPagesPage } from "@/pages/top-pages/TopPagesPage";
import { PillarsPage } from "@/pages/pillars/PillarsPage";
import { PillarDetailPage } from "@/pages/pillars/PillarDetailPage";
import { ToolsPage } from "@/pages/tools/ToolsPage";
import { SyncPage } from "@/pages/sync/SyncPage";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<ProjectCreatePage />} />
          <Route path="/projects/:projectId/top-pages" element={<TopPagesPage />} />
          <Route path="/projects/:projectId/pillars" element={<PillarsPage />} />
          <Route path="/projects/:projectId/pillars/:pillarId" element={<PillarDetailPage />} />
          <Route path="/projects/:projectId/tools" element={<ToolsPage />} />
          <Route path="/projects/:projectId/sync" element={<SyncPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
