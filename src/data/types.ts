export type PageType = "Homepage" | "PDP" | "PLP" | "Other";
export type Severity = "Critical" | "High" | "Medium" | "Low";
export type SyncStatus = "Synced" | "Needs sync" | "Draft" | "Missing evidence";
export type ToolFeasibility = "Automate" | "Need Manual" | "Hybrid" | "Planned";

export interface Project {
  id: string;
  clientName: string;
  domain: string;
  status: "Baseline" | "Discovery" | "Active";
  folderPath: string;
  semrushStatus: SyncStatus;
  sharePointStatus: SyncStatus;
  createdAt: string;
}

export interface TopPage {
  id: string;
  url: string;
  title: string;
  traffic: string;
  keyword: string;
  pageType: PageType;
  selected: boolean;
  source: "Semrush Top Pages" | "Manual";
}

export interface MetricFinding {
  metric: string;
  mobile?: string;
  desktop?: string;
  finding?: string;
  status?: string;
  severity: Severity;
  evidence: string;
}

export interface PillarPage {
  id: string;
  code: string;
  title: string;
  pillar: string;
  pageFocus: PageType | "Domain";
  score: number;
  syncStatus: SyncStatus;
  summary: string;
  findings: MetricFinding[];
}

export interface AutomationTool {
  id: string;
  pillarGroup: string;
  metric: string;
  role: "Primary" | "Secondary" | "Support";
  name: string;
  url: string;
  feasibility: ToolFeasibility;
  api: string;
  reviewer: string;
  eta: string;
  status: "Ready" | "Blocked" | "Manual" | "Backlog";
  notes: string;
}
