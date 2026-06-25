import { apiRequest, jsonBody } from "./client";
import type { AuditLog, Invitation, User, UserRole } from "@/types/auth";

export const usersApi = {
  list: () => apiRequest<User[]>("/api/gateway/users"),
  get: (id: string) => apiRequest<User>(`/api/gateway/users/${id}`),
  update: (id: string, input: { role?: UserRole; is_active?: boolean }) =>
    apiRequest<User>(`/api/gateway/users/${id}`, { method: "PATCH", body: jsonBody(input) }),
  updateMe: (input: Partial<Pick<User, "username" | "display_name" | "first_name" | "last_name" | "profile_image">>) =>
    apiRequest<User>("/api/gateway/users/me", { method: "PATCH", body: jsonBody(input) }),
  changePassword: (input: { current_password: string; new_password: string }) =>
    apiRequest<null>("/api/users/change-password", { method: "POST", body: jsonBody(input) }),
  invitations: () => apiRequest<Invitation[]>("/api/gateway/users/invitations"),
  invite: (input: { email: string; display_name: string; role: UserRole }) =>
    apiRequest<Invitation>("/api/gateway/users/invitations", { method: "POST", body: jsonBody(input) }),
  resendInvitation: (id: string) =>
    apiRequest<Invitation>(`/api/gateway/users/${id}/resend-invitation`, { method: "POST" }),
  revokeInvitation: (id: string) =>
    apiRequest<null>(`/api/gateway/users/${id}/invitation`, { method: "DELETE" }),
  auditLogs: () => apiRequest<AuditLog[]>("/api/gateway/users/audit-logs?limit=100"),
};
