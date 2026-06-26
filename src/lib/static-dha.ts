import type {
  AssessmentScope,
  Competitor,
  DiscoveredPage,
  DiscoveryJob,
  PageType,
  WebsiteProperty,
} from "@/features/discovery/types";
import type {
  AdminToolDefinition,
  Methodology,
  MethodologyValidation,
  MetricDefinition,
} from "@/features/methodologies/types";
import type { ToolBatch, ToolDefinition, ToolRun } from "@/features/tools/types";
import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceMember,
  WorkspacePermissions,
  WorkspaceUpdateInput,
} from "@/features/workspaces/types";

const now = "2026-06-26T09:00:00.000Z";

const delay = <T>(value: T) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(structuredClone(value)), 180);
  });

const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const normalizeDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || "new-property.local";
  }
};

let workspaces: Workspace[] = [
  {
    id: "ws-dha-retail",
    organization_id: "org-dha",
    organization: { id: "org-dha", name: "DHA Digital" },
    name: "Retail CX Assessment",
    slug: "retail-cx-assessment",
    status: "active",
    primary_domain: "https://www.nimbusretail.com",
    description: "Primary storefront and competitor assessment for the retail experience team.",
    member_count: 6,
    created_at: now,
    updated_at: now,
  },
  {
    id: "ws-health",
    organization_id: "org-dha",
    organization: { id: "org-dha", name: "DHA Digital" },
    name: "Healthcare Portal Review",
    slug: "healthcare-portal-review",
    status: "draft",
    primary_domain: "https://patient.examplehealth.com",
    description: "Portal readiness assessment before public launch.",
    member_count: 4,
    created_at: now,
    updated_at: now,
  },
];

