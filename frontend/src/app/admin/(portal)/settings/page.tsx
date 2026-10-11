"use client";
import { Breadcrumbs, Card } from "@/components/ui/components";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]} />
      <div><h1 className="text-xl font-semibold text-foreground">Settings</h1><p className="text-sm text-muted-foreground mt-0.5">Application configuration and preferences.</p></div>
      <Card>
        <h3 className="text-base font-semibold mb-4">General Settings</h3>
        <div className="space-y-4 max-w-lg">
          <Input id="set-app-name" label="Application Name" defaultValue="Panther Law Prep" />
          <Input id="set-support-email" label="Support Email" defaultValue="support@pantherlawprep.com" />
          <Textarea id="set-maintenance" label="Maintenance Message" placeholder="Optional message to display during maintenance" />
          <div className="pt-2"><Button size="md">Save Settings</Button></div>
        </div>
      </Card>
    </div>
  );
}
