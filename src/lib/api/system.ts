import { apiRequest } from "./client";

export const systemApi = {
  health: () => apiRequest<unknown>("/api/system/health"),
};
