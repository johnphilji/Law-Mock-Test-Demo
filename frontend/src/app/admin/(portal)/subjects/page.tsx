"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, Badge, DataTable, Breadcrumbs, Modal, type Column } from "@/components/ui/components";
import { Input, Textarea, Checkbox } from "@/components/ui/input";
import { Plus, Edit, AlertCircle, RefreshCw, BookOpen } from "lucide-react";

interface RealSubject {
  id: string;
  examId: string;
  examName: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  questionCount: number;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<RealSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showAdd, setShowAdd] = useState(false);
  const [editSubject, setEditSubject] = useState<RealSubject | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states for Add
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newOrder, setNewOrder] = useState("0");

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/subjects");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch subjects (${res.status})`);
      }
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (err: any) {
      setError(err.message || "Failed to load subjects from database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      setModalError("Subject name and slug are required.");
      return;
    }
    setSaving(true);
    setModalError(null);
    try {
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim(),
          displayOrder: Number(newOrder) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create subject");
      }

      setShowAdd(false);
      setNewName("");
      setNewSlug("");
      setNewOrder("0");
      await fetchSubjects();
    } catch (err: any) {
      setModalError(err.message || "Creation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editSubject) return;
    setSaving(true);
    setModalError(null);
    try {
      const res = await fetch("/api/admin/subjects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editSubject.id,
          name: editSubject.name.trim(),
          slug: editSubject.slug.trim(),
          displayOrder: Number(editSubject.displayOrder) || 0,
          isActive: editSubject.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update subject");
      }

      setEditSubject(null);
      await fetchSubjects();
    } catch (err: any) {
      setModalError(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<RealSubject>[] = [
    { key: "order", header: "#", render: (r) => (
      <span className="tabular-nums text-muted-foreground text-xs font-mono font-semibold">
        {r.displayOrder}
      </span>
    ), className: "w-14" },
    { key: "name", header: "Subject", render: (r) => (
      <div>
        <p className="font-semibold text-foreground text-sm">{r.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground font-mono">/{r.slug}</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">{r.examName}</span>
        </div>
      </div>
    )},
    { key: "questions", header: "Questions in Bank", render: (r) => (
      <span className="tabular-nums text-sm font-semibold">{r.questionCount}</span>
    ), className: "w-36" },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.isActive ? "active" : "inactive"}>
        {r.isActive ? "Active" : "Inactive"}
      </Badge>
    ), className: "w-24" },
    { key: "actions", header: "", render: (r) => (
      <Button
        variant="ghost"
        size="icon-sm"
        title="Edit Subject"
        onClick={() => { setEditSubject(r); setModalError(null); }}
      >
        <Edit className="w-3.5 h-3.5" />
      </Button>
    ), className: "w-16" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Exams", href: "/admin/exams" }, { label: "Subjects" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Examination Subjects</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage subject taxonomy and syllabus allocations across law mock tests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubjects}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-600" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setShowAdd(true); setModalError(null); }} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Subject
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Error querying subject repository</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchSubjects} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <Card padding="none">
        <div className="mt-1">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground space-y-2">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading subjects from PostgreSQL...</p>
            </div>
          ) : subjects.length > 0 ? (
            <DataTable columns={columns} data={subjects} emptyTitle="No subjects found" />
          ) : (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No subjects found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No syllabus subjects have been added to the database yet.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Add Subject Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Examination Subject" size="md">
        <div className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {modalError}
            </div>
          )}
          <Input
            id="sub-name"
            label="Subject Name *"
            required
            placeholder="e.g. Constitutional Law"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (!newSlug) {
                setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"));
              }
            }}
          />
          <Input
            id="sub-slug"
            label="URL-Friendly Slug *"
            required
            placeholder="constitutional-law"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
          />
          <Input
            id="sub-order"
            label="Display Order"
            type="number"
            value={newOrder}
            onChange={(e) => setNewOrder(e.target.value)}
          />
          <div className="flex gap-2 justify-end pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} loading={saving}>
              Add Subject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal open={!!editSubject} onClose={() => setEditSubject(null)} title="Edit Examination Subject" size="md">
        {editSubject && (
          <div className="space-y-4">
            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {modalError}
              </div>
            )}
            <Input
              id="edit-sub-name"
              label="Subject Name *"
              required
              value={editSubject.name}
              onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })}
            />
            <Input
              id="edit-sub-slug"
              label="Slug *"
              required
              value={editSubject.slug}
              onChange={(e) => setEditSubject({ ...editSubject, slug: e.target.value })}
            />
            <Input
              id="edit-sub-order"
              label="Display Order"
              type="number"
              value={String(editSubject.displayOrder)}
              onChange={(e) => setEditSubject({ ...editSubject, displayOrder: Number(e.target.value) || 0 })}
            />
            <Checkbox
              id="edit-sub-active"
              label="Active (available in question creation and blueprinting)"
              checked={editSubject.isActive}
              onChange={(e) => setEditSubject({ ...editSubject, isActive: e.target.checked })}
            />
            <div className="flex gap-2 justify-end pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditSubject(null)} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdate} loading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
