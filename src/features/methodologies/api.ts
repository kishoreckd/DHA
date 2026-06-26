import { staticDha } from "@/lib/static-dha";
import type {
  AdminToolDefinition,
  Methodology,
  MetricDefinition,
} from "./types";

export const methodologiesApi = {
  list: (): Promise<Methodology[]> => staticDha.methodologies.list(),
  create: (input: { name: string; description?: string }) =>
    staticDha.methodologies.create(input),
  clone: (methodologyId: string) =>
    staticDha.methodologies.clone(methodologyId),
  get: (methodologyId: string): Promise<Methodology> => staticDha.methodologies.get(methodologyId),
  update: (methodologyId: string, input: Partial<Pick<Methodology, "name" | "description">>) =>
    staticDha.methodologies.update(methodologyId, input),
  metrics: (methodologyId: string) =>
    staticDha.methodologies.metrics(methodologyId),
  upsertMetric: (methodologyId: string, input: Partial<MetricDefinition>) =>
    staticDha.methodologies.upsertMetric(methodologyId, input),
  validate: (methodologyId: string) =>
    staticDha.methodologies.validate(methodologyId),
  publish: (methodologyId: string) =>
    staticDha.methodologies.publish(methodologyId),
  adminTools: (): Promise<AdminToolDefinition[]> => staticDha.methodologies.adminTools(),
};
