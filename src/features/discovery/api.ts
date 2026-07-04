import { apiRequest, jsonBody } from "@/lib/api/client";
import type {
  AssessmentScope,
  Competitor,
  DiscoveredPage,
  DiscoveryJob,
  PageType,
  WebsiteProperty,
} from "./types";

const domainFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || url;
  }
};

const propertyUrl = (property: Partial<WebsiteProperty>) => property.root_url || property.url || "";
const competitorUrl = (competitor: Partial<Competitor>) => competitor.root_url || competitor.url || "";

function mapProperty(property: WebsiteProperty): WebsiteProperty {
  const url = propertyUrl(property);
  return {
    ...property,
    url,
    root_url: property.root_url ?? url,
    normalized_domain: property.normalized_domain || domainFromUrl(url),
  };
}

function mapCompetitor(competitor: Competitor): Competitor {
  const url = competitorUrl(competitor);
  return {
    ...competitor,
    url,
    root_url: competitor.root_url ?? url,
    normalized_domain: competitor.normalized_domain || domainFromUrl(url),
  };
}

function mapPage(page: DiscoveredPage): DiscoveredPage {
  const scopeStatus = page.scope_status ?? (page.selected_for_assessment ? "included" : page.status === "excluded" ? "excluded" : "pending");
  return {
    ...page,
    canonical_url: page.canonical_url || page.url,
    status: page.status ?? (scopeStatus === "included" ? "selected" : scopeStatus === "excluded" ? "excluded" : "discovered"),
    scope_status: scopeStatus,
    selected_for_assessment: page.selected_for_assessment ?? scopeStatus === "included",
  };
}

export const propertiesApi = {
  list: async (workspaceId: string): Promise<WebsiteProperty[]> => {
    const properties = await apiRequest<WebsiteProperty[]>(`/api/gateway/workspaces/${workspaceId}/properties`);
    return properties.map(mapProperty);
  },
  create: (workspaceId: string, input: { name?: string; url: string }) =>
    apiRequest<WebsiteProperty>(`/api/gateway/workspaces/${workspaceId}/properties`, {
      method: "POST",
      body: jsonBody({ name: input.name, root_url: input.url }),
    }).then(mapProperty),
  get: (workspaceId: string, propertyId: string) =>
    apiRequest<WebsiteProperty>(`/api/gateway/workspaces/${workspaceId}/properties/${propertyId}`).then(mapProperty),
  update: (workspaceId: string, propertyId: string, input: Partial<WebsiteProperty>) => {
    const { url, root_url, ...rest } = input;
    return apiRequest<WebsiteProperty>(`/api/gateway/workspaces/${workspaceId}/properties/${propertyId}`, {
      method: "PATCH",
      body: jsonBody({ ...rest, root_url: root_url ?? url }),
    }).then(mapProperty);
  },
};

export const competitorsApi = {
  list: async (workspaceId: string, propertyId?: string): Promise<Competitor[]> => {
    const qs = propertyId ? `?property_id=${encodeURIComponent(propertyId)}` : "";
    const competitors = await apiRequest<Competitor[]>(`/api/gateway/workspaces/${workspaceId}/competitors${qs}`);
    return competitors.map(mapCompetitor);
  },
  suggest: (workspaceId: string, input: { property_id?: string }) => {
    return apiRequest<Competitor[]>(`/api/gateway/workspaces/${workspaceId}/competitors/suggest`, {
      method: "POST",
      body: jsonBody(input),
    }).then((competitors) => competitors.map(mapCompetitor));
  },
  create: (workspaceId: string, input: { name: string; url: string; property_id?: string }) =>
    apiRequest<Competitor>(`/api/gateway/workspaces/${workspaceId}/competitors`, {
      method: "POST",
      body: jsonBody({ name: input.name, root_url: input.url, property_id: input.property_id }),
    }).then(mapCompetitor),
  update: (workspaceId: string, competitorId: string, input: Partial<Competitor>) => {
    const { url, root_url, ...rest } = input;
    return apiRequest<Competitor>(`/api/gateway/workspaces/${workspaceId}/competitors/${competitorId}`, {
      method: "PATCH",
      body: jsonBody({ ...rest, root_url: root_url ?? url }),
    }).then(mapCompetitor);
  },
};

export const discoveryApi = {
  startJob: (workspaceId: string, input: { property_id: string }) =>
    apiRequest<DiscoveryJob>(`/api/gateway/workspaces/${workspaceId}/discovery-jobs`, {
      method: "POST",
      body: jsonBody({ subject_type: "property", subject_id: input.property_id }),
    }),
  getJob: (workspaceId: string, jobId: string) =>
    apiRequest<DiscoveryJob>(`/api/gateway/workspaces/${workspaceId}/discovery-jobs/${jobId}`),
  pages: async (workspaceId: string, propertyId?: string, scopeStatus = "pending"): Promise<DiscoveredPage[]> => {
    const params = new URLSearchParams();
    if (propertyId) params.set("subject_id", propertyId);
    if (scopeStatus) params.set("scope_status", scopeStatus);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const pages = await apiRequest<DiscoveredPage[]>(`/api/gateway/workspaces/${workspaceId}/discovered-pages${qs}`);
    return pages.map(mapPage);
  },
  updatePage: (
    workspaceId: string,
    pageId: string,
    input: Partial<Pick<DiscoveredPage, "page_type" | "status" | "scope_status" | "selected_for_assessment" | "excluded_reason">>,
  ) =>
    apiRequest<DiscoveredPage>(`/api/gateway/workspaces/${workspaceId}/discovered-pages/${pageId}`, {
      method: "PATCH",
      body: jsonBody({
        page_type: input.page_type,
        scope_status:
          input.scope_status ??
          (input.selected_for_assessment ? "included" : input.status === "excluded" ? "excluded" : undefined),
        excluded_reason: input.excluded_reason,
      }),
    }).then(mapPage),
  addManualPage: (workspaceId: string, input: { property_id: string; url: string; title?: string; page_type: PageType }) =>
    apiRequest<DiscoveredPage>(`/api/gateway/workspaces/${workspaceId}/discovered-pages/manual`, {
      method: "POST",
      body: jsonBody({ url: input.url, title: input.title, page_type: input.page_type }),
    }).then(mapPage),
};

export const scopeApi = {
  create: (workspaceId: string, input: { property_id: string; notes?: string | null }) =>
    apiRequest<AssessmentScope>(`/api/gateway/workspaces/${workspaceId}/assessment-scopes`, {
      method: "POST",
      body: jsonBody(input),
    }),
  list: (workspaceId: string, propertyId?: string) => {
    const qs = propertyId ? `?property_id=${encodeURIComponent(propertyId)}` : "";
    return apiRequest<AssessmentScope[]>(`/api/gateway/workspaces/${workspaceId}/assessment-scopes${qs}`);
  },
  get: (workspaceId: string, scopeId: string) =>
    apiRequest<AssessmentScope>(`/api/gateway/workspaces/${workspaceId}/assessment-scopes/${scopeId}`),
  submit: (workspaceId: string, scopeId: string, notes?: string | null) =>
    apiRequest<AssessmentScope>(`/api/gateway/workspaces/${workspaceId}/assessment-scopes/${scopeId}/submit`, {
      method: "POST",
      body: jsonBody({ notes }),
    }),
  approve: (workspaceId: string, scopeId: string, notes?: string | null) =>
    apiRequest<AssessmentScope>(`/api/gateway/workspaces/${workspaceId}/assessment-scopes/${scopeId}/approve`, {
      method: "POST",
      body: jsonBody({ notes }),
    }),
};
