"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Breadcrumbs, ConfirmDialog } from "@/components/ui/components";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/input";
import { Save, Plus, Trash2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

interface QuestionOptionData {
  id?: string;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

interface QuestionVersionData {
  id?: string;
  version: number;
  questionText: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  explanation?: string | null;
  usedInAttempts?: number;
  options: QuestionOptionData[];
}

export interface QuestionEditorData {
  id?: string;
  subjectId: string;
  subjectName?: string;
  topicName?: string | null;
  currentVersion?: number;
  isActive?: boolean;
  usedInAttempts?: number;
  versions?: QuestionVersionData[];
  version?: QuestionVersionData | null;
}

interface QuestionEditorProps {
  initialData?: QuestionEditorData;
}

export function QuestionEditor({ initialData }: QuestionEditorProps) {
  const router = useRouter();

  const isEditing = !!initialData?.id;
  const latestVersion = initialData?.versions
    ? initialData.versions[initialData.versions.length - 1]
    : initialData?.version;

  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [subjectId, setSubjectId] = useState(initialData?.subjectId ?? "");
  const [topicName, setTopicName] = useState(initialData?.topicName ?? "");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(latestVersion?.difficulty ?? "MEDIUM");
  const [questionText, setQuestionText] = useState(latestVersion?.questionText ?? "");
  const [explanation, setExplanation] = useState(latestVersion?.explanation ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const [options, setOptions] = useState<QuestionOptionData[]>(() => {
    if (latestVersion?.options && latestVersion.options.length > 0) {
      return latestVersion.options.map((o) => ({ ...o }));
    }
    return [
      { optionKey: "A", optionText: "", isCorrect: true, displayOrder: 0 },
      { optionKey: "B", optionText: "", isCorrect: false, displayOrder: 1 },
      { optionKey: "C", optionText: "", isCorrect: false, displayOrder: 2 },
      { optionKey: "D", optionText: "", isCorrect: false, displayOrder: 3 },
    ];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const hasAttempts = (latestVersion?.usedInAttempts ?? 0) > 0 || (initialData?.usedInAttempts ?? 0) > 0;

  useEffect(() => {
    fetch("/api/admin/subjects")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.subjects && Array.isArray(data.subjects)) {
          setSubjects(data.subjects);
          if (!subjectId && data.subjects.length > 0) {
            setSubjectId(data.subjects[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSubjects(false));
  }, [subjectId]);

  const subjectOptions = [
    { value: "", label: loadingSubjects ? "Loading subjects..." : "Select a subject..." },
    ...subjects.map((s) => ({ value: s.id, label: s.name })),
  ];

  const difficultyOptions = [
    { value: "EASY", label: "Easy" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HARD", label: "Hard" },
  ];

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    if (newOptions[index]) {
      newOptions[index].optionText = text;
      setOptions(newOptions);
    }
  };

  const handleSetCorrect = (index: number) => {
    const newOptions = options.map((o, i) => ({
      ...o,
      isCorrect: i === index,
    }));
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    const newKey = String.fromCharCode(65 + options.length);
    setOptions([...options, { optionKey: newKey, optionText: "", isCorrect: false, displayOrder: options.length }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const targetOption = options[index];
    const newOptions = options.filter((_, i) => i !== index);
    if (targetOption?.isCorrect && newOptions[0]) {
      newOptions[0].isCorrect = true;
    }
    newOptions.forEach((o, i) => {
      o.optionKey = String.fromCharCode(65 + i);
      o.displayOrder = i;
    });
    setOptions(newOptions);
  };

  const handleSave = async () => {
    if (!subjectId) {
      setError("Please select a valid subject.");
      return;
    }
    if (!questionText.trim()) {
      setError("Please enter the question text.");
      return;
    }
    if (options.some((o) => !o.optionText.trim())) {
      setError("All option choices must have text.");
      return;
    }
    if (!options.some((o) => o.isCorrect)) {
      setError("At least one option must be marked as the correct answer.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        subjectId,
        topicName: topicName.trim() || null,
        difficulty,
        questionText: questionText.trim(),
        explanation: explanation ? explanation.trim() : null,
        options,
        isActive,
      };

      let res: Response;
      if (isEditing) {
        res = await fetch(`/api/admin/questions/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to save question to database");
      }

      router.push("/admin/questions");
    } catch (err: any) {
      setError(err.message || "Failed to save question");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-16 font-sans">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Question Bank", href: "/admin/questions" },
          { label: isEditing ? `Edit Question` : "New Question" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/questions">
            <Button variant="ghost" size="icon-sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isEditing ? "Edit Question" : "Create New Question"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditing
                ? "Modify question or options. Immutability rules will version this question if it was attempted."
                : "Add a new validated multiple-choice question to the database."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowConfirmCancel(true)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" /> Save Question
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {isEditing && hasAttempts && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Question Version Lock Active
          </p>
          <p className="text-amber-800 leading-relaxed">
            This question has been attempted in previous student examination sessions. Saving changes will automatically generate a new version in PostgreSQL to preserve historical audit snapshots.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Question Statement & Choices" />
            <div className="mt-4 space-y-4">
              <Textarea
                id="q-text"
                label="Question Text *"
                placeholder="Enter the full question statement..."
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={4}
              />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Answer Options <span className="text-danger-500">*</span>
                  </label>
                  <Button variant="ghost" size="sm" onClick={handleAddOption} disabled={options.length >= 6}>
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {options.map((opt, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border transition ${
                        opt.isCorrect ? "border-emerald-400 bg-emerald-50/40" : "border-border bg-slate-50/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1.5 mt-1">
                        <span className="text-xs font-bold text-slate-600 w-6 text-center">{opt.optionKey}.</span>
                        <input
                          type="radio"
                          name="correct-option"
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          checked={opt.isCorrect}
                          onChange={() => handleSetCorrect(index)}
                          title="Mark as correct answer"
                        />
                      </div>
                      <div className="flex-1">
                        <Textarea
                          value={opt.optionText}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${opt.optionKey} text...`}
                          className="min-h-[50px] text-xs"
                        />
                      </div>
                      {options.length > 2 && (
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          onClick={() => handleRemoveOption(index)}
                          title="Remove option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Textarea
                id="q-explanation"
                label="Official Explanation / Solution (Optional)"
                placeholder="Detailed rationale and relevant statutory sections or case law..."
                value={explanation ?? ""}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Taxonomy & Classification" />
            <div className="mt-4 space-y-4">
              <Select
                id="q-subject"
                label="Subject *"
                options={subjectOptions}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              />
              <Input
                id="q-topic"
                label="Topic (Optional)"
                placeholder="e.g. Fundamental Rights"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
              />
              <Select
                id="q-difficulty"
                label="Difficulty Tier *"
                options={difficultyOptions}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
                required
              />
            </div>
          </Card>
          
          <Card>
            <CardHeader title="Lifecycle Status" />
            <div className="mt-4 space-y-3">
              <Checkbox
                id="q-active"
                label="Active in Question Bank"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <p className="text-[11px] text-muted-foreground">
                Active questions can be selected into test blueprints and examination assemblies.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        onConfirm={() => router.push("/admin/questions")}
        title="Discard Changes"
        description="Are you sure you want to discard your changes? Unsaved edits will be lost."
        confirmLabel="Discard"
        variant="danger"
      />
    </div>
  );
}
