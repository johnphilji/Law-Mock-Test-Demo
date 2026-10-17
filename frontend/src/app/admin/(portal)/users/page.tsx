"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, ConfirmDialog, Modal, Pagination, type Column, type TabItem } from "@/components/ui/components";
import { formatDate, formatRelative } from "@/utils/formatters";
import { Eye, UserCheck, UserX, AlertCircle, RefreshCw } from "lucide-react";

interface RealUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  attemptCount: number;
  subscriptionCount: number;
  paymentCount: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<RealUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ all: 0, active: 0, inactive: 0, unverified: 0 });
  const [selectedUser, setSelectedUser] = useState<RealUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ user: RealUser; action: "activate" | "deactivate" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        tab,
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch users (${res.status})`);
      }
      const data = await res.json();
      setUsers(data.users || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      }
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load student accounts");
    } finally {
      setLoading(false);
    }
  }, [tab, page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: confirmAction.user.id,
          isActive: confirmAction.action === "activate",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update user account");
      }

      setConfirmAction(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs: TabItem[] = [
    { id: "all", label: "All Students", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    { id: "inactive", label: "Inactive", count: counts.inactive },
    { id: "unverified", label: "Unverified", count: counts.unverified },
  ];

  const columns: Column<RealUser>[] = [
    { key: "name", header: "Student", render: (r) => (
      <div>
        <p className="font-semibold text-foreground text-sm">{r.name}</p>
        <p className="text-xs text-muted-foreground">{r.email}</p>
      </div>
    )},
    { key: "phone", header: "Phone", render: (r) => (
      <span className="text-xs text-muted-foreground">{r.phone ?? "—"}</span>
    ), className: "w-28" },
    { key: "verified", header: "Email Verification", render: (r) => (
      <Badge variant={r.isEmailVerified ? "success" : "warning"}>
        {r.isEmailVerified ? "Verified" : "Unverified"}
      </Badge>
    ), className: "w-28" },
    { key: "status", header: "Account Status", render: (r) => (
      <Badge variant={r.isActive ? "active" : "inactive"}>
        {r.isActive ? "Active" : "Inactive"}
      </Badge>
    ), className: "w-28" },
    { key: "activity", header: "Exams / Plans", render: (r) => (
      <div className="text-xs space-y-0.5">
        <span className="font-semibold text-slate-800">{r.attemptCount} attempt{r.attemptCount !== 1 ? "s" : ""}</span>
        <span className="text-muted-foreground block text-[11px]">{r.subscriptionCount} active plan{r.subscriptionCount !== 1 ? "s" : ""}</span>
      </div>
    ), className: "w-28" },
    { key: "registered", header: "Registered", render: (r) => (
      <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
    ), className: "w-28" },
    { key: "lastLogin", header: "Last Login", render: (r) => (
      <span className="text-xs text-muted-foreground">
        {r.lastLoginAt ? formatRelative(r.lastLoginAt) : "Never"}
      </span>
    ), className: "w-28" },
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <Button
          variant="ghost"
          size="icon-sm"
          title="View profile & metrics"
          onClick={() => setSelectedUser(r)}
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
        {r.isActive ? (
          <Button
            variant="ghost"
            size="icon-sm"
            title="Deactivate Account"
            onClick={() => setConfirmAction({ user: r, action: "deactivate" })}
          >
            <UserX className="w-3.5 h-3.5 text-danger-500" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            title="Activate Account"
            onClick={() => setConfirmAction({ user: r, action: "activate" })}
          >
            <UserCheck className="w-3.5 h-3.5 text-success-600" />
          </Button>
        )}
      </div>
    ), className: "w-24" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Students" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Student Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage registered law candidates, verification credentials, access states, and attempt histories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Failed to query student database</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchUsers} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs items={tabs} active={tab} onChange={(t) => { setTab(t); setPage(1); }} />
            <SearchInput
              value={search}
              onChange={(s) => { setSearch(s); setPage(1); }}
              placeholder="Search by name, email, or phone..."
              className="w-full sm:w-72"
            />
          </div>
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Querying verified student records from PostgreSQL...</p>
            </div>
          ) : users.length > 0 ? (
            <DataTable columns={columns} data={users} emptyTitle="No students found" />
          ) : (
            <div className="p-16 text-center">
              <p className="text-sm font-semibold text-slate-800">No students found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search ? "No student accounts matched your query." : "No registered student accounts in this category yet."}
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleToggleStatus}
        title={confirmAction?.action === "deactivate" ? "Deactivate Student Account" : "Activate Student Account"}
        description={
          confirmAction?.action === "deactivate"
            ? `Are you sure you want to deactivate ${confirmAction?.user.name}'s account? They will be locked out of ongoing CBT mock tests until reactivated.`
            : `Reactivate ${confirmAction?.user.name}'s account to restore examination access?`
        }
        confirmLabel={confirmAction?.action === "deactivate" ? "Deactivate" : "Activate"}
        variant={confirmAction?.action === "deactivate" ? "danger" : "primary"}
      />

      {/* Student Profile Quick View Modal */}
      <Modal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Student Record & Entitlements"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">{selectedUser.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
              </div>
              <Badge variant={selectedUser.isActive ? "active" : "inactive"}>
                {selectedUser.isActive ? "Active Account" : "Deactivated"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-muted-foreground">Phone Number</span>
                <p className="font-semibold text-foreground mt-0.5">{selectedUser.phone || "Not provided"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-muted-foreground">Email Verification</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {selectedUser.isEmailVerified ? "Verified" : "Pending Verification"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-muted-foreground">Exam Attempts</span>
                <p className="font-semibold text-foreground mt-0.5">{selectedUser.attemptCount} recorded</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-muted-foreground">Active Subscriptions</span>
                <p className="font-semibold text-foreground mt-0.5">{selectedUser.subscriptionCount} active</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 pt-1">
              <p>Registered: {formatDate(selectedUser.createdAt)}</p>
              <p>Last Activity: {selectedUser.lastLoginAt ? formatRelative(selectedUser.lastLoginAt) : "Never signed in"}</p>
            </div>

            <div className="pt-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
