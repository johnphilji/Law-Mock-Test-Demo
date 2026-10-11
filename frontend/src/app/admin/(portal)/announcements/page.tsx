"use client";
import { Breadcrumbs, Card, EmptyState } from "@/components/ui/components";
import { Megaphone } from "lucide-react";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Announcements" }]} />
      <div><h1 className="text-xl font-semibold text-foreground">Announcements</h1><p className="text-sm text-muted-foreground mt-0.5">Manage banners, notices, and announcements.</p></div>
      <Card><EmptyState title="No announcements" description="Create announcements to notify students about upcoming tests, schedule changes, or important updates." icon={<Megaphone className="w-8 h-8" />} /></Card>
    </div>
  );
}
