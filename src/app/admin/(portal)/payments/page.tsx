"use client";

import { useState } from "react";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, Pagination, type Column, type TabItem } from "@/components/ui/components";
import { Select } from "@/components/ui/input";
import { mockPayments, type MockPayment } from "@/lib/mock-data";
import { formatCurrency, formatDateTime, formatRelative } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = mockPayments.filter((p) => {
    if (search) {
      const s = search.toLowerCase();
      if (!p.userName.toLowerCase().includes(s) && !p.userEmail.toLowerCase().includes(s) && !p.razorpayOrderId.toLowerCase().includes(s)) return false;
    }
    if (tab === "captured" && p.status !== "CAPTURED") return false;
    if (tab === "failed" && p.status !== "FAILED") return false;
    if (tab === "refunded" && p.status !== "REFUNDED") return false;
    return true;
  });

  const tabs: TabItem[] = [
    { id: "all", label: "All", count: mockPayments.length },
    { id: "captured", label: "Successful", count: mockPayments.filter((p) => p.status === "CAPTURED").length },
    { id: "failed", label: "Failed", count: mockPayments.filter((p) => p.status === "FAILED").length },
    { id: "refunded", label: "Refunded", count: mockPayments.filter((p) => p.status === "REFUNDED").length },
  ];

  const columns: Column<MockPayment>[] = [
    { key: "order", header: "Order ID", render: (r) => (
      <span className="font-mono text-xs text-muted-foreground">{r.razorpayOrderId}</span>
    )},
    { key: "user", header: "Student", render: (r) => (
      <div>
        <p className="font-medium text-foreground text-sm">{r.userName}</p>
        <p className="text-xs text-muted-foreground">{r.userEmail}</p>
      </div>
    )},
    { key: "amount", header: "Amount", render: (r) => (
      <span className="font-medium tabular-nums">{formatCurrency(r.amountPaise)}</span>
    ), className: "w-24" },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.status.toLowerCase()}>{r.status}</Badge>
    ), className: "w-24" },
    { key: "payment-id", header: "Payment ID", render: (r) => (
      <span className="font-mono text-xs text-muted-foreground">{r.razorpayPaymentId ?? "—"}</span>
    )},
    { key: "failure", header: "Failure Reason", render: (r) => (
      r.failureReason ? <span className="text-xs text-danger-600">{r.failureReason}</span> : <span className="text-muted-foreground">—</span>
    )},
    { key: "date", header: "Date", render: (r) => (
      <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
    )},
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Payments" }]} />
      <div>
        <h1 className="text-xl font-semibold text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">View and manage all payment transactions.</p>
      </div>

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs items={tabs} active={tab} onChange={setTab} />
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or order ID..." className="w-full sm:w-72" />
          </div>
        </div>
        <div className="mt-3">
          <DataTable columns={columns} data={filtered} emptyTitle="No payments found" />
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <Pagination page={page} totalPages={1} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
