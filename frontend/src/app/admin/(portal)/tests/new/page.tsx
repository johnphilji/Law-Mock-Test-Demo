"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Settings, 
  FileCheck, 
  Award,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function NewTestBuilderPage() {
  const router = useRouter();
  
  // Test paper metadata
  const [title, setTitle] = useState("");
  const [examName, setExamName] = useState("All India Bar Examination (AIBE) XXI");
  const [type, setType] = useState<"MOCK" | "SECTIONAL" | "TOPIC">("MOCK");
  const [durationMinutes, setDurationMinutes] = useState(210);
  const [priceRupees, setPriceRupees] = useState(299);
  const [discountRupees, setDiscountRupees] = useState(199);
  const [isFree, setIsFree] = useState(false);
  
  // Marking scheme
  const [correctMarks, setCorrectMarks] = useState(1.0);
  const [negativeMarks, setNegativeMarks] = useState(0.0);

  // Sections Blueprint
  const [sections, setSections] = useState([
    { id: "sec_1", name: "Section A: Constitutional Law & IPC", questionCount: 30 },
    { id: "sec_2", name: "Section B: CrPC, Evidence & CPC", questionCount: 30 },
    { id: "sec_3", name: "Section C: Commercial & Special Laws", questionCount: 40 },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSection = () => {
    const nextIdx = sections.length + 1;
    setSections([
      ...sections,
      { id: `sec_${Date.now()}`, name: `Section ${String.fromCharCode(64 + nextIdx)}: New Section`, questionCount: 20 }
    ]);
  };

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const totalQuestions = sections.reduce((acc, curr) => acc + Number(curr.questionCount || 0), 0);
  const maxMarks = totalQuestions * correctMarks;

  const handleSave = async (publishDirectly: boolean) => {
    if (!title.trim()) {
      setError("Please provide a Title for the mock test.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          examName: examName.trim(),
          type,
          durationMinutes: Number(durationMinutes) || 120,
          totalMarks: maxMarks,
          negativeMarking: Number(negativeMarks) || 0,
          status: publishDirectly ? "PUBLISHED" : "DRAFT",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create test blueprint in database");
      }

      router.push("/admin/tests");
    } catch (err: any) {
      setError(err.message || "Failed to save test blueprint");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <Link href="/admin/tests" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Test Management
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">CBT Mock Test Blueprint Builder</h1>
          <p className="text-xs text-slate-500">Configure exam parameters, section breakdown, duration, and save directly to PostgreSQL.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push("/admin/tests")}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving to Database...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save & Publish Test
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" /> General Test Details
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mock Test Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AIBE XXI All-India Grand Mock Test #01"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Examination</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. All India Bar Examination (AIBE) XXI"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="MOCK">Full Mock Test</option>
                    <option value="SECTIONAL">Sectional Test</option>
                    <option value="TOPIC">Topic Mastery Test</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Mode</label>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
                    Strict Proctored (NTA CBT Full Window)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Blueprinting */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" /> Sections & Question Allocation
              </h2>
              <button
                type="button"
                onClick={handleAddSection}
                className="text-xs text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section
              </button>
            </div>

            <div className="space-y-3">
              {sections.map((sec, idx) => (
                <div key={sec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      value={sec.name}
                      onChange={(e) => {
                        const copy = [...sections];
                        copy[idx]!.name = e.target.value;
                        setSections(copy);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">Questions:</span>
                      <input
                        type="number"
                        value={sec.questionCount}
                        onChange={(e) => {
                          const copy = [...sections];
                          copy[idx]!.questionCount = Number(e.target.value);
                          setSections(copy);
                        }}
                        className="w-16 px-2 py-1 rounded border border-slate-200 text-xs text-center bg-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sec.id)}
                      disabled={sections.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 transition"
                      title="Remove section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary & Marking Rules (1 col) */}
        <div className="space-y-6">
          {/* Marking Rules */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" /> NTA Marking Scheme
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Marks for Correct Answer</label>
                <input
                  type="number"
                  step="0.5"
                  value={correctMarks}
                  onChange={(e) => setCorrectMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Negative Marks for Incorrect</label>
                <input
                  type="number"
                  step="0.05"
                  value={negativeMarks}
                  onChange={(e) => setNegativeMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <strong className="text-slate-800">{totalQuestions}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Maximum Marks:</span>
                  <strong className="text-slate-800">{maxMarks.toFixed(1)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Commercials */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Commercials & Access Tier</h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="isFree" className="text-slate-700 font-medium cursor-pointer">
                  Make this test Free (Open Demo Mock)
                </label>
              </div>

              {!isFree && (
                <>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Listing Price (₹)</label>
                    <input
                      type="number"
                      value={priceRupees}
                      onChange={(e) => setPriceRupees(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Discounted Offer Price (₹)</label>
                    <input
                      type="number"
                      value={discountRupees}
                      onChange={(e) => setDiscountRupees(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
