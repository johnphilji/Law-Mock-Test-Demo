"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Breadcrumbs, ConfirmDialog } from "@/components/ui/components";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/input";
import { mockSubjects, type MockQuestion, type MockQuestionVersion } from "@/lib/mock-data";
import { Save, Plus, Trash2, ArrowLeft, GripVertical } from "lucide-react";
import Link from "next/link";

interface QuestionEditorProps {
  initialData?: MockQuestion;
}

export function QuestionEditor({ initialData }: QuestionEditorProps) {
  const router = useRouter();
  const currentVersion = initialData?.versions[initialData.versions.length - 1];

  const [subjectId, setSubjectId] = useState(initialData?.subjectId ?? "");
  const [topicName, setTopicName] = useState(initialData?.topicName ?? "");
  const [difficulty, setDifficulty] = useState(currentVersion?.difficulty ?? "MEDIUM");
  const [questionText, setQuestionText] = useState(currentVersion?.questionText ?? "");
  const [explanation, setExplanation] = useState(currentVersion?.explanation ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  
  const [options, setOptions] = useState(
    currentVersion?.options.map(o => ({ ...o })) ?? [
      { optionKey: "A", optionText: "", isCorrect: true, displayOrder: 0 },
      { optionKey: "B", optionText: "", isCorrect: false, displayOrder: 1 },
      { optionKey: "C", optionText: "", isCorrect: false, displayOrder: 2 },
      { optionKey: "D", optionText: "", isCorrect: false, displayOrder: 3 },
    ]
  );

  const [loading, setLoading] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const isEditing = !!initialData;
  const hasAttempts = currentVersion && currentVersion.usedInAttempts > 0;

  const subjectOptions = [
    { value: "", label: "Select a subject..." },
    ...mockSubjects.map((s) => ({ value: s.id, label: s.name })),
  ];

  const difficultyOptions = [
    { value: "EASY", label: "Easy" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HARD", label: "Hard" },
  ];

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].optionText = text;
    setOptions(newOptions);
  };

  const handleSetCorrect = (index: number) => {
    const newOptions = [...options];
    newOptions.forEach((o, i) => {
      o.isCorrect = i === index;
    });
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    const newKey = String.fromCharCode(65 + options.length); // A, B, C, D, E...
    setOptions([...options, { optionKey: newKey, optionText: "", isCorrect: false, displayOrder: options.length }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return; // Minimum 2 options
    const newOptions = options.filter((_, i) => i !== index);
    // Fix isCorrect if the removed one was correct
    if (options[index].isCorrect) {
      newOptions[0].isCorrect = true;
    }
    // Re-assign keys and displayOrder
    newOptions.forEach((o, i) => {
      o.optionKey = String.fromCharCode(65 + i);
      o.displayOrder = i;
    });
    setOptions(newOptions);
  };

  const handleSave = async () => {
    if (!subjectId || !questionText || options.some((o) => !o.optionText)) {
      alert("Please fill in all required fields (Subject, Question, and all Options).");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    router.push("/admin/questions");
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Question Bank", href: "/admin/questions" },
          { label: isEditing ? `Edit Question ${initialData.id}` : "New Question" },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/questions">
            <Button variant="ghost" size="icon-sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {isEditing ? "Edit Question" : "Create New Question"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing ? "Modify this question. If it has been attempted, a new version will be created." : "Add a new question to the bank."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="md" onClick={() => setShowConfirmCancel(true)}>Cancel</Button>
          <Button size="md" onClick={handleSave} loading={loading}>
            <Save className="w-4 h-4" /> Save Question
          </Button>
        </div>
      </div>

      {isEditing && hasAttempts && (
        <div className="bg-warning-50 border border-warning-200 rounded-md p-3 flex gap-3 text-sm text-warning-800">
          <div className="w-5 h-5 rounded-full bg-warning-100 flex items-center justify-center shrink-0 mt-0.5">
            <span className="font-bold text-warning-700">!</span>
          </div>
          <div>
            <p className="font-medium">This question version has been attempted {currentVersion.usedInAttempts} times.</p>
            <p className="mt-0.5">Saving changes will automatically create a <strong>new version (v{initialData.currentVersion + 1})</strong> to preserve historical attempt records. Past attempts will not be affected.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Question Details" />
            <div className="mt-4 space-y-4">
              <Textarea
                id="q-text"
                label="Question Text"
                placeholder="Enter the question here..."
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={5}
              />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Options <span className="text-danger-500">*</span></label>
                  <Button variant="ghost" size="sm" onClick={handleAddOption} disabled={options.length >= 6}>
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {options.map((opt, index) => (
                    <div key={index} className={`flex items-start gap-2 p-3 rounded-md border ${opt.isCorrect ? 'border-success-400 bg-success-50/30' : 'border-border'}`}>
                      <div className="flex flex-col items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-muted-foreground w-6 text-center">{opt.optionKey}.</span>
                        <input
                          type="radio"
                          name="correct-option"
                          className="w-4 h-4 text-success-600 focus:ring-success-500 cursor-pointer"
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
                          className={`min-h-[60px] ${opt.isCorrect ? 'border-success-300 focus:border-success-500 focus:ring-success-500/30' : ''}`}
                        />
                      </div>
                      {options.length > 2 && (
                        <Button variant="ghost" size="icon-sm" className="mt-1 text-muted-foreground hover:text-danger-600" onClick={() => handleRemoveOption(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Textarea
                id="q-explanation"
                label="Explanation (Optional)"
                placeholder="Explain the correct answer. This will be shown to students after they attempt the test."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={4}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Classification" />
            <div className="mt-4 space-y-4">
              <Select
                id="q-subject"
                label="Subject"
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
                label="Difficulty"
                options={difficultyOptions}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                required
              />
            </div>
          </Card>
          
          <Card>
            <CardHeader title="Settings" />
            <div className="mt-4 space-y-4">
              <Checkbox
                id="q-active"
                label="Active (available in question bank)"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </div>
          </Card>

          {isEditing && (
            <Card padding="none">
              <div className="p-4 bg-muted/50 rounded-md">
                <h4 className="text-sm font-semibold text-foreground mb-3">Version History</h4>
                <div className="space-y-3">
                  {initialData.versions.map((v) => (
                    <div key={v.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">v{v.version}</span>
                        {v.id === currentVersion?.id && <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">Current</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{v.usedInAttempts} attempts</span>
                    </div>
                  )).reverse()}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        onConfirm={() => router.push("/admin/questions")}
        title="Discard Changes"
        description="Are you sure you want to discard your changes? Any unsaved work will be lost."
        confirmLabel="Discard"
        variant="danger"
      />
    </div>
  );
}
