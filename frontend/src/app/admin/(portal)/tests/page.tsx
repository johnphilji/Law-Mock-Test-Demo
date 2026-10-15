"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, type Column, type TabItem } from "@/components/ui/components";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { Plus, Upload, PlayCircle } from "lucide-react";

interface RealTestAdmin {
  id: string;
  title: string;
  slug: string;
  examName: string;
  type: string;
  status: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  negativeMarking: number;
  attemptCount: number;
  isFree: boolean;
  pricePaise: number;
  discountedPricePaise: number | null;
  createdAt: string;
}

export default function TestsPage() {
  const [tests, setTests] = useState<RealTestAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  useEffect(() => {
    fetch("/api/admin/tests")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tests && Array.isArray(data.tests)) {
          setTests(data.tests);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tests.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === "draft" && t.status !== "DRAFT") return false;
    if (tab === "published" && t.status !== "PUBLISHED") return false;
    if (tab === "archived" && t.status !== "ARCHIVED") return false;
    return true;
  });

  const tabs: TabItem[] = [
    { id: "all", label: "All Tests", count: tests.length },
    { id: "draft", label: "Drafts", count: tests.filter((t) => t.status === "DRAFT").length },
    { id: "published", label: "Published", count: tests.filter((t) => t.status === "PUBLISHED").length },
    { id: "archived", label: "Archived", count: tests.filter((t) => t.status === "ARCHIVED").length },
  ];

  const columns: Column<RealTestAdmin>[] = [
    { key: "title", header: "Test", render: (r) => (
      <div>
        <Link href={`/test/${r.id}`} className="font-medium text-foreground hover:text-brand-700 transition-colors flex items-center gap-1.5">
          {r.title}
        </Link>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="outline">{r.type}</Badge>
          <span className="text-xs text-muted-foreground">{r.examName}</span>
        </div>
      </div>
    )},
    { key: "questions", header: "Questions", render: (r) => <span className="tabular-nums font-semibold">{r.totalQuestions}</span>, className: "w-24" },
    { key: "duration", header: "Duration", render: (r) => <span className="text-sm">{r.durationMinutes} min</span>, className: "w-24" },
    { key: "attempts", header: "Attempts", render: (r) => <span className="text-sm tabular-nums">{r.attemptCount}</span>, className: "w-24" },
    { key: "status", header: "Status", render: (r) => {
      const v = r.status.toLowerCase();
      return <Badge variant={v}>{r.status}</Badge>;
    }, className: "w-28" },
    { key: "actions", header: "", render: (r) => (
      <div className="flex items-center justify-end gap-2">
        <Link href={`/test/${r.id}`}>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            <PlayCircle className="w-3.5 h-3.5" /> Preview CBT
          </Button>
        </Link>
      </div>
    ), className: "w-32" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Tests" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Mock Tests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage mock tests, question banks, scoring schemes, and publication status.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tests/import">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Upload className="w-4 h-4" /> Import Document (.docx/.pdf)
            </Button>
          </Link>
          <Link href="/admin/tests/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Create Test
            </Button>
          </Link>
        </div>
      </div>

      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-border space-y-4">
          <Tabs items={tabs} active={tab} onChange={setTab} />
          <div className="max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search tests by title or exam..."
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <DataTable columns={columns} data={filtered} />
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading tests from database..." : "No tests found matching your criteria."}
            </p>
            {!loading && (
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/admin/tests/import">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Upload className="w-4 h-4" /> Import from Document
                  </Button>
                </Link>
                <Link href="/admin/tests/new">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" /> Create Test
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
