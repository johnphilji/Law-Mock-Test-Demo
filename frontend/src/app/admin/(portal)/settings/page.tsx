"use client";

import { Breadcrumbs, Card } from "@/components/ui/components";
import { Badge } from "@/components/ui/components";
import { ShieldCheck, Database, Server, Key } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Environment & Configuration</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Core platform parameters, database connectivity, and proctoring engine settings.
        </p>
      </div>

      <div className="space-y-5">
        <Card>
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Database className="w-4 h-4 text-brand-700" />
            <h2 className="text-sm font-bold text-foreground">Database & Infrastructure</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-muted-foreground">Primary Database Engine</span>
              <p className="font-semibold text-foreground mt-0.5">Supabase PostgreSQL 15</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] text-emerald-700 font-medium">Connection Pool Active</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-muted-foreground">ORM & Query Engine</span>
              <p className="font-semibold text-foreground mt-0.5">Prisma 6.12 (TypeScript Native)</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-[11px] text-blue-700 font-medium">Immutable Snapshots Enforced</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-muted-foreground">Authentication Protocol</span>
              <p className="font-semibold text-foreground mt-0.5">Argon2id Session Token Adapter</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant="outline">Strict HttpOnly</Badge>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-muted-foreground">Test Engine Standard</span>
              <p className="font-semibold text-foreground mt-0.5">NTA / TCS-iON Computer Based Testing</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant="success">Proctored Single-Window</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Server className="w-4 h-4 text-brand-700" />
            <h2 className="text-sm font-bold text-foreground">Operational Parameters</h2>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-muted-foreground">Platform Name</span>
              <span className="font-semibold text-foreground">Panther Law Prep</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-muted-foreground">Target Examinations</span>
              <span className="font-semibold text-foreground">AIBE, CLAT UG/PG, AILET, State Judicial Services</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-muted-foreground">Support Contact</span>
              <span className="font-semibold text-foreground">support@pantherlawprep.com</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-muted-foreground">Payment Reconciliation Engine</span>
              <span className="font-semibold text-purple-700">Phase 3 Ready (HMAC-SHA256 Webhook Verification)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Question Versioning Integrity</span>
              <span className="font-semibold text-emerald-700">Strict Immutability Enabled</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
