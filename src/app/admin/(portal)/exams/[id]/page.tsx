"use client";
import { Breadcrumbs, Card, EmptyState } from "@/components/ui/components";
import { Edit } from "lucide-react";

export default function EditExamPlaceholder() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Exams", href: "/admin/exams" }, { label: "Exam Configuration" }]} />
      <Card>
        <EmptyState title="Exam Configuration" description="Exam detail and configuration page will be implemented here." icon={<Edit className="w-8 h-8" />} />
      </Card>
    </div>
  );
}
