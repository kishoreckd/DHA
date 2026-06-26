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
            <AuthFrame title="Welcome back" description="Sign in with your DHA account.">
              <LoginForm />
            </AuthFrame>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthFrame
              title="Reset your password"
              description="Enter your email and we'll send a reset link."
            >
              <ForgotPasswordForm />
            </AuthFrame>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthFrame
              title="Set a new password"
              description="Enter and confirm your new password below."
            >
              <ResetPasswordForm />
            </AuthFrame>
          }
        />
        <Route
          path="/set-password"
          element={
            <AuthFrame
              title="Activate your account"
              description="Set your username and password to get started."
            >
              <InvitationPasswordForm />
            </AuthFrame>
          }
        />
        <Route
          path="/setup/admin"
          element={
            <AuthFrame
              title="Initial setup"
              description="Create the first administrator account."
            >
              <AdminSetupForm />
            </AuthFrame>
          }
        />

        {/* Authenticated routes — wrapped in AuthGuard + ProductShell */}
        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tools/sync" element={<ToolSyncPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/security" element={<SecurityPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
