"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, type Column, type TabItem } from "@/components/ui/components";
import { Plus, Upload, PlayCircle, RefreshCw, CheckCircle, Archive, AlertCircle } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tests");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch tests (${res.status})`);
      }
      const data = await res.json();
      setTests(data.tests || []);
    } catch (err: any) {
      setError(err.message || "Failed to load tests from database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleUpdateStatus = async (testId: string, status: "PUBLISHED" | "DRAFT" | "ARCHIVED") => {
    try {
      const res = await fetch("/api/admin/tests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testId, status }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update test status");
      }

      await fetchTests();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const filtered = tests.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.examName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
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
    { key: "title", header: "Mock Test", render: (r) => (
      <div>
        <Link href={`/test/${r.id}`} className="font-semibold text-foreground hover:text-brand-700 transition-colors flex items-center gap-1.5 text-sm">
          {r.title}
        </Link>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="outline">{r.type}</Badge>
          <span className="text-xs text-muted-foreground">{r.examName}</span>
        </div>
      </div>
    )},
    { key: "questions", header: "Questions", render: (r) => (
      <span className="tabular-nums font-semibold text-sm">{r.totalQuestions}</span>
    ), className: "w-24" },
    { key: "duration", header: "Duration", render: (r) => (
      <span className="text-xs text-slate-700">{r.durationMinutes} min</span>
    ), className: "w-24" },
    { key: "attempts", header: "Attempts", render: (r) => (
      <span className="text-xs font-semibold tabular-nums text-slate-800">
        {r.attemptCount} candidate{r.attemptCount !== 1 ? "s" : ""}
      </span>
    ), className: "w-28" },
    { key: "status", header: "Status", render: (r) => {
      const v = r.status.toLowerCase();
      return <Badge variant={v}>{r.status}</Badge>;
    }, className: "w-28" },
    { key: "actions", header: "", render: (r) => (
      <div className="flex items-center justify-end gap-1.5">
        <Link href={`/test/${r.id}`}>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <PlayCircle className="w-3.5 h-3.5" /> Preview
          </Button>
        </Link>
        {r.status === "DRAFT" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-emerald-700 hover:text-emerald-800 gap-1"
            onClick={() => handleUpdateStatus(r.id, "PUBLISHED")}
          >
            <CheckCircle className="w-3 h-3" /> Publish
          </Button>
        ) : r.status === "PUBLISHED" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-slate-500 hover:text-slate-800 gap-1"
            onClick={() => handleUpdateStatus(r.id, "ARCHIVED")}
          >
            <Archive className="w-3 h-3" /> Archive
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-brand-700 hover:text-brand-800"
            onClick={() => handleUpdateStatus(r.id, "DRAFT")}
          >
            Restore
          </Button>
        )}
      </div>
    ), className: "w-44" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Tests" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Mock Examination Papers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage mock test papers, question pools, scoring schemes, and publication lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTests}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-600" : ""}`} />
            Refresh
          </Button>
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

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Error querying tests</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchTests} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

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

        {loading ? (
          <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading mock tests from PostgreSQL...</p>
          </div>
        ) : filtered.length > 0 ? (
          <DataTable columns={columns} data={filtered} />
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-800">No mock tests found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {search ? "No tests matched your search query." : "Upload a .docx/.pdf mock test or create a new test blueprint."}
            </p>
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
          </div>
        )}
      </Card>
    </div>
  );
}
