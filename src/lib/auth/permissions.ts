import type { User } from "@/types/auth";

export const isAdmin = (user: User | null | undefined) => user?.role === "admin";
export const canManageUser = (actor: User, target: User) =>
  actor.role === "admin" && actor.id !== target.id;
