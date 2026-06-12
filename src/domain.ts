import { z } from "zod";

export const roles = ["platform_admin", "organization_admin", "analyst", "reviewer", "client_viewer"] as const;
export type Role = (typeof roles)[number];
export type JobState = "queued" | "running" | "waiting_for_input" | "completed" | "failed" | "cancelled";
export type PageStatus = "draft" | "needs_review" | "approved" | "published";

export interface ReportPage {
  id: string;
  templateId: string;
  title: string;
  group: string;
  status: PageStatus;
  visibility: "internal" | "client";
  score: number;
  summary: string;
  metrics: { label: string; value: string; delta: string; positive: boolean }[];
}

export interface Job {
  id: string;
  type: string;
  label: string;
  state: JobState;
  progress?: number;
  updatedAt: string;
}

export interface ClientWorkspace {
  id: string;
  name: string;
  industry: string;
  domain: string;
  owner: string;
  status: "active" | "archived";
  healthScore: number;
  activeEngagement: string;
  reportCount: number;
  memberCount: number;
  updatedAt: string;
}

export interface AppState {
  signedIn: boolean;
  role: Role;
  selectedWorkspaceId: string;
  workspaces: ClientWorkspace[];
  workspaceName: string;
  runLabel: string;
  baselineLocked: boolean;
  assessmentStatus: "draft" | "in_review" | "changes_requested" | "approved" | "published";
  pages: ReportPage[];
  jobs: Job[];
  notifications: { id: string; title: string; message: string; read: boolean }[];
  shareToken?: string;
  shareCreatedAt?: string;
  shareExpiresAt?: string;
}

export const reportPageSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  title: z.string(),
  group: z.string(),
  status: z.enum(["draft", "needs_review", "approved", "published"]),
  visibility: z.enum(["internal", "client"]),
  score: z.number().min(0).max(100),
  summary: z.string(),
  metrics: z.array(z.object({ label: z.string(), value: z.string(), delta: z.string(), positive: z.boolean() })),
});

export const appStateSchema = z.object({
  signedIn: z.boolean(),
  role: z.enum(roles),
  selectedWorkspaceId: z.string(),
  workspaces: z.array(z.object({
    id: z.string(), name: z.string(), industry: z.string(), domain: z.string(),
    owner: z.string(), status: z.enum(["active", "archived"]), healthScore: z.number(),
    activeEngagement: z.string(), reportCount: z.number(), memberCount: z.number(), updatedAt: z.string(),
  })),
  workspaceName: z.string(),
  runLabel: z.string(),
  baselineLocked: z.boolean(),
  assessmentStatus: z.enum(["draft", "in_review", "changes_requested", "approved", "published"]),
  pages: z.array(reportPageSchema),
  jobs: z.array(z.object({
    id: z.string(), type: z.string(), label: z.string(),
    state: z.enum(["queued", "running", "waiting_for_input", "completed", "failed", "cancelled"]),
    progress: z.number().optional(), updatedAt: z.string(),
  })),
  notifications: z.array(z.object({ id: z.string(), title: z.string(), message: z.string(), read: z.boolean() })),
  shareToken: z.string().optional(),
  shareCreatedAt: z.string().optional(),
  shareExpiresAt: z.string().optional(),
});

export const capabilities: Record<Role, string[]> = {
  platform_admin: ["edit", "review", "approve", "publish", "manage", "retry"],
  organization_admin: ["edit", "review", "approve", "publish", "manage", "retry"],
  analyst: ["edit", "review", "retry"],
  reviewer: ["review", "approve"],
  client_viewer: [],
};

export const can = (role: Role, capability: string) => capabilities[role].includes(capability);

