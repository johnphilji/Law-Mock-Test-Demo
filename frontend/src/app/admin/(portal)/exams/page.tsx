"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, Badge, DataTable, Breadcrumbs, Tabs, SearchInput, Modal, type Column, type TabItem } from "@/components/ui/components";
import { Input, Textarea } from "@/components/ui/input";
import { formatDate } from "@/utils/formatters";
import { Plus, AlertCircle, RefreshCw, Layers } from "lucide-react";

interface RealExam {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subjectCount: number;
  testCount: number;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<RealExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  // Create Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/exams");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch exams (${res.status})`);
      }
      const data = await res.json();
      setExams(data.exams || []);
    } catch (err: any) {
      setError(err.message || "Failed to load exams from database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      setFormError("Exam name and slug are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create exam");
      }

      setShowCreate(false);
      setName("");
      setSlug("");
      setDescription("");
      await fetchExams();
    } catch (err: any) {
      setFormError(err.message || "Failed to create exam");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (exam: RealExam) => {
    try {
      const res = await fetch("/api/admin/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: exam.id,
          isActive: !exam.isActive,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update exam");
      }

      await fetchExams();
    } catch (err: any) {
      alert(err.message || "Action failed");
    }
  };

  const filteredExams = exams.filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.slug.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (tab === "active" && !e.isActive) return false;
    if (tab === "archived" && e.isActive) return false;
    return true;
  });

  const tabs: TabItem[] = [
    { id: "all", label: "All Exams", count: exams.length },
    { id: "active", label: "Active", count: exams.filter((e) => e.isActive).length },
    { id: "archived", label: "Archived", count: exams.filter((e) => !e.isActive).length },
  ];

  const columns: Column<RealExam>[] = [
    { key: "name", header: "Examination", render: (r) => (
      <div>
        <p className="font-semibold text-foreground text-sm">{r.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">/{r.slug}</p>
      </div>
    )},
    { key: "subjects", header: "Subjects", render: (r) => (
      <span className="tabular-nums text-sm font-semibold">{r.subjectCount}</span>
    ), className: "w-24" },
    { key: "tests", header: "Mock Tests", render: (r) => (
      <span className="tabular-nums text-sm font-semibold">{r.testCount}</span>
    ), className: "w-24" },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.isActive ? "active" : "archived"}>
        {r.isActive ? "Active" : "Archived"}
      </Badge>
    ), className: "w-24" },
    { key: "created", header: "Created", render: (r) => (
      <span className="text-muted-foreground text-xs">{formatDate(r.createdAt)}</span>
    ), className: "w-28" },
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => handleToggleActive(r)}
        >
          {r.isActive ? "Archive" : "Activate"}
        </Button>
      </div>
    ), className: "w-24" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Exams" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Examination Frameworks</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure target legal examinations (AIBE, CLAT, Judiciary) and their associated syllabus structures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExams}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-600" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Create Exam
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Error loading examinations</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchExams} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <Card padding="none">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs items={tabs} active={tab} onChange={setTab} />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search exams by name or slug..."
              className="w-full sm:w-64"
            />
          </div>
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading exams from database...</p>
            </div>
          ) : filteredExams.length > 0 ? (
            <DataTable columns={columns} data={filteredExams} emptyTitle="No exams found" />
          ) : (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No exams found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search ? "No exams matched your search query." : "No legal examinations configured yet."}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Create Exam Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Examination Framework" size="md">
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {formError}
            </div>
          )}
          <Input
            id="exam-name"
            label="Examination Name *"
            placeholder="e.g. All India Bar Examination (AIBE) XXI"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"));
              }
            }}
            required
          />
          <Input
            id="exam-slug"
            label="Identifier Slug *"
            placeholder="aibe-xxi"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            hint="Unique URL-friendly slug"
            required
          />
          <Textarea
            id="exam-desc"
            label="Description (Optional)"
            placeholder="Enter syllabus details and target candidate criteria..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2 justify-end pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} loading={saving}>
              Save Examination
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
