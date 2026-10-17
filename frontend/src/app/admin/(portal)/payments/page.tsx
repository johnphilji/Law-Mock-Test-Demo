"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, Pagination, type Column, type TabItem } from "@/components/ui/components";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { CreditCard, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RealPaymentItem {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  amountPaise: number;
  currency: string;
  status: string;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<RealPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRevenuePaise, setTotalRevenuePaise] = useState(0);
  const [counts, setCounts] = useState({ all: 0, captured: 0, failed: 0, refunded: 0 });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        tab,
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch payments (${res.status})`);
      }

      const data = await res.json();
      setPayments(data.payments || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      }
      if (data.counts) {
        setCounts(data.counts);
      }
      if (typeof data.totalCapturedRevenuePaise === "number") {
        setTotalRevenuePaise(data.totalCapturedRevenuePaise);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load payment transactions from database");
    } finally {
      setLoading(false);
    }
  }, [tab, page, search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const tabs: TabItem[] = [
    { id: "all", label: "All Transactions", count: counts.all },
    { id: "captured", label: "Captured", count: counts.captured },
    { id: "failed", label: "Failed", count: counts.failed },
    { id: "refunded", label: "Refunded", count: counts.refunded },
  ];

  const columns: Column<RealPaymentItem>[] = [
    { key: "order", header: "Order ID", render: (r) => (
      <div>
        <span className="font-mono text-xs font-semibold text-foreground">{r.razorpayOrderId}</span>
        {r.razorpayPaymentId && (
          <span className="block font-mono text-[11px] text-muted-foreground mt-0.5">
            Ref: {r.razorpayPaymentId}
          </span>
        )}
      </div>
    )},
    { key: "user", header: "Candidate", render: (r) => (
      <div>
        <p className="font-semibold text-foreground text-sm">{r.userName}</p>
        <p className="text-xs text-muted-foreground">{r.userEmail}</p>
      </div>
    )},
    { key: "amount", header: "Amount", render: (r) => (
      <span className="font-bold tabular-nums text-sm text-foreground">
        {formatCurrency(r.amountPaise)}
      </span>
    ), className: "w-28" },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.status.toLowerCase()}>{r.status}</Badge>
    ), className: "w-24" },
    { key: "plan", header: "Subscription", render: (r) => (
      r.subscriptionStatus ? (
        <Badge variant={r.subscriptionStatus.toLowerCase()}>{r.subscriptionStatus}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )
    ), className: "w-28" },
    { key: "failure", header: "Gateway Notes", render: (r) => (
      r.failureReason ? (
        <span className="text-xs text-red-600 font-medium">{r.failureReason}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )
    )},
    { key: "date", header: "Processed At", render: (r) => (
      <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
    ), className: "w-36" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Payments" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payment Records</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit candidate transactions, verified revenue receipts, and payment status history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayments}
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
            <p className="font-semibold">Failed to fetch payment ledger</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchPayments} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Summary Stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-border shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Captured Volume</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenuePaise)}</p>
          <span className="text-[11px] text-muted-foreground">Persisted in PostgreSQL</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Transactions</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{counts.all}</p>
          <span className="text-[11px] text-muted-foreground">{counts.captured} successful orders</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Failed / Refunded</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{counts.failed + counts.refunded}</p>
          <span className="text-[11px] text-muted-foreground">{counts.refunded} refunded</span>
        </div>
      </div>

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs items={tabs} active={tab} onChange={(t) => { setTab(t); setPage(1); }} />
            <SearchInput
              value={search}
              onChange={(s) => { setSearch(s); setPage(1); }}
              placeholder="Search by student, email, or order ID..."
              className="w-full sm:w-80"
            />
          </div>
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Querying verified payment ledger from PostgreSQL...</p>
            </div>
          ) : payments.length > 0 ? (
            <DataTable columns={columns} data={payments} emptyTitle="No payments found" />
          ) : (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No payment records found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search ? "No payments match your search query." : "Candidate enrollments and verified transactions will appear here."}
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
