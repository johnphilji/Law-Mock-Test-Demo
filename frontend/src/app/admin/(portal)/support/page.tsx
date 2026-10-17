"use client";

import { useState, useEffect, useCallback } from "react";
import { Breadcrumbs, Card, Badge, DataTable, Tabs, type Column, type TabItem } from "@/components/ui/components";
import { formatRelative, formatDateTime } from "@/utils/formatters";
import { Headphones, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RealSupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<RealSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [counts, setCounts] = useState({ all: 0, open: 0, resolved: 0 });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support?tab=${tab}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch support tickets (${res.status})`);
      }
      const data = await res.json();
      setTickets(data.tickets || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load support tickets from database");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          status: "RESOLVED",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update ticket");
      }

      await fetchTickets();
    } catch (err: any) {
      alert(err.message || "Failed to resolve ticket");
    }
  };

  const tabs: TabItem[] = [
    { id: "all", label: "All Tickets", count: counts.all },
    { id: "open", label: "Open / In Progress", count: counts.open },
    { id: "resolved", label: "Resolved", count: counts.resolved },
  ];

  const columns: Column<RealSupportTicket>[] = [
    { key: "subject", header: "Subject & Candidate", render: (r) => (
      <div>
        <p className="font-semibold text-foreground text-sm">{r.subject}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{r.userName} ({r.userEmail})</p>
      </div>
    )},
    { key: "category", header: "Category", render: (r) => (
      <Badge variant="outline">{r.category.replace(/_/g, " ")}</Badge>
    ), className: "w-36" },
    { key: "priority", header: "Priority", render: (r) => {
      const v: Record<string, string> = { LOW: "default", MEDIUM: "warning", HIGH: "danger", URGENT: "danger" };
      return <Badge variant={v[r.priority] ?? "default"}>{r.priority}</Badge>;
    }, className: "w-24" },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.status === "RESOLVED" ? "resolved" : r.status === "OPEN" ? "open" : "under-review"}>
        {r.status.replace(/_/g, " ")}
      </Badge>
    ), className: "w-28" },
    { key: "date", header: "Created", render: (r) => (
      <span className="text-xs text-muted-foreground">{formatRelative(r.createdAt)}</span>
    ), className: "w-28" },
    { key: "actions", header: "", render: (r) => (
      r.status !== "RESOLVED" && r.status !== "CLOSED" ? (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-emerald-700 hover:text-emerald-800 gap-1"
            onClick={() => handleResolveTicket(r.id)}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
          </Button>
        </div>
      ) : null
    ), className: "w-24" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Support" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Support Tickets</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage candidate inquiry tickets, proctoring issues, payment questions, and technical help requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
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
            <p className="font-semibold">Failed to fetch support tickets</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchTickets} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <Tabs items={tabs} active={tab} onChange={setTab} />
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Querying candidate support tickets from PostgreSQL...</p>
            </div>
          ) : tickets.length > 0 ? (
            <DataTable columns={columns} data={tickets} emptyTitle="No support tickets found" />
          ) : (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Headphones className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No support tickets found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Candidate support requests and examination assistance inquiries will appear here.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
