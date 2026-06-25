import { describe, expect, it } from "vitest";
import { canManageUser, isAdmin } from "./permissions";
import type { User } from "@/types/auth";

const user = (id: string, role: User["role"]): User => ({
  id,
  role,
  username: null,
  email: `${id}@example.com`,
  display_name: null,
  first_name: null,
  last_name: null,
  profile_image: null,
  status: "active",
  is_active: true,
  is_verified: true,
  invited_by: null,
  invited_at: null,
  last_login: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  permissions: [],
});

describe("permissions", () => {
  it("recognizes administrators", () => {
    expect(isAdmin(user("admin", "admin"))).toBe(true);
    expect(isAdmin(user("member", "user"))).toBe(false);
  });

  it("prevents administrators from changing their own account", () => {
    const actor = user("admin", "admin");
    expect(canManageUser(actor, actor)).toBe(false);
    expect(canManageUser(actor, user("member", "user"))).toBe(true);
  });
});
