"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ExamEngine from "@/components/exam/ExamEngine";
import { ShieldCheck, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import type { MockQuestion } from "@/lib/mockExamData";

interface AttemptInitData {
  attemptId: string;
  testTitle: string;
  examName: string;
  durationMinutes: number;
  remainingSeconds: number;
  questions: MockQuestion[];
  savedAnswers: Record<string, string>;
}

export default function TestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AttemptInitData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initAttempt() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/tests/${testId}/attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 401) {
          router.push(`/login?callbackUrl=/test/${testId}`);
          return;
        }

        const resData = await res.json();

        if (!res.ok) {
          throw new Error(resData.error || "Failed to start or resume mock test");
        }

        if (isMounted) {
          setData(resData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "An unexpected error occurred loading the test");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAttempt();

    return () => {
      isMounted = false;
    };
  }, [testId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Initializing Examination Session</h2>
        <p className="text-slate-400 text-xs mt-2 max-w-sm text-center">
          Loading test questions, verifying proctoring integrity, and synchronizing server time...
        </p>
        <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-800/60 px-3.5 py-1.5 rounded-full border border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>NTA / TCS-iON Secure CBT Environment</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Unable to Load Mock Test</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-md text-center">{error}</p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Mock Test Series
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ExamEngine
      attemptId={data.attemptId}
      testTitle={data.testTitle}
      examName={data.examName}
      initialTimeSeconds={data.remainingSeconds}
      questions={data.questions}
      initialAnswers={data.savedAnswers}
    />
  );
}
