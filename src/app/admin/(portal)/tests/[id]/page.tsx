"use client";
import { Breadcrumbs, Card, EmptyState } from "@/components/ui/components";
import { Edit } from "lucide-react";

export default function EditTestPlaceholder() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Mock Tests", href: "/admin/tests" }, { label: "Test Builder" }]} />
      <Card>
        <EmptyState title="Test Builder" description="The detailed test builder interface will be implemented here." icon={<Edit className="w-8 h-8" />} />
      </Card>
    </div>
  );
}
