"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, Pagination, type Column, type TabItem } from "@/components/ui/components";
import { Plus, Edit, Upload, AlertCircle, RefreshCw, BookOpen } from "lucide-react";

interface RealQuestionItem {
  id: string;
  subjectId: string;
  subjectName: string;
  topicName: string | null;
  currentVersion: number;
  isActive: boolean;
  usedInTests: number;
  usedInAttempts: number;
  createdAt: string;
  version: {
    id: string;
    version: number;
    questionText: string;
    difficulty: string;
    explanation: string | null;
    options: Array<{
      id: string;
      optionKey: string;
      optionText: string;
      isCorrect: boolean;
    }>;
  } | null;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<RealQuestionItem[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load subject taxonomy for filters
  useEffect(() => {
    fetch("/api/admin/subjects")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.subjects && Array.isArray(data.subjects)) {
          setSubjects(data.subjects);
        }
      })
      .catch(() => {});
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: tab,
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.set("search", search.trim());
      if (subjectFilter) params.set("subjectId", subjectFilter);
      if (difficultyFilter) params.set("difficulty", difficultyFilter);

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch questions (${res.status})`);
      }

      const data = await res.json();
      setQuestions(data.questions || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load questions from database");
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, subjectFilter, difficultyFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const tabs: TabItem[] = [
    { id: "all", label: "All Questions", count: totalCount },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  const subjectOptions = [
    { value: "", label: "All Subjects" },
    ...subjects.map((s) => ({ value: s.id, label: s.name })),
  ];

  const difficultyOptions = [
    { value: "", label: "All Difficulties" },
    { value: "EASY", label: "Easy" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HARD", label: "Hard" },
  ];

  const columns: Column<RealQuestionItem>[] = [
    { key: "question", header: "Question", render: (r) => {
      const v = r.version;
      return (
        <div className="max-w-md">
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {v?.questionText || "(No question text in version)"}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline">{r.subjectName}</Badge>
            {r.topicName && <span className="text-xs text-muted-foreground font-medium">· {r.topicName}</span>}
          </div>
        </div>
      );
    }},
    { key: "difficulty", header: "Difficulty", render: (r) => {
      const diff = r.version?.difficulty || "MEDIUM";
      const diffMap: Record<string, string> = { EASY: "success", MEDIUM: "warning", HARD: "danger" };
      return <Badge variant={diffMap[diff] ?? "default"}>{diff}</Badge>;
    }, className: "w-24" },
    { key: "version", header: "Version", render: (r) => (
      <span className="tabular-nums text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
        v{r.currentVersion}
      </span>
    ), className: "w-20" },
    { key: "used", header: "Tests / Attempts", render: (r) => (
      <div className="text-xs space-y-0.5">
        <span className="font-semibold text-slate-800">{r.usedInTests} test{r.usedInTests !== 1 ? "s" : ""}</span>
        <span className="text-muted-foreground block text-[11px]">{r.usedInAttempts} attempt{r.usedInAttempts !== 1 ? "s" : ""}</span>
      </div>
    ), className: "w-28" },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.isActive ? "active" : "inactive"}>
        {r.isActive ? "Active" : "Inactive"}
      </Badge>
    ), className: "w-20" },
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <Link href={`/admin/questions/${r.id}`}>
          <Button variant="ghost" size="icon-sm" title="Edit Question">
            <Edit className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    ), className: "w-16" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Question Bank" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Question Bank</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage question inventory, answer options, statutory explanations, and immutable versions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQuestions}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-600" : ""}`} />
            Refresh
          </Button>
          <Link href="/admin/tests/import">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Upload className="w-4 h-4" /> Import Document
            </Button>
          </Link>
          <Link href="/admin/questions/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Question
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Failed to fetch questions from database</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchQuestions} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5 space-y-3">
          <Tabs items={tabs} active={tab} onChange={(t) => { setTab(t); setPage(1); }} />
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
            <SearchInput
              value={search}
              onChange={(s) => { setSearch(s); setPage(1); }}
              placeholder="Search question text..."
              className="flex-1"
            />
            <div className="flex gap-2">
              <Select
                id="filter-subject"
                options={subjectOptions}
                value={subjectFilter}
                onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
                className="w-48 text-xs"
              />
              <Select
                id="filter-difficulty"
                options={difficultyOptions}
                value={difficultyFilter}
                onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
                className="w-36 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Querying verified questions from PostgreSQL...</p>
            </div>
          ) : questions.length > 0 ? (
            <DataTable
              columns={columns}
              data={questions}
              emptyTitle="No questions found"
              emptyDescription="No questions match the current filters."
            />
          ) : (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No questions found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search || subjectFilter || difficultyFilter
                  ? "No questions match your filter criteria."
                  : "Add questions or import .docx/.pdf mock tests to build your bank."}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Link href="/admin/tests/import">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Import Document
                  </Button>
                </Link>
                <Link href="/admin/questions/new">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </Button>
                </Link>
              </div>
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
