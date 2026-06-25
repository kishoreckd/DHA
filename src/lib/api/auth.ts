import { apiRequest, jsonBody } from "./client";
import type { Invitation, User } from "@/types/auth";

export const authApi = {
  login: (input: { email: string; password: string }) =>
    apiRequest<User>("/api/auth/login", { method: "POST", body: jsonBody(input) }),
  signup: (input: { username: string; email: string; password: string }) =>
    apiRequest<User>("/api/auth/signup", { method: "POST", body: jsonBody(input) }),
  me: () => apiRequest<User>("/api/auth/session"),
  logout: () => apiRequest<null>("/api/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) =>
    apiRequest<null>("/api/auth/forgot-password", { method: "POST", body: jsonBody({ email }) }),
  resetPassword: (input: { token: string; password: string }) =>
    apiRequest<null>("/api/auth/reset-password", { method: "POST", body: jsonBody(input) }),
  verifyInvitation: (token: string) =>
    apiRequest<Invitation>(`/api/auth/invitations/verify?token=${encodeURIComponent(token)}`),
  setPassword: (input: { token: string; password: string; username: string }) =>
    apiRequest<User>("/api/auth/set-password", { method: "POST", body: jsonBody(input) }),
};
