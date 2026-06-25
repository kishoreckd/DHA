"use client";

import Link from "next/link";
import { ArrowRight, KeyRound, Play, ShieldCheck, UserRound, Users } from "lucide-react";
import { PageHeader } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";

export function DashboardPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS OVERVIEW"
        title={`Welcome${user?.first_name ? `, ${user.first_name}` : ""}`}
        description="Run the currently available assessment tools and manage your account."
        actions={<Link className="button primary" href="/tools/sync"><Play />Start tool sync</Link>}
      />
      <section className="metric-row api-summary" aria-label="Available API capabilities">
        <article><span><Play /></span><div><small>Assessment tools</small><strong>12 crawler APIs</strong><p>Run one or more tools against a target URL</p></div></article>
        <article><span><UserRound /></span><div><small>Account</small><strong>{user?.role || "User"}</strong><p>Profile and password APIs are available</p></div></article>
        <article><span><ShieldCheck /></span><div><small>Session security</small><strong>HTTP-only cookie</strong><p>Tokens stay outside browser JavaScript</p></div></article>
        {user?.role === "admin" && <article><span><Users /></span><div><small>Administration</small><strong>User APIs</strong><p>Users, invitations, roles, and audit logs</p></div></article>}
      </section>
      <div className="dashboard-layout">
        <section className="panel span-two">
          <header><div><span className="eyebrow">AVAILABLE NOW</span><h2>Assessment tool synchronization</h2><p>Use the crawler endpoints currently provided by the backend.</p></div></header>
          <div className="workflow-steps">
            {[
              ["01", "Enter a website", "Provide one complete target URL for the assessment."],
              ["02", "Select tools", "Choose from the crawler services supported by the backend."],
              ["03", "Run securely", "Next.js attaches the server-only crawler API key."],
            ].map(([number, title, description]) => <div key={number}><b>{number}</b><span><strong>{title}</strong><p>{description}</p></span></div>)}
          </div>
          <Link className="text-link" href="/tools/sync">Configure tool synchronization <ArrowRight /></Link>
        </section>
        <section className="panel">
          <header><div><span className="eyebrow">ACCOUNT</span><h2>Account settings</h2></div></header>
          <div className="dashboard-actions">
            <Link href="/settings/profile"><UserRound /><span><strong>Update profile</strong><small>Username, name, and profile image</small></span><ArrowRight /></Link>
            <Link href="/settings/security"><KeyRound /><span><strong>Change password</strong><small>End the current session after updating</small></span><ArrowRight /></Link>
            {user?.role === "admin" && <Link href="/admin/users"><Users /><span><strong>Manage users</strong><small>Invitations, roles, status, and logs</small></span><ArrowRight /></Link>}
          </div>
        </section>
        <section className="panel span-three connection-note">
          <div><strong>Only backend-supported features are enabled</strong><p>Authentication, profile management, user administration, audit logs, and crawler requests are connected through server-side route handlers.</p></div>
          <Link className="button secondary" href="/tools/sync">Open tool sync</Link>
        </section>
      </div>
    </>
  );
}
