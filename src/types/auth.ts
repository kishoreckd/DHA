export type UserRole = "admin" | "user";
export type UserStatus = "invited" | "active" | "disabled";

export type User = {
  id: string;
  username: string | null;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image: string | null;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  is_verified: boolean;
  invited_by: string | null;
  invited_at: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  permissions: string[];
};

export type Invitation = {
  id?: string;
  user_id?: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  status?: string;
  expires_at: string;
  invited_at?: string;
  email_delivery_status?: string;
};

export type AuditLog = {
  id?: string;
  timestamp: string;
  action: string;
  actor_email: string | null;
  target_email: string | null;
  details: string | Record<string, unknown> | null;
};
