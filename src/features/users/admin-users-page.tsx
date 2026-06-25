"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Check, Filter, LoaderCircle, MailPlus, MoreHorizontal, RefreshCw, Search, ShieldCheck, Trash2, UserCog, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";
import { canManageUser } from "@/lib/auth/permissions";
import { usersApi } from "@/lib/api/users";
import type { AuditLog, Invitation, User, UserRole } from "@/types/auth";
import { ApiError } from "@/types/api";

type Tab = "users" | "invitations" | "audit";

export function AdminUsersPage() {
  const { user: actor, isLoading: sessionLoading } = useAuth();
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>("users");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ user: User; patch: { role?: UserRole; is_active?: boolean }; label: string } | null>(null);
  const [search, setSearch] = useState("");

  const users = useQuery({ queryKey: ["users"], queryFn: usersApi.list, enabled: actor?.role === "admin" });
  const invitations = useQuery({ queryKey: ["invitations"], queryFn: usersApi.invitations, enabled: actor?.role === "admin" && tab === "invitations" });
  const audits = useQuery({ queryKey: ["audit-logs"], queryFn: usersApi.auditLogs, enabled: actor?.role === "admin" && tab === "audit" });
  const update = useMutation({
    mutationFn: ({ user, patch }: NonNullable<typeof confirm>) => usersApi.update(user.id, patch),
    onSuccess: () => { toast.success("User updated"); setConfirm(null); void client.invalidateQueries({ queryKey: ["users"] }); },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update user"),
  });

  if (sessionLoading) return <LoadingState label="Verifying administrator access…" />;
  if (actor?.role !== "admin") return <ErrorState message="You do not have permission to open user administration." />;

  return (
    <>
      <PageHeader eyebrow="ADMINISTRATION" title="Users and access" description="Manage accounts, invitations, roles, status, and authentication audit activity." actions={<button className="button primary" onClick={() => setInviteOpen(true)}><MailPlus />Invite user</button>} />
      <div className="tabs" role="tablist">
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>Users</button>
        <button className={tab === "invitations" ? "active" : ""} onClick={() => setTab("invitations")}>Pending invitations</button>
        <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>Audit logs</button>
      </div>
      {tab === "users" && <UsersTab actor={actor} query={users} search={search} setSearch={setSearch} onAction={setConfirm} />}
      {tab === "invitations" && <InvitationsTab query={invitations} />}
      {tab === "audit" && <AuditTab query={audits} />}
      {inviteOpen && <InvitePanel close={() => setInviteOpen(false)} />}
      {confirm && <div className="modal-backdrop"><div className="confirm-dialog" role="alertdialog" aria-modal="true"><span className="confirm-icon"><UserCog /></span><h2>Confirm account change</h2><p>{confirm.label} for <strong>{confirm.user.email}</strong>?</p><div className="dialog-actions"><button className="button secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="button primary" onClick={() => update.mutate(confirm)} disabled={update.isPending}>{update.isPending && <LoaderCircle className="spin" />}Confirm change</button></div></div></div>}
    </>
  );
}

function UsersTab({ actor, query, search, setSearch, onAction }: {
  actor: User;
  query: ReturnType<typeof useQuery<User[]>>;
  search: string;
  setSearch: (value: string) => void;
  onAction: (value: { user: User; patch: { role?: UserRole; is_active?: boolean }; label: string }) => void;
}) {
  const rows = useMemo(() => query.data?.filter((user) => `${user.display_name} ${user.email}`.toLowerCase().includes(search.toLowerCase())) ?? [], [query.data, search]);
  return <section className="panel table-panel"><div className="table-tools"><label className="search-box"><Search /><input placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="button secondary" onClick={() => query.refetch()}><RefreshCw />Refresh</button></div>
    {query.isLoading ? <LoadingState label="Loading users…" /> : query.isError ? <ErrorState message={(query.error as Error).message} retry={() => query.refetch()} /> : !rows.length ? <EmptyState icon={<Users />} title="No users found" description="Try another search or invite a teammate." /> :
      <div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Verified</th><th>Last login</th><th>Created</th><th>Actions</th></tr></thead><tbody>{rows.map((user) => <tr key={user.id}><td><strong>{user.display_name || user.username || "Unnamed user"}</strong></td><td>{user.email}</td><td><StatusBadge value={user.role} /></td><td><StatusBadge value={user.status} /></td><td>{user.is_verified ? <span className="verified"><Check />Yes</span> : "No"}</td><td>{formatDate(user.last_login)}</td><td>{formatDate(user.created_at)}</td><td>{canManageUser(actor, user) ? <div className="row-actions"><button title={user.role === "admin" ? "Change to user" : "Promote to admin"} onClick={() => onAction({ user, patch: { role: user.role === "admin" ? "user" : "admin" }, label: user.role === "admin" ? "Change this administrator to a user" : "Promote this user to administrator" })}><ShieldCheck /></button><button title={user.is_active ? "Disable user" : "Activate user"} onClick={() => onAction({ user, patch: { is_active: !user.is_active }, label: user.is_active ? "Disable this account" : "Activate this account" })}>{user.is_active ? <Ban /> : <Check />}</button></div> : <span className="self-label">Current account</span>}</td></tr>)}</tbody></table></div>}
  </section>;
}

