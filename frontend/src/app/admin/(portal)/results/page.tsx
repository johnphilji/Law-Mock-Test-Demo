"use client";
import { Breadcrumbs, Card, EmptyState } from "@/components/ui/components";
import { BarChart3 } from "lucide-react";

export default function ResultsPage() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Results" }]} />
      <div>
        <h1 className="text-xl font-semibold text-foreground">Results & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Test performance, student analytics, and revenue reports.</p>
      </div>
      <Card>
        <EmptyState
          title="Analytics dashboard coming soon"
          description="Test performance, student metrics, and revenue analytics will be displayed here once connected to the database."
          icon={<BarChart3 className="w-8 h-8" />}
        />
      </Card>
    </div>
  );
}
