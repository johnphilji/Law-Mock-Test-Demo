"use client";
import { Breadcrumbs, Card, EmptyState } from "@/components/ui/components";
import { User } from "lucide-react";

export default function UserDetailPlaceholder() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Students", href: "/admin/users" }, { label: "Student Profile" }]} />
      <Card>
        <EmptyState title="Student Profile" description="Detailed student view including performance, attempts, and billing history will go here." icon={<User className="w-8 h-8" />} />
      </Card>
    </div>
  );
}