const workspaceMembers: WorkspaceMember[] = [
  {
    id: "mem-001",
    workspace_id: "ws-dha-retail",
    user_id: "user-001",
    email: "admin@dha.local",
    display_name: "DHA Admin",
    role: "owner",
    status: "active",
    permissions: [
      "workspace.view",
      "workspace.manage",
      "discovery.run",
      "scope.approve",
      "tool.run",
      "evidence.review",
      "methodology.manage",
      "users.manage",
      "permissions.manage",
      "audit.view",
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "mem-002",
    workspace_id: "ws-dha-retail",
    user_id: "user-002",
    email: "analyst@dha.local",
    display_name: "Assessment Analyst",
    role: "analyst",
    status: "active",
    permissions: ["workspace.view", "discovery.run", "tool.run", "evidence.review"],
    created_at: now,
    updated_at: now,
  },
];

let properties: WebsiteProperty[] = [
  {
    id: "prop-nimbus",
    workspace_id: "ws-dha-retail",
    name: "Nimbus Retail",
    url: "https://www.nimbusretail.com",
    normalized_domain: "nimbusretail.com",
    status: "active",
    created_at: now,
    updated_at: now,
  },
  {
    id: "prop-portal",
    workspace_id: "ws-health",
    name: "Example Health Portal",
    url: "https://patient.examplehealth.com",
    normalized_domain: "patient.examplehealth.com",
    status: "draft",
    created_at: now,
    updated_at: now,
  },
];

let competitors: Competitor[] = [
  {
    id: "comp-peak",
    workspace_id: "ws-dha-retail",
    name: "Peak Outfitters",
    url: "https://www.peakoutfitters.example",
    normalized_domain: "peakoutfitters.example",
    status: "approved",
    source: "static-demo",
    created_at: now,
    updated_at: now,
  },
  {
    id: "comp-urban",
    workspace_id: "ws-dha-retail",
    name: "Urban Thread",
    url: "https://urbanthread.example",
    normalized_domain: "urbanthread.example",
    status: "suggested",
    source: "static-demo",
    created_at: now,
    updated_at: now,
  },
];

let discoveryJobs: DiscoveryJob[] = [
  {
    id: "disc-job-001",
    workspace_id: "ws-dha-retail",
    property_id: "prop-nimbus",
    status: "completed",
    progress: 100,
    queued_at: now,
    started_at: now,
    completed_at: now,
  },
];

let discoveredPages: DiscoveredPage[] = [
  {
    id: "page-home",
    workspace_id: "ws-dha-retail",
    property_id: "prop-nimbus",
    url: "https://www.nimbusretail.com/",
    title: "Nimbus Retail | Home",
    canonical_url: "https://www.nimbusretail.com/",
    page_type: "homepage",
    source: "sitemap",
    depth: 0,
    status: "selected",
    selected_for_assessment: true,
    last_discovered_at: now,
  },
  {
    id: "page-plp",
    workspace_id: "ws-dha-retail",
    property_id: "prop-nimbus",
    url: "https://www.nimbusretail.com/women/jackets",
    title: "Women's Jackets",
    canonical_url: "https://www.nimbusretail.com/women/jackets",
    page_type: "plp",
    source: "crawl",
    depth: 1,
    status: "selected",
    selected_for_assessment: true,
    last_discovered_at: now,
  },
  {
    id: "page-pdp",
    workspace_id: "ws-dha-retail",
    property_id: "prop-nimbus",
    url: "https://www.nimbusretail.com/products/cloud-parka",
    title: "Cloud Parka",
    canonical_url: "https://www.nimbusretail.com/products/cloud-parka",
    page_type: "pdp",
    source: "crawl",
    depth: 2,
    status: "selected",
    selected_for_assessment: true,
    last_discovered_at: now,
  },
  {
    id: "page-article",
    workspace_id: "ws-dha-retail",
    property_id: "prop-nimbus",
    url: "https://www.nimbusretail.com/journal/winter-layering",
    title: "Winter Layering Guide",
    canonical_url: "https://www.nimbusretail.com/journal/winter-layering",
    page_type: "article",
    source: "sitemap",
    depth: 1,
    status: "discovered",
    selected_for_assessment: false,
    last_discovered_at: now,
  },
];

let scopes: AssessmentScope[] = [];

const toolCatalog: ToolDefinition[] = [
  {
    key: "pagespeed",
    name: "PageSpeed Insights",
    description: "Core Web Vitals and Lighthouse lab measurements.",
    metric_area: "Performance",
    supported_page_types: ["homepage", "plp", "pdp", "landing", "article"],
    requires_browser: false,
    is_enabled: true,
  },
  {
    key: "ssllabs",
    name: "SSL Labs",
    description: "Certificate and TLS configuration checks.",
    metric_area: "Security",
    supported_page_types: ["homepage"],
    requires_browser: false,
    is_enabled: true,
  },
  {
    key: "httpsecurityheaders",
    name: "HTTP Security Headers",
    description: "Header coverage and configuration review.",
    metric_area: "Security",
    supported_page_types: ["homepage", "landing"],
    requires_browser: false,
    is_enabled: true,
  },
  {
    key: "webpage",
    name: "WebPageTest",
    description: "Synthetic load profile and waterfall artifacts.",
    metric_area: "Performance",
    supported_page_types: ["homepage", "plp", "pdp"],
    requires_browser: true,
    is_enabled: true,
  },
];

let toolRuns: ToolRun[] = [
  {
    id: "run-psi-home",
    workspace_id: "ws-dha-retail",
    batch_id: "batch-001",
    tool_key: "pagespeed",
    tool_name: "PageSpeed Insights",
    page_id: "page-home",
    page_url: "https://www.nimbusretail.com/",
    status: "completed",
    attempt: 1,
    progress: 100,
    artifacts: [
      { id: "art-psi-home-json", name: "PageSpeed raw JSON", artifact_type: "json", created_at: now },
      { id: "art-psi-home-shot", name: "Homepage screenshot", artifact_type: "image", created_at: now },
    ],
    measurements: [
      { id: "meas-lcp", metric_key: "performance.lcp", label: "Largest Contentful Paint", value: 2.4, unit: "s", extracted_at: now },
      { id: "meas-cls", metric_key: "performance.cls", label: "Cumulative Layout Shift", value: 0.08, unit: null, extracted_at: now },
    ],
    queued_at: now,
    started_at: now,
    completed_at: now,
  },
  {
    id: "run-ssl-home",
    workspace_id: "ws-dha-retail",
    batch_id: "batch-001",
    tool_key: "ssllabs",
    tool_name: "SSL Labs",
    page_id: "page-home",
    page_url: "https://www.nimbusretail.com/",
    status: "failed",
    attempt: 1,
    progress: 100,
    error: { message: "Static example: upstream quota exceeded.", code: "quota" },
    artifacts: [],
    measurements: [],
    queued_at: now,
    started_at: now,
    completed_at: now,
  },
];

let methodologies: Methodology[] = [
  {
    id: "meth-dha-2026",
    name: "DHA Digital Assessment Methodology",
    description: "Static draft of the configurable 68-metric scoring model.",
    version_number: 1,
    status: "draft",
    metric_count: 6,
    total_weight: 100,
    created_at: now,
    updated_at: now,
  },
  {
    id: "meth-dha-2025",
    name: "DHA Digital Assessment Methodology",
    description: "Published historical reference version.",
    version_number: 0,
    status: "published",
    metric_count: 6,
    total_weight: 100,
    locked_at: "2025-12-15T10:00:00.000Z",
    created_at: "2025-12-01T10:00:00.000Z",
    updated_at: "2025-12-15T10:00:00.000Z",
  },
];

let metrics: MetricDefinition[] = [
  {
    id: "metric-lcp",
    methodology_id: "meth-dha-2026",
    key: "performance.lcp",
    name: "Largest Contentful Paint",
    dimension: "Performance",
    sub_dimension: "Core Web Vitals",
    weight: 18,
    threshold: "<= 2.5s",
    formula: "tool_value <= threshold",
    mapped_tool_keys: ["pagespeed", "webpage"],
    status: "active",
    updated_at: now,
  },
  {
    id: "metric-cls",
    methodology_id: "meth-dha-2026",
    key: "performance.cls",
    name: "Cumulative Layout Shift",
    dimension: "Performance",
    sub_dimension: "Core Web Vitals",
    weight: 12,
    threshold: "<= 0.1",
    formula: "tool_value <= threshold",
    mapped_tool_keys: ["pagespeed"],
    status: "active",
    updated_at: now,
  },
  {
    id: "metric-tls",
    methodology_id: "meth-dha-2026",
    key: "security.tls",
    name: "TLS Configuration",
    dimension: "Security",
    sub_dimension: "Transport",
    weight: 20,
    threshold: "A or better",
    formula: "grade_rank >= A",
    mapped_tool_keys: ["ssllabs"],
    status: "active",
    updated_at: now,
  },
  {
    id: "metric-headers",
    methodology_id: "meth-dha-2026",
    key: "security.headers",
    name: "Security Headers",
    dimension: "Security",
    sub_dimension: "Headers",
    weight: 16,
    threshold: "Required headers present",
    formula: "missing_required_headers == 0",
    mapped_tool_keys: ["httpsecurityheaders"],
    status: "active",
    updated_at: now,
  },
  {
    id: "metric-accessibility",
    methodology_id: "meth-dha-2026",
    key: "ux.accessibility",
    name: "Accessibility Baseline",
    dimension: "User Experience",
    sub_dimension: "Accessibility",
    weight: 18,
    threshold: ">= 90",
    formula: "score >= threshold",
    mapped_tool_keys: ["pagespeed"],
    status: "active",
    updated_at: now,
  },
  {
    id: "metric-seo",
    methodology_id: "meth-dha-2026",
    key: "growth.seo",
    name: "Technical SEO",
    dimension: "Growth",
    sub_dimension: "Discoverability",
    weight: 16,
    threshold: ">= 90",
    formula: "score >= threshold",
    mapped_tool_keys: ["pagespeed"],
    status: "active",
    updated_at: now,
  },
];

const copyForPublishedMethodology = metrics.map((metric) => ({
  ...metric,
  id: `${metric.id}-published`,
  methodology_id: "meth-dha-2025",
}));
metrics = [...metrics, ...copyForPublishedMethodology];

export const staticDha = {
  workspaces: {
    list: () => delay(workspaces),
    create: (input: WorkspaceCreateInput) => {
      const workspace: Workspace = {
        id: makeId("ws"),
        organization_id: "org-dha",
        organization: { id: "org-dha", name: "DHA Digital" },
        name: input.name,
        slug: input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        status: "active",
        primary_domain: input.primary_domain || null,
        description: input.description || null,
        member_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      workspaces = [workspace, ...workspaces];
      return delay(workspace);
    },
    get: (workspaceId: string) => delay(workspaces.find((workspace) => workspace.id === workspaceId) ?? workspaces[0]),
    update: (workspaceId: string, input: WorkspaceUpdateInput) => {
      workspaces = workspaces.map((workspace) =>
        workspace.id === workspaceId ? { ...workspace, ...input, updated_at: new Date().toISOString() } : workspace,
      );
      return delay(workspaces.find((workspace) => workspace.id === workspaceId) ?? workspaces[0]);
    },
    members: (workspaceId: string) =>
      delay(workspaceMembers.filter((member) => member.workspace_id === workspaceId)),
    permissions: (workspaceId: string) => {
      const data: WorkspacePermissions = {
        workspace_id: workspaceId,
        permissions: workspaceMembers.find((member) => member.workspace_id === workspaceId)?.permissions ?? [
          "workspace.view",
          "discovery.run",
          "scope.approve",
          "tool.run",
          "evidence.review",
        ],
      };
      return delay(data);
    },
  },
  properties: {
    list: (workspaceId: string) =>
      delay(properties.filter((property) => property.workspace_id === workspaceId)),
    create: (workspaceId: string, input: { name?: string; url: string }) => {
      const property: WebsiteProperty = {
        id: makeId("prop"),
        workspace_id: workspaceId,
        name: input.name || normalizeDomain(input.url),
        url: input.url,
        normalized_domain: normalizeDomain(input.url),
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      properties = [property, ...properties];
      return delay(property);
    },
    get: (_workspaceId: string, propertyId: string) =>
      delay(properties.find((property) => property.id === propertyId) ?? properties[0]),
    update: (_workspaceId: string, propertyId: string, input: Partial<WebsiteProperty>) => {
      properties = properties.map((property) =>
        property.id === propertyId ? { ...property, ...input, updated_at: new Date().toISOString() } : property,
      );
      return delay(properties.find((property) => property.id === propertyId) ?? properties[0]);
    },
  },
  competitors: {
    list: (workspaceId: string) =>
      delay(competitors.filter((competitor) => competitor.workspace_id === workspaceId)),
    suggest: (workspaceId: string) =>
      delay(competitors.filter((competitor) => competitor.workspace_id === workspaceId)),
    create: (workspaceId: string, input: { name: string; url: string }) => {
      const competitor: Competitor = {
        id: makeId("comp"),
        workspace_id: workspaceId,
        name: input.name,
        url: input.url,
        normalized_domain: normalizeDomain(input.url),
        status: "suggested",
        source: "manual-static",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      competitors = [competitor, ...competitors];
      return delay(competitor);
    },
    update: (_workspaceId: string, competitorId: string, input: Partial<Competitor>) => {
      competitors = competitors.map((competitor) =>
        competitor.id === competitorId ? { ...competitor, ...input, updated_at: new Date().toISOString() } : competitor,
      );
      return delay(competitors.find((competitor) => competitor.id === competitorId) ?? competitors[0]);
    },
  },
  discovery: {
    startJob: (workspaceId: string, input: { property_id: string }) => {
      const job: DiscoveryJob = {
        id: makeId("disc-job"),
        workspace_id: workspaceId,
        property_id: input.property_id,
        status: "completed",
        progress: 100,
        queued_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
      discoveryJobs = [job, ...discoveryJobs];
      return delay(job);
    },
    getJob: (_workspaceId: string, jobId: string) =>
      delay(discoveryJobs.find((job) => job.id === jobId) ?? discoveryJobs[0]),
    pages: (workspaceId: string, propertyId?: string) =>
      delay(
        discoveredPages.filter(
          (page) => page.workspace_id === workspaceId && (!propertyId || page.property_id === propertyId),
        ),
      ),
    updatePage: (
      _workspaceId: string,
      pageId: string,
      input: Partial<Pick<DiscoveredPage, "page_type" | "status" | "selected_for_assessment">>,
    ) => {
      discoveredPages = discoveredPages.map((page) => (page.id === pageId ? { ...page, ...input } : page));
      return delay(discoveredPages.find((page) => page.id === pageId) ?? discoveredPages[0]);
    },
    addManualPage: (workspaceId: string, input: { property_id: string; url: string; page_type: PageType }) => {
      const page: DiscoveredPage = {
        id: makeId("page"),
        workspace_id: workspaceId,
        property_id: input.property_id,
        url: input.url,
        title: normalizeDomain(input.url),
        canonical_url: input.url,
        page_type: input.page_type,
        source: "manual",
        depth: 0,
        status: "selected",
        selected_for_assessment: true,
        last_discovered_at: new Date().toISOString(),
      };
      discoveredPages = [page, ...discoveredPages];
      return delay(page);
    },
  },
  scopes: {
    create: (workspaceId: string, input: { property_page_ids: string[]; competitor_page_ids: string[] }) => {
      const scope: AssessmentScope = {
        id: makeId("scope"),
        workspace_id: workspaceId,
        version_number: scopes.filter((item) => item.workspace_id === workspaceId).length + 1,
        status: "approved",
        property_page_ids: input.property_page_ids,
        competitor_page_ids: input.competitor_page_ids,
        locked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      scopes = [scope, ...scopes];
      return delay(scope);
    },
    get: (_workspaceId: string, scopeId: string) =>
      delay(scopes.find((scope) => scope.id === scopeId) ?? scopes[0]),
  },
  tools: {
    catalog: () => delay(toolCatalog),
    createBatch: (workspaceId: string, input: { tool_keys: string[]; page_ids: string[] }) => {
      const batch: ToolBatch = {
        id: makeId("batch"),
        workspace_id: workspaceId,
        status: "queued",
        tool_keys: input.tool_keys,
        page_ids: input.page_ids,
        created_at: new Date().toISOString(),
      };
      const runs = input.tool_keys.flatMap((toolKey) =>
        input.page_ids.map<ToolRun>((pageId) => {
          const page = discoveredPages.find((item) => item.id === pageId);
          const tool = toolCatalog.find((item) => item.key === toolKey);
          return {
            id: makeId("run"),
            workspace_id: workspaceId,
            batch_id: batch.id,
            tool_key: toolKey,
            tool_name: tool?.name ?? toolKey,
            page_id: pageId,
            page_url: page?.canonical_url,
            status: "queued",
            attempt: 1,
            progress: 0,
            artifacts: [],
            measurements: [],
            queued_at: new Date().toISOString(),
          };
        }),
      );
      toolRuns = [...runs, ...toolRuns];
      return delay(batch);
    },
    runs: (workspaceId: string, status?: string) =>
      delay(
        toolRuns.filter((run) => run.workspace_id === workspaceId && (!status || status === "all" || run.status === status)),
      ),
    run: (_workspaceId: string, runId: string) =>
      delay(toolRuns.find((run) => run.id === runId) ?? toolRuns[0]),
    retryRun: (_workspaceId: string, runId: string) => {
      toolRuns = toolRuns.map((run) =>
        run.id === runId
          ? { ...run, status: "queued", attempt: run.attempt + 1, error: null, queued_at: new Date().toISOString() }
          : run,
      );
      return delay(toolRuns.find((run) => run.id === runId) ?? toolRuns[0]);
    },
    cancelRun: (_workspaceId: string, runId: string) => {
      toolRuns = toolRuns.map((run) => (run.id === runId ? { ...run, status: "cancelled" } : run));
      return delay(toolRuns.find((run) => run.id === runId) ?? toolRuns[0]);
    },
    artifactUrl: (_workspaceId: string, _runId: string, artifactId: string) =>
      delay({ url: `https://example.com/static-artifacts/${artifactId}` }),
    measurements: (_workspaceId: string, runId: string) =>
      delay(toolRuns.find((run) => run.id === runId)?.measurements ?? []),
  },
  methodologies: {
    list: () => delay(methodologies),
    create: (input: { name: string; description?: string }) => {
      const methodology: Methodology = {
        id: makeId("meth"),
        name: input.name,
        description: input.description || null,
        version_number: Math.max(...methodologies.map((item) => item.version_number)) + 1,
        status: "draft",
        metric_count: 0,
        total_weight: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      methodologies = [methodology, ...methodologies];
      return delay(methodology);
    },
    clone: (methodologyId: string) => {
      const source = methodologies.find((methodology) => methodology.id === methodologyId) ?? methodologies[0];
      const clone: Methodology = {
        ...source,
        id: makeId("meth"),
        status: "draft",
        version_number: Math.max(...methodologies.map((item) => item.version_number)) + 1,
        based_on_version_id: source.id,
        locked_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      methodologies = [clone, ...methodologies];
      metrics = [
        ...metrics,
        ...metrics
          .filter((metric) => metric.methodology_id === source.id)
          .map((metric) => ({ ...metric, id: makeId("metric"), methodology_id: clone.id })),
      ];
      return delay(clone);
    },
    get: (methodologyId: string) =>
      delay(methodologies.find((methodology) => methodology.id === methodologyId) ?? methodologies[0]),
    update: (methodologyId: string, input: Partial<Pick<Methodology, "name" | "description">>) => {
      methodologies = methodologies.map((methodology) =>
        methodology.id === methodologyId
          ? { ...methodology, ...input, updated_at: new Date().toISOString() }
          : methodology,
      );
      return delay(methodologies.find((methodology) => methodology.id === methodologyId) ?? methodologies[0]);
    },
    metrics: (methodologyId: string) =>
      delay(metrics.filter((metric) => metric.methodology_id === methodologyId)),
    upsertMetric: (methodologyId: string, input: Partial<MetricDefinition>) => {
      const metric: MetricDefinition = {
        id: input.id || makeId("metric"),
        methodology_id: methodologyId,
        key: input.key || "custom.metric",
        name: input.name || "Custom Metric",
        dimension: input.dimension || "Custom",
        sub_dimension: input.sub_dimension || null,
        weight: input.weight ?? 0,
        threshold: input.threshold || null,
        formula: input.formula || null,
        mapped_tool_keys: input.mapped_tool_keys ?? [],
        status: input.status ?? "draft",
        updated_at: new Date().toISOString(),
      };
      metrics = [...metrics.filter((item) => item.id !== metric.id), metric];
      return delay(metric);
    },
    validate: (methodologyId: string) => {
      const methodologyMetrics = metrics.filter((metric) => metric.methodology_id === methodologyId);
      const totalWeight = methodologyMetrics.reduce((sum, metric) => sum + metric.weight, 0);
      const errors = totalWeight === 100 ? [] : [`Total weight is ${totalWeight}; expected 100.`];
      const warnings = methodologyMetrics.some((metric) => metric.mapped_tool_keys.length === 0)
        ? ["Some metrics do not have mapped tools."]
        : [];
      const validation: MethodologyValidation = {
        is_valid: errors.length === 0,
        total_weight: totalWeight,
        errors,
        warnings,
      };
      return delay(validation);
    },
    publish: (methodologyId: string) => {
      methodologies = methodologies.map((methodology) =>
        methodology.id === methodologyId
          ? { ...methodology, status: "published", locked_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          : methodology,
      );
      return delay(methodologies.find((methodology) => methodology.id === methodologyId) ?? methodologies[0]);
    },
    adminTools: () => {
      const tools: AdminToolDefinition[] = toolCatalog.map((tool) => ({
        key: tool.key,
        name: tool.name,
        metric_area: tool.metric_area,
        is_enabled: tool.is_enabled,
        mapped_metric_count: metrics.filter((metric) => metric.mapped_tool_keys.includes(tool.key)).length,
      }));
      return delay(tools);
    },
  },
};