const metric = (label: string, value: string, delta: string, positive = true) => ({ label, value, delta, positive });
export const seedState: AppState = {
  signedIn: true,
  role: "analyst",
  selectedWorkspaceId: "lysol",
  workspaces: [
    { id: "lysol", name: "Lysol", industry: "Consumer health", domain: "lysol.com", owner: "Alex Smith", status: "active", healthScore: 78, activeEngagement: "June 2026 Digital Assessment", reportCount: 4, memberCount: 8, updatedAt: "Today" },
    { id: "northstar-health", name: "Northstar Health", industry: "Healthcare", domain: "northstarhealth.com", owner: "Priya Rao", status: "active", healthScore: 84, activeEngagement: "Patient experience benchmark", reportCount: 7, memberCount: 12, updatedAt: "Yesterday" },
    { id: "greenline-home", name: "Greenline Home", industry: "Consumer goods", domain: "greenlinehome.com", owner: "Marco Lee", status: "active", healthScore: 71, activeEngagement: "Q2 competitive review", reportCount: 3, memberCount: 6, updatedAt: "Jun 8" },
    { id: "aperture-labs", name: "Aperture Labs", industry: "Technology", domain: "aperturelabs.io", owner: "Alex Smith", status: "active", healthScore: 89, activeEngagement: "Global digital baseline", reportCount: 9, memberCount: 15, updatedAt: "Jun 5" },
  ],
  workspaceName: "Lysol",
  runLabel: "June 2026 Digital Assessment",
  baselineLocked: false,
  assessmentStatus: "draft",
  pages: [
    { id: "p1", templateId: "digital-health-assessment.v1", title: "Digital Health Assessment", group: "Assessment", status: "draft", visibility: "client", score: 78, summary: "Lysol has a strong digital foundation with clear opportunities in performance, accessibility, and connected journeys.", metrics: [metric("Experience score", "78", "+6"), metric("Accessibility", "91%", "+4%"), metric("Page speed", "2.8s", "-0.7s"), metric("Content depth", "84%", "+9%")] },
    { id: "p2", templateId: "competitive-position-report.v1", title: "Competitive Position Report", group: "Market intelligence", status: "needs_review", visibility: "client", score: 73, summary: "Brand authority leads the category while organic discovery and retail continuity remain the largest competitive openings.", metrics: [metric("Category rank", "#2", "+1"), metric("Share of voice", "31%", "+5%"), metric("Search visibility", "67", "+8"), metric("Journey parity", "72%", "+3%")] },
    { id: "p3", templateId: "competitive-signal-dashboard.v1", title: "Competitive Signal Dashboard", group: "Market intelligence", status: "approved", visibility: "client", score: 82, summary: "Momentum is positive across owned channels, with three high-confidence signals requiring near-term action.", metrics: [metric("Positive signals", "18", "+5"), metric("Risk signals", "4", "-2"), metric("Momentum", "82", "+12"), metric("Confidence", "High", "+7%")] },
    { id: "p4", templateId: "executive-summary.v1", title: "Executive Summary", group: "Leadership", status: "draft", visibility: "client", score: 78, summary: "A focused ninety-day program can convert Lysol's category authority into a more connected, accessible, and measurable digital experience.", metrics: [metric("Overall health", "78", "+6"), metric("Priority actions", "5", "On track"), metric("Est. impact", "+14%", "High"), metric("Evidence points", "126", "+24")] },
  ],
  jobs: [
    { id: "j1", type: "tools", label: "Digital tool collection", state: "completed", progress: 100, updatedAt: "10 minutes ago" },
    { id: "j2", type: "baseline", label: "Normalize baseline metrics", state: "waiting_for_input", progress: 86, updatedAt: "4 minutes ago" },
    { id: "j3", type: "assessment", label: "Generate assessment narratives", state: "failed", progress: 62, updatedAt: "2 minutes ago" },
  ],
  notifications: [
    { id: "n1", title: "Baseline needs review", message: "Two validation issues require analyst input.", read: false },
    { id: "n2", title: "Assessment page ready", message: "Competitive Signal Dashboard is ready to preview.", read: false },
    { id: "n3", title: "Tool collection complete", message: "All 8 configured tools completed.", read: true },
  ],
};

export const loadState = (): AppState => {
  try {
    const stored = localStorage.getItem("signalops-state");
    if (stored) return appStateSchema.parse(JSON.parse(stored));
  } catch { /* use clean seed */ }
  return seedState;
};
