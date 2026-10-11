"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, ConfirmDialog, type Column, type TabItem } from "@/components/ui/components";
import { mockStudents, type MockUser } from "@/lib/mock-data";
import { formatDate, formatRelative } from "@/utils/formatters";
import { Eye, UserCheck, UserX } from "lucide-react";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [confirmAction, setConfirmAction] = useState<{ user: MockUser; action: "activate" | "deactivate" } | null>(null);

  const filtered = mockStudents.filter((u) => {
    if (search) {
      const s = search.toLowerCase();
      if (!u.name.toLowerCase().includes(s) && !u.email.toLowerCase().includes(s)) return false;
    }
    if (tab === "active" && !u.isActive) return false;
    if (tab === "inactive" && u.isActive) return false;
    if (tab === "unverified" && u.isEmailVerified) return false;
    return true;
  });

  const tabs: TabItem[] = [
    { id: "all", label: "All Students", count: mockStudents.length },
    { id: "active", label: "Active", count: mockStudents.filter((u) => u.isActive).length },
    { id: "inactive", label: "Inactive", count: mockStudents.filter((u) => !u.isActive).length },
    { id: "unverified", label: "Unverified", count: mockStudents.filter((u) => !u.isEmailVerified).length },
  ];

  const columns: Column<MockUser>[] = [
    { key: "name", header: "Student", render: (r) => (
      <div>
        <p className="font-medium text-foreground">{r.name}</p>
        <p className="text-xs text-muted-foreground">{r.email}</p>
      </div>
    )},
    { key: "phone", header: "Phone", render: (r) => (
      <span className="text-sm text-muted-foreground">{r.phone ?? "—"}</span>
    ), className: "w-32" },
    { key: "verified", header: "Email", render: (r) => (
      <Badge variant={r.isEmailVerified ? "success" : "warning"}>
        {r.isEmailVerified ? "Verified" : "Unverified"}
      </Badge>
    ), className: "w-24" },
    { key: "status", header: "Account", render: (r) => (
      <Badge variant={r.isActive ? "active" : "inactive"}>
        {r.isActive ? "Active" : "Inactive"}
      </Badge>
    ), className: "w-24" },
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
        <Link href={`/admin/users/${r.id}`}>
          <Button variant="ghost" size="icon-sm" title="View details"><Eye className="w-3.5 h-3.5" /></Button>
        </Link>
        {r.isActive ? (
          <Button variant="ghost" size="icon-sm" title="Deactivate" onClick={() => setConfirmAction({ user: r, action: "deactivate" })}>
            <UserX className="w-3.5 h-3.5 text-danger-500" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" title="Activate" onClick={() => setConfirmAction({ user: r, action: "activate" })}>
            <UserCheck className="w-3.5 h-3.5 text-success-600" />
          </Button>
        )}
      </div>
    ), className: "w-24" },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Students" }]} />
      <div>
        <h1 className="text-xl font-semibold text-foreground">Students</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage student accounts and verification status.</p>
      </div>

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs items={tabs} active={tab} onChange={setTab} />
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="w-full sm:w-64" />
          </div>
        </div>
        <div className="mt-3">
          <DataTable columns={columns} data={filtered} emptyTitle="No students found" />
        </div>
      </Card>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => setConfirmAction(null)}
        title={confirmAction?.action === "deactivate" ? "Deactivate Account" : "Activate Account"}
        description={
          confirmAction?.action === "deactivate"
            ? `Are you sure you want to deactivate ${confirmAction?.user.name}'s account? They will lose access until reactivated.`
            : `Reactivate ${confirmAction?.user.name}'s account?`
        }
        confirmLabel={confirmAction?.action === "deactivate" ? "Deactivate" : "Activate"}
        variant={confirmAction?.action === "deactivate" ? "danger" : "primary"}
      />
    </div>
  );
}
