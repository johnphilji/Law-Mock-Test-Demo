"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, Pagination, type Column, type TabItem } from "@/components/ui/components";
import { mockQuestions, mockSubjects, type MockQuestion } from "@/lib/mock-data";
import { formatDate } from "@/utils/formatters";
import { Plus, Edit, Eye, Copy, Upload } from "lucide-react";

export default function QuestionsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = mockQuestions.filter((q) => {
    const currentVersion = q.versions[q.versions.length - 1];
    if (search && !currentVersion?.questionText.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === "active" && !q.isActive) return false;
    if (tab === "inactive" && q.isActive) return false;
    if (subjectFilter && q.subjectId !== subjectFilter) return false;
    if (difficultyFilter && currentVersion?.difficulty !== difficultyFilter) return false;
    return true;
  });

  const tabs: TabItem[] = [
    { id: "all", label: "All Questions", count: mockQuestions.length },
    { id: "active", label: "Active", count: mockQuestions.filter((q) => q.isActive).length },
    { id: "inactive", label: "Inactive", count: mockQuestions.filter((q) => !q.isActive).length },
  ];

  const subjectOptions = [
    { value: "", label: "All Subjects" },
    ...mockSubjects.map((s) => ({ value: s.id, label: s.name })),
  ];

  const difficultyOptions = [
    { value: "", label: "All Difficulties" },
    { value: "EASY", label: "Easy" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HARD", label: "Hard" },
  ];

  const columns: Column<MockQuestion>[] = [
    { key: "id", header: "ID", render: (r) => (
      <span className="text-xs text-muted-foreground font-mono">{r.id}</span>
    ), className: "w-20" },
    { key: "question", header: "Question", render: (r) => {
      const v = r.versions[r.versions.length - 1];
      return (
        <div className="max-w-md">
          <p className="text-sm text-foreground line-clamp-2">{v?.questionText}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline">{r.subjectName}</Badge>
            {r.topicName && <span className="text-xs text-muted-foreground">· {r.topicName}</span>}
          </div>
        </div>
      );
    }},
    { key: "difficulty", header: "Difficulty", render: (r) => {
      const v = r.versions[r.versions.length - 1];
      const diffMap: Record<string, string> = { EASY: "success", MEDIUM: "warning", HARD: "danger" };
      return <Badge variant={diffMap[v?.difficulty ?? "MEDIUM"] ?? "default"}>{v?.difficulty}</Badge>;
    }, className: "w-24" },
    { key: "version", header: "Version", render: (r) => (
      <span className="tabular-nums text-sm">v{r.currentVersion}</span>
    ), className: "w-20" },
    { key: "used", header: "Used In", render: (r) => (
      <span className="tabular-nums text-sm">{r.usedInTests} tests</span>
    ), className: "w-24" },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.isActive ? "active" : "inactive"}>
        {r.isActive ? "Active" : "Inactive"}
      </Badge>
    ), className: "w-20" },
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <Link href={`/admin/questions/${r.id}`}>
          <Button variant="ghost" size="icon-sm" title="Edit"><Edit className="w-3.5 h-3.5" /></Button>
        </Link>
        <Button variant="ghost" size="icon-sm" title="Duplicate"><Copy className="w-3.5 h-3.5" /></Button>
      </div>
    ), className: "w-24" },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Question Bank" }]} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Question Bank</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all questions, versions, and content.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/questions/import">
            <Button variant="outline" size="md"><Upload className="w-4 h-4" /> Import</Button>
          </Link>
          <Link href="/admin/questions/new">
            <Button size="md"><Plus className="w-4 h-4" /> Add Question</Button>
          </Link>
        </div>
      </div>

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5 space-y-3">
          <Tabs items={tabs} active={tab} onChange={setTab} />
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search questions..." className="flex-1" />
            <div className="flex gap-2">
              <Select
                id="filter-subject"
                options={subjectOptions}
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-48"
              />
              <Select
                id="filter-difficulty"
                options={difficultyOptions}
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-36"
              />
            </div>
          </div>
        </div>
        <div className="mt-3">
          <DataTable
            columns={columns}
            data={filtered}
            emptyTitle="No questions found"
            emptyDescription="Add questions to build your question bank."
          />
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <Pagination page={page} totalPages={1} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
