"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, Modal, type Column, type TabItem } from "@/components/ui/components";
import { formatDateTime, formatRelative } from "@/utils/formatters";
import { Eye, CheckCircle2, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";

interface RealObjectionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export default function ObjectionsPage() {
  const [objections, setObjections] = useState<RealObjectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [selectedObjection, setSelectedObjection] = useState<RealObjectionItem | null>(null);
  const [counts, setCounts] = useState({ all: 0, open: 0, resolved: 0 });

  const fetchObjections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support?category=QUESTION_ISSUE&tab=${tab}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch question objections (${res.status})`);
      }
      const data = await res.json();
      setObjections(data.tickets || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load objections from database");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchObjections();
  }, [fetchObjections]);

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: id, status: "RESOLVED" }),
      });
      if (!res.ok) throw new Error("Failed to update objection");
      setSelectedObjection(null);
      await fetchObjections();
    } catch (err: any) {
      alert(err.message || "Action failed");
    }
  };

  const tabs: TabItem[] = [
    { id: "all", label: "All Objections", count: counts.all },
    { id: "open", label: "Open / Under Review", count: counts.open },
    { id: "resolved", label: "Resolved", count: counts.resolved },
  ];

  const columns: Column<RealObjectionItem>[] = [
    { key: "subject", header: "Question / Subject", render: (r) => (
      <div>
        <p className="font-semibold text-foreground text-sm">{r.subject}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Category: {r.category}</p>
      </div>
    )},
    { key: "student", header: "Candidate", render: (r) => (
      <div>
        <p className="text-sm font-semibold">{r.userName}</p>
        <p className="text-xs text-muted-foreground">{r.userEmail}</p>
      </div>
    )},
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.status === "RESOLVED" ? "resolved" : r.status === "OPEN" ? "open" : "under-review"}>
        {r.status.replace(/_/g, " ")}
      </Badge>
    ), className: "w-28" },
    { key: "date", header: "Submitted", render: (r) => (
      <span className="text-xs text-muted-foreground">{formatRelative(r.createdAt)}</span>
    ), className: "w-28" },
    { key: "actions", header: "", render: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon-sm" title="Review Objection" onClick={() => setSelectedObjection(r)}>
          <Eye className="w-3.5 h-3.5" />
        </Button>
      </div>
    ), className: "w-16" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Objections" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Question Objections</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review student challenges against test answer keys, question validity, and drafting discrepancies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchObjections}
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
            <p className="font-semibold">Error querying objections</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchObjections} className="text-xs font-semibold underline">Retry</button>
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
              <p>Querying candidate objections from PostgreSQL...</p>
            </div>
          ) : objections.length > 0 ? (
            <DataTable columns={columns} data={objections} emptyTitle="No objections found" />
          ) : (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No question objections reported</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Candidate challenges against question answer keys will appear here for review.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      <Modal
        open={!!selectedObjection}
        onClose={() => setSelectedObjection(null)}
        title="Candidate Objection Review"
        size="md"
      >
        {selectedObjection && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <Badge variant={selectedObjection.status === "RESOLVED" ? "resolved" : "open"}>
                {selectedObjection.status.replace(/_/g, " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatDateTime(selectedObjection.createdAt)}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Candidate</span>
              <p className="text-sm font-semibold text-foreground">{selectedObjection.userName}</p>
              <p className="text-xs text-muted-foreground">{selectedObjection.userEmail}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Objection Details</span>
              <p className="text-sm text-foreground bg-white p-3 rounded-lg border border-border">
                {selectedObjection.subject}
              </p>
            </div>

            <div className="pt-3 flex gap-2 justify-end border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setSelectedObjection(null)}>
                Close
              </Button>
              {selectedObjection.status !== "RESOLVED" && (
                <Button size="sm" onClick={() => handleResolve(selectedObjection.id)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
