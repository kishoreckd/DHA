import { ApiError, type ApiResponse } from "@/types/api";

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => ({
    status: "error",
    message: "The server returned an unreadable response.",
    data: null,
  }))) as ApiResponse<T> & { data?: { errors?: Record<string, string[]> } | T | null };

  if (!response.ok || payload.status === "error") {
    const errors =
      payload.data && typeof payload.data === "object" && "errors" in payload.data
        ? payload.data.errors
        : undefined;
    throw new ApiError(payload.message || "Request failed", response.status, errors);
  }
  return payload.data as T;
}

export const jsonBody = (value: unknown) => JSON.stringify(value);
