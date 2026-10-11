"use client";
import { Breadcrumbs, Card, Badge, DataTable, Tabs, type Column, type TabItem } from "@/components/ui/components";
import { mockSupportTickets, type MockSupportTicket } from "@/lib/mock-data";
import { formatRelative } from "@/utils/formatters";
import { useState } from "react";

export default function SupportPage() {
  const [tab, setTab] = useState("all");
  const filtered = mockSupportTickets.filter((t) => {
    if (tab === "open" && t.status !== "OPEN" && t.status !== "IN_PROGRESS") return false;
    if (tab === "resolved" && t.status !== "RESOLVED" && t.status !== "CLOSED") return false;
    return true;
  });
  const tabs: TabItem[] = [
    { id: "all", label: "All Tickets", count: mockSupportTickets.length },
    { id: "open", label: "Open", count: mockSupportTickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length },
    { id: "resolved", label: "Resolved", count: mockSupportTickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length },
  ];
  const columns: Column<MockSupportTicket>[] = [
    { key: "subject", header: "Subject", render: (r) => (
      <div><p className="font-medium text-foreground">{r.subject}</p><p className="text-xs text-muted-foreground">{r.userName}</p></div>
    )},
    { key: "category", header: "Category", render: (r) => <Badge variant="outline">{r.category}</Badge> },
    { key: "priority", header: "Priority", render: (r) => {
      const v: Record<string, string> = { LOW: "default", MEDIUM: "warning", HIGH: "danger", URGENT: "danger" };
      return <Badge variant={v[r.priority] ?? "default"}>{r.priority}</Badge>;
    }},
    { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "RESOLVED" ? "resolved" : r.status === "OPEN" ? "open" : "under-review"}>{r.status}</Badge> },
    { key: "date", header: "Created", render: (r) => <span className="text-xs text-muted-foreground">{formatRelative(r.createdAt)}</span> },
  ];
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Support" }]} />
      <div><h1 className="text-xl font-semibold text-foreground">Support Tickets</h1><p className="text-sm text-muted-foreground mt-0.5">Manage student support requests.</p></div>
      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5"><Tabs items={tabs} active={tab} onChange={setTab} /></div>
        <div className="mt-3"><DataTable columns={columns} data={filtered} emptyTitle="No tickets found" /></div>
      </Card>
    </div>
  );
}
