"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, ConfirmDialog, Pagination, type Column, type TabItem } from "@/components/ui/components";
import { mockTests, type MockTest } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { Plus, Edit, Eye, Archive, MoreVertical } from "lucide-react";

export default function TestsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [confirmArchive, setConfirmArchive] = useState<MockTest | null>(null);

  const filtered = mockTests.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === "draft" && t.status !== "DRAFT") return false;
    if (tab === "published" && t.status !== "PUBLISHED") return false;
    if (tab === "archived" && t.status !== "ARCHIVED") return false;
    return true;
  });

  const tabs: TabItem[] = [
    { id: "all", label: "All Tests", count: mockTests.length },
    { id: "draft", label: "Drafts", count: mockTests.filter((t) => t.status === "DRAFT").length },
    { id: "published", label: "Published", count: mockTests.filter((t) => t.status === "PUBLISHED").length },
    { id: "archived", label: "Archived", count: mockTests.filter((t) => t.status === "ARCHIVED").length },
  ];

  const columns: Column<MockTest>[] = [
    { key: "title", header: "Test", render: (r) => (
      <div>
        <Link href={`/admin/tests/${r.id}`} className="font-medium text-foreground hover:text-brand-700 transition-colors">
          {r.title}
        </Link>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="outline">{r.type}</Badge>
          <span className="text-xs text-muted-foreground">{r.examName}</span>
        </div>
      </div>
    )},
    { key: "questions", header: "Questions", render: (r) => <span className="tabular-nums">{r.totalQuestions}</span>, className: "w-24" },
    { key: "duration", header: "Duration", render: (r) => <span className="text-sm">{r.durationMinutes} min</span>, className: "w-24" },
    { key: "price", header: "Price", render: (r) => (
      <div>
        {r.isFree ? (
          <Badge variant="success">FREE</Badge>
        ) : (
          <div>
            <span className="text-sm font-medium">{formatCurrency(r.discountedPricePaise ?? r.pricePaise)}</span>
            {r.discountedPricePaise && r.discountedPricePaise < r.pricePaise && (
              <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(r.pricePaise)}</span>
            )}
          </div>
        )}
      </div>
    ), className: "w-28" },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.status.toLowerCase()}>{r.status}</Badge>
    ), className: "w-24" },
    { key: "attempts", header: "Attempts", render: (r) => <span className="tabular-nums">{r.attemptCount}</span>, className: "w-24" },
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <Link href={`/admin/tests/${r.id}`}>
          <Button variant="ghost" size="icon-sm" title="Edit"><Edit className="w-3.5 h-3.5" /></Button>
        </Link>
        {r.status !== "ARCHIVED" && (
          <Button variant="ghost" size="icon-sm" title="Archive" onClick={() => setConfirmArchive(r)}>
            <Archive className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    ), className: "w-24" },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Mock Tests" }]} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Mock Tests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage mock tests, sectional tests, and topic drills.</p>
        </div>
        <Link href="/admin/tests/new">
          <Button size="md"><Plus className="w-4 h-4" /> Create Test</Button>
        </Link>
      </div>

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs items={tabs} active={tab} onChange={setTab} />
            <SearchInput value={search} onChange={setSearch} placeholder="Search tests..." className="w-full sm:w-64" />
          </div>
        </div>
        <div className="mt-3">
          <DataTable columns={columns} data={filtered} emptyTitle="No tests found" emptyDescription="Create your first test to get started." />
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <Pagination page={page} totalPages={1} onPageChange={setPage} />
        </div>
      </Card>

      <ConfirmDialog
        open={!!confirmArchive}
        onClose={() => setConfirmArchive(null)}
        onConfirm={() => setConfirmArchive(null)}
        title="Archive Test"
        description={`Are you sure you want to archive "${confirmArchive?.title}"? Archived tests will no longer be available to students.`}
        confirmLabel="Archive"
        variant="danger"
      />
    </div>
  );
}
