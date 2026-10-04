"use client";

import { useState } from "react";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, type Column, type TabItem } from "@/components/ui/components";
import { Button } from "@/components/ui/button";
import { mockSubscriptions, type MockSubscription } from "@/lib/mock-data";
import { formatDate, formatRelative } from "@/utils/formatters";
import { Eye } from "lucide-react";

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const filtered = mockSubscriptions.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.userName.toLowerCase().includes(q) && !s.userEmail.toLowerCase().includes(q)) return false;
    }
    if (tab !== "all" && s.status.toLowerCase() !== tab) return false;
    return true;
  });

  const tabs: TabItem[] = [
    { id: "all", label: "All", count: mockSubscriptions.length },
    { id: "active", label: "Active", count: mockSubscriptions.filter((s) => s.status === "ACTIVE").length },
    { id: "expired", label: "Expired", count: mockSubscriptions.filter((s) => s.status === "EXPIRED").length },
    { id: "refunded", label: "Refunded", count: mockSubscriptions.filter((s) => s.status === "REFUNDED").length },
  ];

  const columns: Column<MockSubscription>[] = [
    { key: "user", header: "Student", render: (r) => (
      <div>
        <p className="font-medium text-foreground">{r.userName}</p>
        <p className="text-xs text-muted-foreground">{r.userEmail}</p>
      </div>
    )},
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.status.toLowerCase()}>{r.status}</Badge>
    ), className: "w-24" },
    { key: "started", header: "Started", render: (r) => (
      <span className="text-xs text-muted-foreground">{r.startedAt ? formatDate(r.startedAt) : "—"}</span>
    )},
    { key: "expires", header: "Expires", render: (r) => (
      <span className="text-xs text-muted-foreground">{r.expiresAt ? formatDate(r.expiresAt) : "—"}</span>
    )},
    { key: "payment", header: "Payment", render: (r) => (
      <span className="font-mono text-xs text-muted-foreground">{r.paymentId ?? "—"}</span>
    )},
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Subscriptions" }]} />
      <div>
        <h1 className="text-xl font-semibold text-foreground">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">View subscription status and access entitlements.</p>
      </div>
      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs items={tabs} active={tab} onChange={setTab} />
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="w-full sm:w-64" />
          </div>
        </div>
        <div className="mt-3">
          <DataTable columns={columns} data={filtered} emptyTitle="No subscriptions found" />
        </div>
      </Card>
    </div>
  );
}
