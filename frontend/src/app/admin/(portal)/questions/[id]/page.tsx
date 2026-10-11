"use client";

import { use } from "react";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { mockQuestions } from "@/lib/mock-data";
import { Breadcrumbs, EmptyState } from "@/components/ui/components";

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const question = mockQuestions.find((q) => q.id === resolvedParams.id);

  if (!question) {
    return (
      <div className="space-y-5">
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Question Bank", href: "/admin/questions" },
            { label: "Not Found" },
          ]}
        />
        <EmptyState
          title="Question not found"
          description="The question you are looking for does not exist or has been deleted."
        />
      </div>
    );
  }

  return <QuestionEditor initialData={question} />;
}
