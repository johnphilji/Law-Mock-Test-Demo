"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Badge, DataTable, Breadcrumbs, Tabs, Modal, type Column, type TabItem } from "@/components/ui/components";
import { Textarea } from "@/components/ui/input";
import { mockObjections, type MockObjection } from "@/lib/mock-data";
import { formatDateTime, formatRelative } from "@/utils/formatters";
import { Eye, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ObjectionsPage() {
  const [tab, setTab] = useState("all");
  const [selectedObjection, setSelectedObjection] = useState<MockObjection | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const filtered = mockObjections.filter((o) => {
    if (tab === "open" && o.status !== "OPEN") return false;
    if (tab === "under-review" && o.status !== "UNDER_REVIEW") return false;
    if (tab === "resolved" && o.status !== "RESOLVED") return false;
    if (tab === "rejected" && o.status !== "REJECTED") return false;
    return true;
  });

  const tabs: TabItem[] = [
    { id: "all", label: "All", count: mockObjections.length },
    { id: "open", label: "Open", count: mockObjections.filter((o) => o.status === "OPEN").length },
    { id: "under-review", label: "Under Review", count: mockObjections.filter((o) => o.status === "UNDER_REVIEW").length },
    { id: "resolved", label: "Resolved", count: mockObjections.filter((o) => o.status === "RESOLVED").length },
    { id: "rejected", label: "Rejected", count: mockObjections.filter((o) => o.status === "REJECTED").length },
  ];

  const statusVariant: Record<string, string> = {
    OPEN: "open",
    UNDER_REVIEW: "under-review",
    RESOLVED: "resolved",
    REJECTED: "rejected",
  };

  const columns: Column<MockObjection>[] = [
    { key: "question", header: "Question", render: (r) => (
      <div className="max-w-xs">
        <p className="text-sm text-foreground line-clamp-1">{r.questionText}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Version: {r.questionVersionId}</p>
      </div>
    )},
    { key: "student", header: "Student", render: (r) => (
      <div>
        <p className="text-sm font-medium">{r.studentName}</p>
        <p className="text-xs text-muted-foreground">{r.studentEmail}</p>
      </div>
    )},
    { key: "objection", header: "Objection", render: (r) => (
      <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">{r.objectionText}</p>
    )},
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={statusVariant[r.status] ?? "default"}>{r.status.replace("_", " ")}</Badge>
    ), className: "w-28" },
    { key: "date", header: "Submitted", render: (r) => (
      <span className="text-xs text-muted-foreground">{formatRelative(r.submittedAt)}</span>
    )},
    { key: "actions", header: "", render: (r) => (
      <Button variant="ghost" size="icon-sm" title="View details" onClick={() => { setSelectedObjection(r); setAdminNote(r.adminNote ?? ""); }}>
        <Eye className="w-3.5 h-3.5" />
      </Button>
    ), className: "w-16" },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Objections" }]} />
      <div>
        <h1 className="text-xl font-semibold text-foreground">Objections</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Review and manage student objections to questions.</p>
      </div>

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <Tabs items={tabs} active={tab} onChange={setTab} />
        </div>
        <div className="mt-3">
          <DataTable columns={columns} data={filtered} emptyTitle="No objections found" />
        </div>
      </Card>

      {/* Objection Detail Modal */}
      <Modal
        open={!!selectedObjection}
        onClose={() => setSelectedObjection(null)}
        title="Objection Details"
        size="lg"
      >
        {selectedObjection && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={statusVariant[selectedObjection.status] ?? "default"}>
                {selectedObjection.status.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatDateTime(selectedObjection.submittedAt)}</span>
            </div>

            <div className="border border-border rounded-md p-3 bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">QUESTION</p>
              <p className="text-sm">{selectedObjection.questionText}</p>
              <div className="mt-2">
                <Link href={`/admin/questions/${selectedObjection.questionId}`} className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1">
                  View Question <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">STUDENT</p>
              <p className="text-sm">{selectedObjection.studentName} ({selectedObjection.studentEmail})</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">OBJECTION</p>
              <p className="text-sm leading-relaxed">{selectedObjection.objectionText}</p>
            </div>

            <Textarea
              id="admin-note"
              label="Admin Note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add an internal note about this objection..."
              rows={3}
            />

            {(selectedObjection.status === "OPEN" || selectedObjection.status === "UNDER_REVIEW") && (
              <div className="flex gap-2 pt-2">
                <Button variant="primary" size="sm" className="flex-1" onClick={() => setSelectedObjection(null)}>
                  <CheckCircle className="w-4 h-4" /> Resolve
                </Button>
                <Button variant="danger-outline" size="sm" className="flex-1" onClick={() => setSelectedObjection(null)}>
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
