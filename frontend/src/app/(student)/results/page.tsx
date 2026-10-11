"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  FileText
} from "lucide-react";
import { mockQuestions, type MockQuestion } from "@/lib/mock-data";

export default function StudentResultsPage() {
  const [activeTab, setActiveTab] = useState<"summary" | "solutions">("summary");

  const totalQuestions = mockQuestions.length;
  const correct = 3;
  const incorrect = 1;
  const unattempted = totalQuestions - (correct + incorrect);
  const score = (correct * 1) - (incorrect * 0.25);
  const maxScore = totalQuestions * 1;
  const percentile = 94.6;
  const rank = 142;
  const totalCandidates = 4250;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Scorecard: CLAT All-India Mock 01</h1>
          <p className="text-xs text-slate-500">Attempted on 11 Oct 2026 • Proctored Session Verified</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5" /> Print Scorecard
          </button>
        </div>
      </div>

      {/* Main Score & Rank Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="space-y-1 py-2 md:py-0">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Your Final Score</p>
            <h2 className="text-4xl sm:text-5xl font-black text-amber-400">{score.toFixed(2)}</h2>
            <p className="text-xs text-slate-400">Out of {maxScore}.00 Marks</p>
          </div>

          <div className="space-y-1 py-2 md:py-0">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">All-India Percentile</p>
            <h2 className="text-4xl sm:text-5xl font-black text-emerald-400">{percentile}%</h2>
            <p className="text-xs text-slate-400">Top 5% of candidates</p>
          </div>

          <div className="space-y-1 py-2 md:py-0">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Projected AIR Rank</p>
            <h2 className="text-4xl sm:text-5xl font-black text-blue-400">#{rank}</h2>
            <p className="text-xs text-slate-400">Among {totalCandidates.toLocaleString()} candidates</p>
          </div>

          <div className="space-y-1 py-2 md:py-0">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Accuracy Rate</p>
            <h2 className="text-4xl sm:text-5xl font-black text-purple-400">
              {((correct / (correct + incorrect)) * 100).toFixed(0)}%
            </h2>
            <p className="text-xs text-slate-400">3 Correct • 1 Incorrect</p>
          </div>
        </div>
      </div>

      {/* Breakdown Breakdown Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("summary")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "summary"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Sectional Analysis
        </button>
        <button
          onClick={() => setActiveTab("solutions")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "solutions"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Detailed Solutions & Answer Key
        </button>
      </div>

      {activeTab === "summary" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Correct Attempts</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{correct}</div>
            <p className="text-xs text-slate-500">+{correct * 1} marks earned</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Incorrect Attempts</span>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{incorrect}</div>
            <p className="text-xs text-slate-500">-{incorrect * 0.25} negative deduction</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Skipped / Unattempted</span>
              <AlertCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{unattempted}</div>
            <p className="text-xs text-slate-500">0 marks change</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {mockQuestions.map((q: MockQuestion, idx: number) => {
            const version = q.versions[q.versions.length - 1];
            const correctOpt = version?.options.find((o) => o.isCorrect);

            return (
              <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    Question {idx + 1} • {q.subjectName}
                  </span>
                  {correctOpt && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Correct Answer: Option {correctOpt.optionKey}
                    </span>
                  )}
                </div>

                <div className="text-sm font-medium text-slate-900 leading-relaxed">
                  {version?.questionText}
                </div>

                <div className="space-y-2 text-xs">
                  {version?.options.map((opt) => (
                    <div 
                      key={opt.optionKey}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        opt.isCorrect 
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold" 
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span><strong>({opt.optionKey})</strong> {opt.optionText}</span>
                      {opt.isCorrect && (
                        <span className="text-[10px] uppercase font-bold text-emerald-700">Correct Key</span>
                      )}
                    </div>
                  ))}
                </div>

                {version?.explanation && (
                  <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">Official Explanation:</span>
                    <p className="text-slate-700 leading-relaxed">{version.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
