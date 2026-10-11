"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, ConfirmDialog, type Column, type TabItem } from "@/components/ui/components";
import { mockExams, type MockExam } from "@/lib/mock-data";
import { formatDate } from "@/utils/formatters";
import { Plus, Edit, Archive } from "lucide-react";

export default function ExamsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const filteredExams = mockExams.filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === "active" && !e.isActive) return false;
    if (tab === "archived" && e.isActive) return false;
    return true;
  });

  const tabs: TabItem[] = [
    { id: "all", label: "All Exams", count: mockExams.length },
    { id: "active", label: "Active", count: mockExams.filter((e) => e.isActive).length },
    { id: "archived", label: "Archived", count: mockExams.filter((e) => !e.isActive).length },
  ];

  const columns: Column<MockExam>[] = [
    { key: "name", header: "Exam Name", render: (r) => (
      <div>
        <Link href={`/admin/exams/${r.id}`} className="font-medium text-foreground hover:text-brand-700 transition-colors">
          {r.name}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">/{r.slug}</p>
      </div>
    )},
    { key: "subjects", header: "Subjects", render: (r) => <span className="tabular-nums">{r.subjectCount}</span> },
    { key: "tests", header: "Tests", render: (r) => <span className="tabular-nums">{r.testCount}</span> },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.isActive ? "active" : "archived"}>
        {r.isActive ? "Active" : "Archived"}
      </Badge>
    )},
    { key: "created", header: "Created", render: (r) => (
      <span className="text-muted-foreground text-xs">{formatDate(r.createdAt)}</span>
    )},
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <Link href={`/admin/exams/${r.id}`}>
          <Button variant="ghost" size="icon-sm" title="Edit"><Edit className="w-3.5 h-3.5" /></Button>
        </Link>
      </div>
    ), className: "w-20" },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Exams" }]} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Exams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage examination configurations and subjects.</p>
        </div>
        <Link href="/admin/exams/new">
          <Button size="md"><Plus className="w-4 h-4" /> Create Exam</Button>
        </Link>
      </div>

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs items={tabs} active={tab} onChange={setTab} />
            <SearchInput value={search} onChange={setSearch} placeholder="Search exams..." className="w-full sm:w-64" />
          </div>
        </div>
        <div className="mt-3">
          <DataTable columns={columns} data={filteredExams} emptyTitle="No exams found" />
        </div>
      </Card>
    </div>
  );
}
