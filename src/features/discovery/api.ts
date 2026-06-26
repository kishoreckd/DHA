import { staticDha } from "@/lib/static-dha";
import type {
  Competitor,
  DiscoveredPage,
  PageType,
  WebsiteProperty,
} from "./types";

export const propertiesApi = {
  list: (workspaceId: string): Promise<WebsiteProperty[]> => staticDha.properties.list(workspaceId),
  create: (workspaceId: string, input: { name?: string; url: string }) =>
    staticDha.properties.create(workspaceId, input),
  get: (workspaceId: string, propertyId: string) =>
    staticDha.properties.get(workspaceId, propertyId),
  update: (workspaceId: string, propertyId: string, input: Partial<WebsiteProperty>) =>
    staticDha.properties.update(workspaceId, propertyId, input),
};

export const competitorsApi = {
  list: (workspaceId: string): Promise<Competitor[]> => staticDha.competitors.list(workspaceId),
  suggest: (workspaceId: string, input: { property_id?: string }) => {
    void input;
    return staticDha.competitors.suggest(workspaceId);
  },
  create: (workspaceId: string, input: { name: string; url: string }) =>
    staticDha.competitors.create(workspaceId, input),
  update: (workspaceId: string, competitorId: string, input: Partial<Competitor>) =>
    staticDha.competitors.update(workspaceId, competitorId, input),
};

export const discoveryApi = {
  startJob: (workspaceId: string, input: { property_id: string }) =>
    staticDha.discovery.startJob(workspaceId, input),
  getJob: (workspaceId: string, jobId: string) =>
    staticDha.discovery.getJob(workspaceId, jobId),
  pages: (workspaceId: string, propertyId?: string): Promise<DiscoveredPage[]> =>
    staticDha.discovery.pages(workspaceId, propertyId),
  updatePage: (
    workspaceId: string,
    pageId: string,
    input: Partial<Pick<DiscoveredPage, "page_type" | "status" | "selected_for_assessment">>,
  ) =>
    staticDha.discovery.updatePage(workspaceId, pageId, input),
  addManualPage: (workspaceId: string, input: { property_id: string; url: string; page_type: PageType }) =>
    staticDha.discovery.addManualPage(workspaceId, input),
};

export const scopeApi = {
  create: (workspaceId: string, input: { property_page_ids: string[]; competitor_page_ids: string[] }) =>
    staticDha.scopes.create(workspaceId, input),
  get: (workspaceId: string, scopeId: string) =>
    staticDha.scopes.get(workspaceId, scopeId),
};
