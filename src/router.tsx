import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";

// Auth pages (public)
import { AuthFrame, LoginForm } from "@/features/auth/auth-form";
import {
  ForgotPasswordForm,
  ResetPasswordForm,
  InvitationPasswordForm,
  AdminSetupForm,
} from "@/features/auth/account-flows";

// Authenticated pages
import { AuthGuard } from "@/features/auth/auth-guard";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { ToolSyncPage } from "@/features/tools/tool-sync-page";
import { ProfilePage } from "@/features/settings/profile-page";
import { SecurityPage } from "@/features/settings/security-page";
import { AdminUsersPage } from "@/features/users/admin-users-page";
import { MethodologiesPage } from "@/pages/admin/methodologies/MethodologiesPage";
import { MethodologyCreatePage } from "@/pages/admin/methodologies/MethodologyCreatePage";
import { MethodologyDetailPage } from "@/pages/admin/methodologies/MethodologyDetailPage";
import { MethodologyMetricsPage } from "@/pages/admin/methodologies/MethodologyMetricsPage";
import { AdminToolsPage } from "@/pages/admin/tools/AdminToolsPage";
import { PermissionsPage } from "@/pages/admin/permissions/PermissionsPage";
import { AssessmentDetailPage } from "@/pages/assessments/AssessmentDetailPage";
import { AssessmentsPage } from "@/pages/assessments/AssessmentsPage";
import { BaselineDetailPage } from "@/pages/baselines/BaselineDetailPage";
import { BaselinesPage } from "@/pages/baselines/BaselinesPage";
import { CompetitorsPage } from "@/pages/competitors/CompetitorsPage";
import { CrawlerConsolePage } from "@/pages/crawler/CrawlerConsolePage";
import { DiscoveryPage } from "@/pages/discovery/DiscoveryPage";
import { ScopeReviewPage } from "@/pages/discovery/ScopeReviewPage";
import { PropertiesListPage } from "@/pages/properties/PropertiesListPage";
import { PropertyDetailPage } from "@/pages/properties/PropertyDetailPage";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import { ReviewsPage } from "@/pages/reviews/ReviewsPage";
import { ToolRunDetailPage } from "@/pages/tools/ToolRunDetailPage";
import { ToolRunsPage } from "@/pages/tools/ToolRunsPage";
import { ToolsCatalogPage } from "@/pages/tools/ToolsCatalogPage";
import { SystemHealthPage } from "@/pages/system/SystemHealthPage";
import { OperationsPage } from "@/pages/system/OperationsPage";
import { WorkspaceCreatePage } from "@/pages/workspaces/WorkspaceCreatePage";
import { WorkspaceMembersPage } from "@/pages/workspaces/WorkspaceMembersPage";
import { WorkspaceOverviewPage } from "@/pages/workspaces/WorkspaceOverviewPage";
import { WorkspaceSettingsPage } from "@/pages/workspaces/WorkspaceSettingsPage";
import { WorkspacesListPage } from "@/pages/workspaces/WorkspacesListPage";

export function AppRouter() {
  return (
    <Suspense>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public auth routes */}
        <Route
          path="/login"
          element={
            <AuthFrame title="Welcome back">
              <LoginForm />
            </AuthFrame>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthFrame title="Reset your password">
              <ForgotPasswordForm />
            </AuthFrame>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthFrame title="Set a new password">
              <ResetPasswordForm />
            </AuthFrame>
          }
        />
        <Route
          path="/set-password"
          element={
            <AuthFrame title="Activate your account">
              <InvitationPasswordForm />
            </AuthFrame>
          }
        />
        <Route
          path="/setup/admin"
          element={
            <AuthFrame title="Initial setup">
              <AdminSetupForm />
            </AuthFrame>
          }
        />

        {/* Authenticated routes — wrapped in AuthGuard + ProductShell */}
        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workspaces" element={<WorkspacesListPage />} />
          <Route path="/system/health" element={<SystemHealthPage />} />
          <Route path="/system/operations" element={<OperationsPage />} />
          <Route path="/crawler" element={<CrawlerConsolePage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/baselines" element={<BaselinesPage />} />
          <Route path="/baselines/:baselineId" element={<BaselineDetailPage />} />
          <Route path="/workspaces/new" element={<WorkspaceCreatePage />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspaceOverviewPage />} />
          <Route path="/workspaces/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
          <Route path="/workspaces/:workspaceId/members" element={<WorkspaceMembersPage />} />
          <Route path="/workspaces/:workspaceId/properties" element={<PropertiesListPage />} />
          <Route path="/workspaces/:workspaceId/properties/:propertyId" element={<PropertyDetailPage />} />
          <Route path="/workspaces/:workspaceId/discovery" element={<DiscoveryPage />} />
          <Route path="/workspaces/:workspaceId/competitors" element={<CompetitorsPage />} />
          <Route path="/workspaces/:workspaceId/scope" element={<ScopeReviewPage />} />
          <Route path="/workspaces/:workspaceId/assessments" element={<AssessmentsPage />} />
          <Route path="/workspaces/:workspaceId/assessments/:assessmentId" element={<AssessmentDetailPage />} />
          <Route path="/workspaces/:workspaceId/tools" element={<ToolsCatalogPage />} />
          <Route path="/workspaces/:workspaceId/tool-runs" element={<ToolRunsPage />} />
          <Route path="/workspaces/:workspaceId/tool-runs/:runId" element={<ToolRunDetailPage />} />
          <Route path="/workspaces/:workspaceId/reports" element={<ReportsPage />} />
          <Route path="/tools/sync" element={<ToolSyncPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/security" element={<SecurityPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/methodologies" element={<MethodologiesPage />} />
          <Route path="/admin/methodologies/new" element={<MethodologyCreatePage />} />
          <Route path="/admin/methodologies/:methodologyId" element={<MethodologyDetailPage />} />
          <Route path="/admin/methodologies/:methodologyId/metrics" element={<MethodologyMetricsPage />} />
          <Route path="/admin/tools" element={<AdminToolsPage />} />
          <Route path="/admin/permissions" element={<PermissionsPage />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
