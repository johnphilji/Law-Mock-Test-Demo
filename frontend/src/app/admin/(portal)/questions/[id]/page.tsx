"use client";

import { use, useEffect, useState } from "react";
import { QuestionEditor, type QuestionEditorData } from "@/components/admin/QuestionEditor";
import { Breadcrumbs, EmptyState } from "@/components/ui/components";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [question, setQuestion] = useState<QuestionEditorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/questions/${resolvedParams.id}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Question not found or access denied");
        }
        return res.json();
      })
      .then((data) => {
        if (data?.question) {
          setQuestion(data.question);
        } else {
          setError("Question not found");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load question");
      })
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
        <Loader2 className="w-7 h-7 text-brand-600 animate-spin" />
        <p className="text-xs">Loading question from database...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Question Bank", href: "/admin/questions" },
            { label: "Not Found" },
          ]}
        />
        <div className="bg-white p-12 text-center rounded-2xl border border-border space-y-3">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">Question Not Found</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            The question you are looking for does not exist in the database or may have been deleted.
          </p>
          <div className="pt-2">
            <Link href="/admin/questions">
              <Button size="sm">Back to Question Bank</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <QuestionEditor initialData={question} />;
}
