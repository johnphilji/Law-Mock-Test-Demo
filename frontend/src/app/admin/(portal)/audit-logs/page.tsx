"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, DataTable, Breadcrumbs, SearchInput, Pagination, type Column } from "@/components/ui/components";
import { Select } from "@/components/ui/input";
import { formatDateTime } from "@/utils/formatters";
import { Shield, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RealAuditLogItem {
  id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: any;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<RealAuditLogItem[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.set("search", search.trim());
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch audit logs (${res.status})`);
      }

      const data = await res.json();
      setLogs(data.logs || []);
      if (data.actions && Array.isArray(data.actions)) {
        setActions(data.actions);
      }
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs from database");
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionOptions = [
    { value: "", label: "All Audit Actions" },
    ...actions.map((a) => ({ value: a, label: a.replace(/_/g, " ") })),
  ];

  const columns: Column<RealAuditLogItem>[] = [
    { key: "time", header: "Timestamp (UTC)", render: (r) => (
      <span className="text-xs text-muted-foreground font-mono">{formatDateTime(r.createdAt)}</span>
    ), className: "w-44" },
    { key: "actor", header: "Administrator", render: (r) => (
      <div>
        <p className="text-xs font-semibold text-foreground">{r.actorName}</p>
        <p className="text-[11px] text-muted-foreground">{r.actorEmail}</p>
      </div>
    ), className: "w-44" },
    { key: "action", header: "Action Taken", render: (r) => (
      <Badge variant="outline">{r.action.replace(/_/g, " ")}</Badge>
    )},
    { key: "entity", header: "Target Entity", render: (r) => (
      <div>
        <span className="text-xs font-semibold text-slate-800">{r.entityType}</span>
        {r.entityId && (
          <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
            ({r.entityId.slice(0, 8)}...)
          </span>
        )}
      </div>
    ), className: "w-36" },
    { key: "metadata", header: "Payload Details", render: (r) => (
      r.metadata ? (
        <span className="text-xs text-muted-foreground font-mono line-clamp-1">
          {JSON.stringify(r.metadata)}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    )},
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Audit Logs" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Immutable Audit Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Security audit trail of all administrative updates, publications, and access events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
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
            <p className="font-semibold">Failed to fetch audit log records</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchLogs} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <SearchInput
              value={search}
              onChange={(s) => { setSearch(s); setPage(1); }}
              placeholder="Search audit trail by actor or action..."
              className="flex-1"
            />
            {actions.length > 0 && (
              <Select
                id="filter-action"
                options={actionOptions}
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-56 text-xs"
              />
            )}
          </div>
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Querying immutable audit records from PostgreSQL...</p>
            </div>
          ) : logs.length > 0 ? (
            <DataTable columns={columns} data={logs} emptyTitle="No audit logs found" />
          ) : (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Shield className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No audit log records yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search ? "No audit events match your filter." : "Administrative mutations will be immutably recorded here."}
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
    </div>
  );
}
