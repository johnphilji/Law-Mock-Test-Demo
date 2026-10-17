"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs, Card } from "@/components/ui/components";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { AlertCircle, ArrowLeft, CheckCircle2, Layers } from "lucide-react";

export default function NewExamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError("Exam name and unique URL slug are required.");
      return;
    }

    setSaving(true);
    setError(null);

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

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to create exam (${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/exams");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to create exam.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Exams", href: "/admin/exams" },
          { label: "Create Exam" },
        ]}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/exams")}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Create New Exam</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define a high-level exam framework (e.g. CLAT UG, AILET, Judiciary)
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Exam created successfully! Redirecting...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Exam Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                }
              }}
              placeholder="e.g. CLAT UG 2026"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. clat-ug-2026"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Description (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief syllabus overview, eligibility or pattern details..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/exams")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
