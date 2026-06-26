import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Check,
  Filter,
  LoaderCircle,
  MailPlus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { appToast } from "@/lib/toast";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, TableSkeleton } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";
import { canManageUser } from "@/lib/auth/permissions";
import { usersApi } from "@/lib/api/users";
import type { AuditLog, Invitation, User, UserRole } from "@/types/auth";
import { ApiError } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Tab = "users" | "invitations" | "audit";

export function AdminUsersPage() {
  const { user: actor, isLoading: sessionLoading } = useAuth();
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>("users");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState<{
    user: User;
    patch: { role?: UserRole; is_active?: boolean };
    label: string;
  } | null>(null);
  const [search, setSearch] = useState("");

  const users = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
    enabled: actor?.role === "admin",
  });
  const invitations = useQuery({
    queryKey: ["invitations"],
    queryFn: usersApi.invitations,
    enabled: actor?.role === "admin" && tab === "invitations",
  });
  const audits = useQuery({
    queryKey: ["audit-logs"],
    queryFn: usersApi.auditLogs,
    enabled: actor?.role === "admin" && tab === "audit",
  });
  const update = useMutation({
    mutationFn: ({ user, patch }: NonNullable<typeof confirm>) =>
      usersApi.update(user.id, patch),
    onSuccess: () => {
      appToast.success("User updated");
      setConfirm(null);
      void client.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) =>
      appToast.error(error instanceof ApiError ? error.message : "Unable to update user"),
  });

  if (sessionLoading) return <LoadingState label="Verifying administrator access…" />;
  if (actor?.role !== "admin")
    return <ErrorState message="You do not have permission to open user administration." />;

  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Users and access"
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <MailPlus />
            Invite user
          </Button>
        }
      />

      {/* Tab bar */}
      <div className="flex gap-0.5 border-b border-border mb-4" role="tablist">
        {(["users", "invitations", "audit"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer bg-transparent border-0",
              tab === t
                ? "text-primary border-b-primary"
                : "text-muted-foreground border-b-transparent hover:text-foreground",
            )}
            onClick={() => setTab(t)}
          >
            {t === "users" ? "Users" : t === "invitations" ? "Pending invitations" : "Audit logs"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <UsersTab
          actor={actor}
          query={users}
          search={search}
          setSearch={setSearch}
          onAction={setConfirm}
        />
      )}
      {tab === "invitations" && <InvitationsTab query={invitations} />}
      {tab === "audit" && <AuditTab query={audits} />}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <InvitePanel close={() => setInviteOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <Dialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent className="sm:max-w-[420px] text-center">
          <div className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-primary">
              <UserCog className="h-5 w-5" />
            </span>
          </div>
          <DialogHeader>
            <DialogTitle>Confirm account change</DialogTitle>
            <DialogDescription className="text-center">
              {confirm?.label} for <strong>{confirm?.user.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => confirm && update.mutate(confirm)}
              disabled={update.isPending}
            >
              {update.isPending && <LoaderCircle className="animate-spin" />}
              Confirm change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────

function UsersTab({
  actor,
  query,
  search,
  setSearch,
  onAction,
}: {
  actor: User;
  query: ReturnType<typeof useQuery<User[]>>;
  search: string;
  setSearch: (value: string) => void;
  onAction: (value: { user: User; patch: { role?: UserRole; is_active?: boolean }; label: string }) => void;
}) {
  const rows = useMemo(
    () =>
      query.data?.filter((u) =>
        `${u.display_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    [query.data, search],
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-2.5 px-3.5 py-3 border-b border-border flex-wrap">
        <div className="relative flex-1 max-w-[360px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>
      {query.isLoading ? (
        <div className="m-5"><TableSkeleton columns={8} /></div>
      ) : query.isError ? (
        <div className="m-5"><ErrorState message={(query.error as Error).message} retry={() => query.refetch()} /></div>
      ) : !rows.length ? (
        <EmptyState icon={<Users />} title="No users found" />
      ) : (
        <div className="overflow-auto">
          <table className="w-full border-collapse min-w-[850px] text-sm">
            <thead>
              <tr className="bg-muted/50">
                {["Name", "Email", "Role", "Status", "Verified", "Last login", "Created", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3.5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground whitespace-nowrap border-b border-border"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors border-b border-border/60 last:border-0">
                  <td className="px-3.5 py-3 font-semibold whitespace-nowrap">
                    {user.display_name || user.username || "Unnamed user"}
                  </td>
                  <td className="px-3.5 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-3.5 py-3"><StatusBadge value={user.role} /></td>
                  <td className="px-3.5 py-3"><StatusBadge value={user.status} /></td>
                  <td className="px-3.5 py-3">
                    {user.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                        <Check className="h-3.5 w-3.5" /> Yes
                      </span>
                    ) : (
                      "No"
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-muted-foreground text-xs">{formatDate(user.last_login)}</td>
                  <td className="px-3.5 py-3 text-muted-foreground text-xs">{formatDate(user.created_at)}</td>
                  <td className="px-3.5 py-3">
                    {canManageUser(actor, user) ? (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title={user.role === "admin" ? "Change to user" : "Promote to admin"}
                          onClick={() =>
                            onAction({
                              user,
                              patch: { role: user.role === "admin" ? "user" : "admin" },
                              label: user.role === "admin" ? "Change this administrator to a user" : "Promote this user to administrator",
                            })
                          }
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title={user.is_active ? "Disable user" : "Activate user"}
                          onClick={() =>
                            onAction({
                              user,
                              patch: { is_active: !user.is_active },
                              label: user.is_active ? "Disable this account" : "Activate this account",
                            })
                          }
                        >
                          {user.is_active ? <Ban className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Current account</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Invitations Tab ──────────────────────────────────────────────────────────

function InvitationsTab({ query }: { query: ReturnType<typeof useQuery<Invitation[]>> }) {
  const client = useQueryClient();
  const resend = useMutation({
    mutationFn: usersApi.resendInvitation,
    onSuccess: () => {
      appToast.success("Invitation resent");
      void client.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
  const revoke = useMutation({
    mutationFn: usersApi.revokeInvitation,
    onSuccess: () => {
      appToast.success("Invitation revoked");
      void client.invalidateQueries({ queryKey: ["invitations"] });
    },
  });

  if (query.isLoading) return <TableSkeleton columns={7} />;
  if (query.isError) return <ErrorState message={(query.error as Error).message} retry={() => query.refetch()} />;

  return (
    <Card className="overflow-hidden p-0">
      {!query.data?.length ? (
        <EmptyState
          icon={<MailPlus />}
          title="No pending invitations"
        />
      ) : (
        <div className="overflow-auto">
          <table className="w-full border-collapse min-w-[750px] text-sm">
            <thead>
              <tr className="bg-muted/50">
                {["Name", "Email", "Role", "Invited", "Expires", "Delivery", "Actions"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground whitespace-nowrap border-b border-border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.data.map((invite) => {
                const id = invite.user_id || invite.id || "";
                return (
                  <tr key={id || invite.email} className="hover:bg-muted/20 border-b border-border/60 last:border-0">
                    <td className="px-3.5 py-3">{invite.display_name || "—"}</td>
                    <td className="px-3.5 py-3 text-muted-foreground">{invite.email}</td>
                    <td className="px-3.5 py-3"><StatusBadge value={invite.role} /></td>
                    <td className="px-3.5 py-3 text-muted-foreground text-xs">{formatDate(invite.invited_at)}</td>
                    <td className="px-3.5 py-3 text-muted-foreground text-xs">{formatDate(invite.expires_at)}</td>
                    <td className="px-3.5 py-3 text-muted-foreground text-xs">{invite.email_delivery_status || "Queued"}</td>
                    <td className="px-3.5 py-3">
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Resend invitation" onClick={() => resend.mutate(id)}>
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Revoke invitation" onClick={() => revoke.mutate(id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────

function AuditTab({ query }: { query: ReturnType<typeof useQuery<AuditLog[]>> }) {
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const rows =
    query.data?.filter(
      (log) =>
        (!action || log.action.toLowerCase().includes(action.toLowerCase())) &&
        (!actor || (log.actor_email ?? "").toLowerCase().includes(actor.toLowerCase())),
    ) ?? [];

  if (query.isLoading) return <TableSkeleton columns={5} />;
  if (query.isError) return <ErrorState message={(query.error as Error).message} retry={() => query.refetch()} />;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border flex-wrap">
        <div className="relative flex-1 max-w-[280px]">
          <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Filter by action"
          />
        </div>
        <div className="relative flex-1 max-w-[280px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="Filter by actor"
          />
        </div>
      </div>
      {!rows.length ? (
        <EmptyState
          icon={<ShieldCheck />}
          title="No audit events found"
        />
      ) : (
        <div className="overflow-auto">
          <table className="w-full border-collapse min-w-[750px] text-sm">
            <thead>
              <tr className="bg-muted/50">
                {["Timestamp", "Action", "Actor", "Target", "Details"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground whitespace-nowrap border-b border-border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((log, index) => (
                <tr key={log.id || index} className="hover:bg-muted/20 border-b border-border/60 last:border-0">
                  <td className="px-3.5 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.timestamp)}</td>
                  <td className="px-3.5 py-3"><StatusBadge value={log.action} /></td>
                  <td className="px-3.5 py-3 text-muted-foreground text-xs">{log.actor_email || "System"}</td>
                  <td className="px-3.5 py-3 text-muted-foreground text-xs">{log.target_email || "—"}</td>
                  <td className="px-3.5 py-3 text-xs text-muted-foreground max-w-[360px] whitespace-normal">
                    {typeof log.details === "string" ? log.details : JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Invite Panel (inside Dialog) ────────────────────────────────────────────

function InvitePanel({ close }: { close: () => void }) {
  const client = useQueryClient();
  const [form, setForm] = useState<{ email: string; display_name: string; role: UserRole }>({
    email: "",
    display_name: "",
    role: "user",
  });
  const invite = useMutation({
    mutationFn: () => usersApi.invite(form),
    onSuccess: (data) => {
      appToast.success(`Invitation created${data.email_delivery_status ? ` · ${data.email_delivery_status}` : ""}`);
      void client.invalidateQueries({ queryKey: ["invitations"] });
      window.setTimeout(close, 900);
    },
    onError: (error) =>
      appToast.error(error instanceof ApiError ? error.message : "Invitation could not be sent"),
  });

  return (
    <>
      <DialogHeader>
        <span className="text-[10px] font-extrabold tracking-widest text-primary uppercase">
          NEW INVITATION
        </span>
        <DialogTitle>Invite a teammate</DialogTitle>
        <DialogDescription>
          Assign product access before sending the activation email.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inv-display-name">Display name</Label>
          <Input
            id="inv-display-name"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inv-email">Email address</Label>
          <Input
            id="inv-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inv-role">Role</Label>
          <Select
            value={form.role}
            onValueChange={(val) => setForm({ ...form, role: val as UserRole })}
          >
            <SelectTrigger id="inv-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start gap-2.5 rounded-md bg-muted/50 p-3">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed m-0">
            <strong className="text-foreground block mb-0.5">
              {form.role === "admin" ? "Administrator access" : "Standard user access"}
            </strong>
            {form.role === "admin"
              ? "Can manage users, invitations, and audit logs."
              : "Can sign in, manage their profile, and run assessment tools."}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button disabled={!form.email || invite.isPending} onClick={() => invite.mutate()}>
          {invite.isPending && <LoaderCircle className="animate-spin" />}
          Send invitation
        </Button>
      </DialogFooter>
    </>
  );
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}
