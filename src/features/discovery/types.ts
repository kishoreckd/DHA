export type PropertyStatus = "active" | "draft" | "archived";
export type CompetitorStatus = "suggested" | "approved" | "rejected";
export type DiscoveryJobStatus = "queued" | "running" | "completed" | "partial" | "failed" | "cancelled";
export type PageType = "homepage" | "pdp" | "plp" | "landing" | "article" | "other";
export type PageStatus = "discovered" | "selected" | "excluded";
export type PageSource = "sitemap" | "crawl" | "manual";

export type WebsiteProperty = {
  id: string;
  workspace_id: string;
  name: string;
  url: string;
  normalized_domain: string;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
};

export type Competitor = {
  id: string;
  workspace_id: string;
  name: string;
  url: string;
  normalized_domain: string;
  status: CompetitorStatus;
  source?: string | null;
  created_at: string;
  updated_at: string;
};

export type DiscoveryJob = {
  id: string;
  workspace_id: string;
  property_id: string;
  status: DiscoveryJobStatus;
  progress: number | null;
  error?: { message: string } | null;
  queued_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};

export type DiscoveredPage = {
  id: string;
  workspace_id: string;
  property_id: string;
  url: string;
  title?: string | null;
  canonical_url: string;
  page_type: PageType;
  source: PageSource;
  depth: number;
  status: PageStatus;
  selected_for_assessment: boolean;
  last_discovered_at: string;
};

export type AssessmentScope = {
  id: string;
  workspace_id: string;
  version_number: number;
  status: "draft" | "approved";
  property_page_ids: string[];
  competitor_page_ids: string[];
  locked_at?: string | null;
  created_at: string;
};