function InvitationsTab({ query }: { query: ReturnType<typeof useQuery<Invitation[]>> }) {
  const client = useQueryClient();
  const resend = useMutation({ mutationFn: usersApi.resendInvitation, onSuccess: () => { toast.success("Invitation resent"); void client.invalidateQueries({ queryKey: ["invitations"] }); } });
  const revoke = useMutation({ mutationFn: usersApi.revokeInvitation, onSuccess: () => { toast.success("Invitation revoked"); void client.invalidateQueries({ queryKey: ["invitations"] }); } });
  if (query.isLoading) return <LoadingState label="Loading invitations…" />;
  if (query.isError) return <ErrorState message={(query.error as Error).message} retry={() => query.refetch()} />;
  return <section className="panel table-panel">{!query.data?.length ? <EmptyState icon={<MailPlus />} title="No pending invitations" description="New invitations will remain here until activated or revoked." /> : <div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Invited</th><th>Expires</th><th>Delivery</th><th>Actions</th></tr></thead><tbody>{query.data.map((invite) => { const id = invite.user_id || invite.id || ""; return <tr key={id || invite.email}><td>{invite.display_name || "—"}</td><td>{invite.email}</td><td><StatusBadge value={invite.role} /></td><td>{formatDate(invite.invited_at)}</td><td>{formatDate(invite.expires_at)}</td><td>{invite.email_delivery_status || "Queued"}</td><td><div className="row-actions"><button title="Resend invitation" onClick={() => resend.mutate(id)}><RefreshCw /></button><button title="Revoke invitation" onClick={() => revoke.mutate(id)}><Trash2 /></button></div></td></tr>; })}</tbody></table></div>}</section>;
}

function AuditTab({ query }: { query: ReturnType<typeof useQuery<AuditLog[]>> }) {
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const rows = query.data?.filter((log) => (!action || log.action.toLowerCase().includes(action.toLowerCase())) && (!actor || (log.actor_email ?? "").toLowerCase().includes(actor.toLowerCase()))) ?? [];
  if (query.isLoading) return <LoadingState label="Loading audit logs…" />;
  if (query.isError) return <ErrorState message={(query.error as Error).message} retry={() => query.refetch()} />;
  return <section className="panel table-panel"><div className="table-tools"><label className="search-box"><Filter /><input value={action} onChange={(event) => setAction(event.target.value)} placeholder="Filter by action" /></label><label className="search-box"><Search /><input value={actor} onChange={(event) => setActor(event.target.value)} placeholder="Filter by actor" /></label></div>{!rows.length ? <EmptyState icon={<ShieldCheck />} title="No audit events found" description="Adjust the filters or wait for authentication activity." /> : <div className="table-scroll"><table><thead><tr><th>Timestamp</th><th>Action</th><th>Actor</th><th>Target</th><th>Details</th></tr></thead><tbody>{rows.map((log, index) => <tr key={log.id || index}><td>{formatDate(log.timestamp)}</td><td><StatusBadge value={log.action} /></td><td>{log.actor_email || "System"}</td><td>{log.target_email || "—"}</td><td className="details-cell">{typeof log.details === "string" ? log.details : JSON.stringify(log.details)}</td></tr>)}</tbody></table></div>}</section>;
}

function InvitePanel({ close }: { close: () => void }) {
  const client = useQueryClient();
  const [form, setForm] = useState<{ email: string; display_name: string; role: UserRole }>({ email: "", display_name: "", role: "user" });
  const invite = useMutation({
    mutationFn: () => usersApi.invite(form),
    onSuccess: (data) => {
      toast.success(`Invitation created${data.email_delivery_status ? ` · ${data.email_delivery_status}` : ""}`);
      void client.invalidateQueries({ queryKey: ["invitations"] });
      window.setTimeout(close, 900);
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Invitation could not be sent"),
  });
  return <div className="modal-backdrop"><aside className="side-panel" aria-modal="true"><header><div><span className="eyebrow">NEW INVITATION</span><h2>Invite a teammate</h2><p>Assign product access before sending the activation email.</p></div><button className="icon-button" onClick={close}><MoreHorizontal /></button></header><div className="form-stack"><label>Display name<input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} /></label><label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}><option value="user">User</option><option value="admin">Admin</option></select></label><div className="role-note"><ShieldCheck /><p><strong>{form.role === "admin" ? "Administrator access" : "Standard user access"}</strong><br />{form.role === "admin" ? "Can manage users, invitations, and audit logs." : "Can sign in, manage their profile, and run assessment tools."}</p></div></div><footer><button className="button secondary" onClick={close}>Cancel</button><button className="button primary" disabled={!form.email || invite.isPending} onClick={() => invite.mutate()}>{invite.isPending && <LoaderCircle className="spin" />}Send invitation</button></footer></aside></div>;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}
