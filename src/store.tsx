/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadState, seedState, type AppState, type ClientWorkspace, type ReportPage, type Role } from "./domain";

interface StoreValue {
  state: AppState;
  setRole: (role: Role) => void;
  selectWorkspace: (id: string) => void;
  addWorkspace: (workspace: Omit<ClientWorkspace, "id" | "healthScore" | "reportCount" | "memberCount" | "updatedAt" | "status" | "activeEngagement">) => string;
  signIn: () => void;
  signOut: () => void;
  updatePage: (id: string, patch: Partial<ReportPage>) => void;
  addPage: () => void;
  movePage: (id: string, direction: -1 | 1) => void;
  retryJob: (id: string) => void;
  lockBaseline: () => void;
  setAssessmentStatus: (status: AppState["assessmentStatus"]) => void;
  createShareLink: () => string;
  publish: () => string;
  markRead: () => void;
  reset: () => void;
}

const Store = createContext<StoreValue | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState);
  useEffect(() => localStorage.setItem("signalops-state", JSON.stringify(state)), [state]);
  const patch = (next: Partial<AppState>) => setState((s) => ({ ...s, ...next }));
  const updatePage = (id: string, pagePatch: Partial<ReportPage>) => setState((s) => ({ ...s, pages: s.pages.map((p) => p.id === id ? { ...p, ...pagePatch } : p) }));
  const addPage = () => setState((s) => ({ ...s, pages: [...s.pages, { ...s.pages[3], id: crypto.randomUUID(), title: "Custom Analysis", templateId: "custom-analysis.v1", status: "draft" }] }));
  const movePage = (id: string, direction: -1 | 1) => setState((s) => {
    const pages = [...s.pages]; const index = pages.findIndex((p) => p.id === id); const target = index + direction;
    if (target >= 0 && target < pages.length) [pages[index], pages[target]] = [pages[target], pages[index]];
    return { ...s, pages };
  });
  const retryJob = (id: string) => setState((s) => ({ ...s, jobs: s.jobs.map((j) => j.id === id ? { ...j, state: "running", progress: 72, updatedAt: "just now" } : j), notifications: [{ id: crypto.randomUUID(), title: "Job restarted", message: "Generation is running again.", read: false }, ...s.notifications] }));
  const selectWorkspace = (id: string) => setState((s) => {
    const workspace = s.workspaces.find((item) => item.id === id);
    return workspace ? { ...s, selectedWorkspaceId: id, workspaceName: workspace.name } : s;
  });
  const addWorkspace: StoreValue["addWorkspace"] = (workspace) => {
    const id = `${workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString().slice(-4)}`;
    const next: ClientWorkspace = { ...workspace, id, status: "active", healthScore: 0, activeEngagement: "No active engagement", reportCount: 0, memberCount: 1, updatedAt: "Just now" };
    setState((s) => ({ ...s, workspaces: [next, ...s.workspaces], selectedWorkspaceId: id, workspaceName: next.name }));
    return id;
  };
  const createShareLink = () => {
    const token = state.shareToken ?? `${state.selectedWorkspaceId}-${crypto.randomUUID().slice(0, 8)}`;
    patch({ shareToken: token, shareCreatedAt: state.shareCreatedAt ?? new Date().toISOString(), shareExpiresAt: state.shareExpiresAt ?? new Date(Date.now() + 30 * 86400000).toISOString() });
    return token;
  };
  const publish = () => {
    const token = createShareLink();
    patch({ assessmentStatus: "published", pages: state.pages.map((p) => ({ ...p, status: "published" })) });
    return token;
  };
  return <Store.Provider value={{ state, setRole: (role) => patch({ role }), selectWorkspace, addWorkspace, signIn: () => patch({ signedIn: true }), signOut: () => patch({ signedIn: false }), updatePage, addPage, movePage, retryJob, lockBaseline: () => patch({ baselineLocked: true }), setAssessmentStatus: (assessmentStatus) => patch({ assessmentStatus }), createShareLink, publish, markRead: () => patch({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }), reset: () => setState(seedState) }}>{children}</Store.Provider>;
}
export const useStore = () => {
  const value = useContext(Store);
  if (!value) throw new Error("StoreProvider missing");
  return value;
};
