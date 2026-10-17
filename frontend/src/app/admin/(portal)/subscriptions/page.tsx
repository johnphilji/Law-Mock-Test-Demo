"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, Pagination, type Column, type TabItem } from "@/components/ui/components";
import { formatDate } from "@/utils/formatters";
import { Key, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RealSubscriptionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  startedAt: string | null;
  expiresAt: string | null;
  paymentId: string | null;
  amountPaise: number;
  createdAt: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<RealSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ all: 0, active: 0, expired: 0, refunded: 0 });

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        tab,
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch subscriptions (${res.status})`);
      }

      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      }
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load subscriptions from database");
    } finally {
      setLoading(false);
    }
  }, [tab, page, search]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const tabs: TabItem[] = [
    { id: "all", label: "All Entitlements", count: counts.all },
    { id: "active", label: "Active Plans", count: counts.active },
    { id: "expired", label: "Expired", count: counts.expired },
    { id: "refunded", label: "Refunded", count: counts.refunded },
  ];

  const columns: Column<RealSubscriptionItem>[] = [
    { key: "user", header: "Candidate", render: (r) => (
      <div>
        <p className="font-semibold text-foreground text-sm">{r.userName}</p>
        <p className="text-xs text-muted-foreground">{r.userEmail}</p>
      </div>
    )},
    { key: "status", header: "Access Status", render: (r) => (
      <Badge variant={r.status.toLowerCase()}>{r.status}</Badge>
    ), className: "w-28" },
    { key: "started", header: "Activated On", render: (r) => (
      <span className="text-xs text-muted-foreground">{r.startedAt ? formatDate(r.startedAt) : "—"}</span>
    ), className: "w-32" },
    { key: "expires", header: "Valid Until", render: (r) => (
      <span className="text-xs text-muted-foreground">{r.expiresAt ? formatDate(r.expiresAt) : "—"}</span>
    ), className: "w-32" },
    { key: "payment", header: "Payment Ref", render: (r) => (
      <span className="font-mono text-xs text-muted-foreground">{r.paymentId ?? "—"}</span>
    )},
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Subscriptions" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Subscriptions & Entitlements</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit student test series subscriptions, active validity periods, and linked payment references.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubscriptions}
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
            <p className="font-semibold">Failed to fetch subscription records</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchSubscriptions} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs items={tabs} active={tab} onChange={(t) => { setTab(t); setPage(1); }} />
            <SearchInput
              value={search}
              onChange={(s) => { setSearch(s); setPage(1); }}
              placeholder="Search by student name or email..."
              className="w-full sm:w-72"
            />
          </div>
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Querying verified student entitlements from PostgreSQL...</p>
            </div>
          ) : subscriptions.length > 0 ? (
            <DataTable columns={columns} data={subscriptions} emptyTitle="No subscriptions found" />
          ) : (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Key className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No active entitlements found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search ? "No subscriptions match your search filter." : "Student subscriptions and test series purchases will appear here."}
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
