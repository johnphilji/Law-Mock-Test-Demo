"use client";

import { useState } from "react";
import { Card, Badge, DataTable, Breadcrumbs, SearchInput, Pagination, type Column } from "@/components/ui/components";
import { Select } from "@/components/ui/input";
import { mockAuditLogs, type MockAuditLog } from "@/lib/mock-data";
import { formatDateTime } from "@/utils/formatters";

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  const actions = [...new Set(mockAuditLogs.map((l) => l.action))];
  const actionOptions = [
    { value: "", label: "All Actions" },
    ...actions.map((a) => ({ value: a, label: a.replace(/_/g, " ") })),
  ];

  const filtered = mockAuditLogs.filter((l) => {
    if (search && !l.actorName.toLowerCase().includes(search.toLowerCase()) && !l.action.toLowerCase().includes(search.toLowerCase())) return false;
    if (actionFilter && l.action !== actionFilter) return false;
    return true;
  });

  const columns: Column<MockAuditLog>[] = [
    { key: "time", header: "Timestamp", render: (r) => (
      <span className="text-xs text-muted-foreground font-mono">{formatDateTime(r.createdAt)}</span>
    ), className: "w-40" },
    { key: "actor", header: "Actor", render: (r) => (
      <span className="text-sm font-medium">{r.actorName}</span>
    ), className: "w-32" },
    { key: "action", header: "Action", render: (r) => (
      <Badge variant="outline">{r.action.replace(/_/g, " ")}</Badge>
    )},
    { key: "entity", header: "Entity", render: (r) => (
      <div>
        <span className="text-sm">{r.entityType}</span>
        {r.entityId && <span className="text-xs text-muted-foreground ml-1.5 font-mono">{r.entityId}</span>}
      </div>
    )},
    { key: "metadata", header: "Details", render: (r) => (
      r.metadata ? (
        <span className="text-xs text-muted-foreground">{JSON.stringify(r.metadata).slice(0, 80)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    )},
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Audit Logs" }]} />
      <div>
        <h1 className="text-xl font-semibold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Immutable record of administrative actions. Logs cannot be edited or deleted.</p>
      </div>

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex flex-col sm:flex-row gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search logs..." className="flex-1" />
            <Select id="filter-action" options={actionOptions} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-48" />
          </div>
        </div>
        <div className="mt-3">
          <DataTable columns={columns} data={filtered} emptyTitle="No audit logs found" />
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <Pagination page={page} totalPages={1} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
