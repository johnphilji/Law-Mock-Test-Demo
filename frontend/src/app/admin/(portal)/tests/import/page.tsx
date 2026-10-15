"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Edit3, 
  Save, 
  ArrowRight, 
  ArrowLeft,
  Check, 
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  Clock,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExtractedOption {
  key: string;
  text: string;
  isCorrect?: boolean;
}

interface ExtractedQuestion {
  sourceQuestionNumber: number;
  questionText: string;
  options: ExtractedOption[];
  correctOptionKey: string | null;
  explanation: string;
  subject: string;
  confidence: number;
  reviewRequired: boolean;
  warnings: string[];
}

interface ExamMetadata {
  title: string;
  examType: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  positiveMarks: number;
  negativeMarks: number;
  instructions: string[];
}

export default function ImportMockTestPage() {
  const router = useRouter();

  // Stage: "upload" -> "review" -> "completed"
  const [stage, setStage] = useState<"upload" | "review" | "completed">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Metadata
  const [metadata, setMetadata] = useState<ExamMetadata>({
    title: "",
    examType: "AIBE",
    durationMinutes: 210,
    totalQuestions: 100,
    totalMarks: 100,
    positiveMarks: 1,
    negativeMarks: 0,
    instructions: ["Standard NTA CBT Computer-Based Examination Rules Apply."],
  });

  // Extracted questions & filter
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [filter, setFilter] = useState<"all" | "review">("all");
  const [createdTest, setCreatedTest] = useState<{ id: string; slug: string; title: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      // Auto-set title if empty
      if (!metadata.title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setMetadata((prev) => ({ ...prev, title: cleanName }));
      }
    }
  };

  const handleParse = async () => {
    if (!selectedFile) {
      setError("Please select a .docx or .pdf document first.");
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (metadata.title) formData.append("title", metadata.title);

      const res = await fetch("/api/admin/tests/import/parse", {
        method: "POST",
        body: formData,
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server error (${res.status}): Failed to parse document`);
      }
      if (!res.ok) {
        throw new Error(json.error || "Failed to extract test from document");
      }

      const { data } = json;
      setMetadata((prev) => ({
        ...prev,
        ...data.metadata,
        title: prev.title || data.metadata.title,
      }));
      setQuestions(data.questions);
      setStage("review");
    } catch (err: any) {
      setError(err.message || "Failed to parse document");
    } finally {
      setIsParsing(false);
    }
  };

  // Editing helpers
  const handleUpdateQuestionText = (index: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, questionText: text } : q))
    );
  };

  const handleSetCorrectOption = (qIdx: number, optKey: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        const options = (q.options || []).map((opt) => ({
          ...opt,
          isCorrect: opt.key === optKey,
        }));
        const warnings = (q.warnings || []).filter((w) => !w.includes("correct answer"));
        return {
          ...q,
          correctOptionKey: optKey,
          options,
          warnings,
          reviewRequired: warnings.length > 0,
        };
      })
    );
  };

  const handleUpdateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        const options = (q.options || []).map((opt, oIdx) =>
          oIdx === optIdx ? { ...opt, text } : opt
        );
        return { ...q, options };
      })
    );
  };

  const handleUpdateExplanation = (qIdx: number, explanation: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIdx ? { ...q, explanation } : q))
    );
  };

  const handleSaveToDatabase = async (publishNow: boolean) => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/tests/import/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            totalQuestions: questions.length,
            totalMarks: questions.length * (metadata.positiveMarks || 1),
          },
          questions,
          status: publishNow ? "PUBLISHED" : "DRAFT",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save mock test into database");
      }

      setCreatedTest({
        id: json.testId,
        slug: json.slug,
        title: json.title,
      });
      setStage("completed");
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const reviewCount = questions.filter((q) => q.reviewRequired).length;
  const filteredQuestions = filter === "review" 
    ? questions.filter((q) => q.reviewRequired)
    : questions;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin/tests" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Tests
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-1">Import Mock Test from Document</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload a .docx or .pdf mock test to automatically extract questions, options, answer keys, and explanations.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* STAGE 1: UPLOAD */}
      {stage === "upload" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Drag & Drop */}
            <div className="md:col-span-2 space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-brand-600 rounded-2xl p-10 text-center cursor-pointer bg-white transition hover:bg-slate-50 flex flex-col items-center justify-center min-h-[260px]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {selectedFile ? selectedFile.name : "Choose a document or drag it here"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Supports .docx (Word) and .pdf. Automatically extracts full questions, answer options, and matches final answer keys.
                </p>
                {selectedFile && (
                  <span className="mt-3 text-xs bg-emerald-50 text-emerald-700 font-semibold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {(selectedFile.size / 1024).toFixed(1)} KB Ready to Process
                  </span>
                )}
              </div>
            </div>

            {/* Right 1 Col: Test Metadata Configuration */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-foreground">Exam Metadata</h3>

              <div>
                <label className="text-xs font-semibold text-slate-700">Test Title</label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  placeholder="e.g. AIBE Mock Test 1"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Exam Category</label>
                <select
                  value={metadata.examType}
                  onChange={(e) => setMetadata({ ...metadata, examType: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white"
                >
                  <option value="AIBE">AIBE (All India Bar Examination)</option>
                  <option value="CLAT">CLAT (Common Law Admission Test)</option>
                  <option value="AILET">AILET (All India Law Entrance)</option>
                  <option value="JUDICIARY">Judiciary Services Examination</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Duration (Min)</label>
                  <input
                    type="number"
                    value={metadata.durationMinutes}
                    onChange={(e) => setMetadata({ ...metadata, durationMinutes: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Negative Marks</label>
                  <input
                    type="number"
                    step="0.25"
                    value={metadata.negativeMarks}
                    onChange={(e) => setMetadata({ ...metadata, negativeMarks: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={handleParse}
                disabled={!selectedFile || isParsing}
                className="w-full mt-4"
                size="lg"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Extracting Questions...
                  </>
                ) : (
                  <>
                    Parse Document & Review <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: REVIEW & VALIDATION */}
      {stage === "review" && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-border shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Questions</span>
              <p className="text-2xl font-bold text-foreground mt-1">{questions.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-border shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Answer Key Matched</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {questions.filter((q) => q.correctOptionKey !== null).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-border shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Explanations Found</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {questions.filter((q) => q.explanation.length > 0).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-border shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Review Flagged</span>
              <p className={`text-2xl font-bold mt-1 ${reviewCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {reviewCount}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Questions ({questions.length})
              </button>
              <button
                onClick={() => setFilter("review")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === "review" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                Needs Review ({reviewCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStage("upload")}
              >
                Re-upload Document
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSaveToDatabase(false)}
                disabled={isSaving}
              >
                Save as Draft
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveToDatabase(true)}
                disabled={isSaving || reviewCount > 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                Validate & Publish Test
              </Button>
            </div>
          </div>

          {reviewCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {reviewCount} question(s) require manual review before this test can be published (missing answers or incomplete options). You can still save it as a Draft.
              </span>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const originalIndex = questions.findIndex((orig) => orig.sourceQuestionNumber === q.sourceQuestionNumber);

              return (
                <div 
                  key={q.sourceQuestionNumber}
                  className={`bg-white rounded-2xl border p-6 space-y-4 shadow-2xs transition ${
                    q.reviewRequired ? "border-amber-300 bg-amber-50/20" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm bg-slate-100 px-3 py-1 rounded-lg text-slate-800">
                        Q{q.sourceQuestionNumber}
                      </span>
                      {q.reviewRequired && (
                        <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Review Required: {q.warnings.join(", ")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-medium">Correct Key:</span>
                      <div className="flex gap-1">
                        {["A", "B", "C", "D"].map((key) => (
                          <button
                            key={key}
                            onClick={() => handleSetCorrectOption(originalIndex, key)}
                            className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                              q.correctOptionKey === key
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {key}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Question Textarea */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Question Text</label>
                    <textarea
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestionText(originalIndex, e.target.value)}
                      rows={2}
                      className="w-full mt-1 p-3 border border-border rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => (
                      <div 
                        key={opt.key}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                          q.correctOptionKey === opt.key
                            ? "bg-emerald-50/60 border-emerald-300"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSetCorrectOption(originalIndex, opt.key)}
                          className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                            q.correctOptionKey === opt.key
                              ? "bg-emerald-600 text-white"
                              : "bg-white border border-slate-300 text-slate-600"
                          }`}
                        >
                          {opt.key}
                        </button>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleUpdateOptionText(originalIndex, optIdx, e.target.value)}
                          className="flex-1 bg-transparent text-xs font-medium text-slate-800 focus:outline-hidden"
                          placeholder={`Option ${opt.key}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Explanation Field */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Explanation / Solution</label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => handleUpdateExplanation(originalIndex, e.target.value)}
                      placeholder="Enter explanation for post-submission review..."
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-xs text-slate-700 bg-slate-50"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE 3: COMPLETED */}
      {stage === "completed" && createdTest && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border-2 border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Mock Test Successfully Imported!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The mock test <strong>{createdTest.title}</strong> has been saved with all {questions.length} questions, answer keys, and scoring rules into PostgreSQL.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/test/${createdTest.id}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
            >
              <PlayCircle className="w-4 h-4" /> Launch CBT Test Engine
            </Link>
            <Link
              href="/admin/tests"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
            >
              Manage in Admin Portal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
