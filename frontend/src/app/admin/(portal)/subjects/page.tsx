"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Badge, DataTable, Breadcrumbs, Modal, type Column } from "@/components/ui/components";
import { Input, Textarea, Checkbox } from "@/components/ui/input";
import { mockSubjects, type MockSubject } from "@/lib/mock-data";
import { Plus, Edit, GripVertical } from "lucide-react";

export default function SubjectsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editSubject, setEditSubject] = useState<MockSubject | null>(null);

  const columns: Column<MockSubject>[] = [
    { key: "order", header: "#", render: (r) => (
      <div className="flex items-center gap-2">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
        <span className="tabular-nums text-muted-foreground text-sm">{r.displayOrder}</span>
      </div>
    ), className: "w-16" },
    { key: "name", header: "Subject", render: (r) => (
      <div>
        <p className="font-medium text-foreground">{r.name}</p>
        <p className="text-xs text-muted-foreground">/{r.slug}</p>
      </div>
    )},
    { key: "questions", header: "Questions", render: (r) => (
      <span className="tabular-nums">{r.questionCount}</span>
    ), className: "w-24" },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.isActive ? "active" : "inactive"}>
        {r.isActive ? "Active" : "Inactive"}
      </Badge>
    ), className: "w-20" },
    { key: "actions", header: "", render: (r) => (
      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => setEditSubject(r)}>
        <Edit className="w-3.5 h-3.5" />
      </Button>
    ), className: "w-16" },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Exams", href: "/admin/exams" }, { label: "Subjects" }]} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Subjects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage examination subjects. Drag to reorder.</p>
        </div>
        <Button size="md" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Subject
        </Button>
      </div>

      <Card padding="none">
        <div className="mt-1">
          <DataTable columns={columns} data={mockSubjects} emptyTitle="No subjects found" />
        </div>
      </Card>

      {/* Add Subject Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Subject" size="md">
        <div className="space-y-4">
          <Input id="sub-name" label="Subject Name" required placeholder="e.g., Constitutional Law" />
          <Input id="sub-slug" label="Slug" required placeholder="constitutional-law" hint="URL-friendly identifier" />
          <Textarea id="sub-desc" label="Description" placeholder="Brief description of the subject" />
          <Input id="sub-order" label="Display Order" type="number" placeholder="1" />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowAdd(false)}>Add Subject</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal open={!!editSubject} onClose={() => setEditSubject(null)} title="Edit Subject" size="md">
        {editSubject && (
          <div className="space-y-4">
            <Input id="edit-sub-name" label="Subject Name" required defaultValue={editSubject.name} />
            <Input id="edit-sub-slug" label="Slug" required defaultValue={editSubject.slug} />
            <Input id="edit-sub-order" label="Display Order" type="number" defaultValue={String(editSubject.displayOrder)} />
            <Checkbox id="edit-sub-active" label="Active" defaultChecked={editSubject.isActive} />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditSubject(null)}>Cancel</Button>
              <Button size="sm" onClick={() => setEditSubject(null)}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
