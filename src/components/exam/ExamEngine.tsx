"use client";

import { useState, useEffect, useRef } from "react";
import { MockQuestion, QuestionStatus, mockSubjects } from "@/lib/mockExamData";
import { UserCircle2, ChevronRight, X, AlertCircle, CheckCircle2, Bookmark, BookmarkCheck, ZoomIn, ZoomOut, Type } from "lucide-react";

// Mock objection record for local preview state
interface ObjectionRecord {
  attemptId: string;
  questionId: string;
  questionOrder: number;
  text: string;
  submittedAt: string;
}

const MOCK_ATTEMPT_ID = "mock-attempt-001";
const MAX_WORDS = 100;
const FONT_SIZES = ["text-[14px]", "text-[16px]", "text-[18px]", "text-[20px]"];

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

interface ExamEngineProps {
  questions: MockQuestion[];
}

export default function ExamEngine({ questions }: ExamEngineProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeSubject, setActiveSubject] = useState(mockSubjects[0]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(177 * 60 + 58);
  const [timeExpired, setTimeExpired] = useState(false);
  // Accessibility
  const [fontSizeIdx, setFontSizeIdx] = useState(1); // default: text-[16px]
  const [magnifierOn, setMagnifierOn] = useState(false);
  // Submit modal
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // --- Objection modal state ---
  const [objectionOpen, setObjectionOpen] = useState(false);
  const [objectionText, setObjectionText] = useState("");
  const [objectionSubmitted, setObjectionSubmitted] = useState(false);
  const [objectionError, setObjectionError] = useState("");
  // Local mock store: key = `${attemptId}::${questionId}`
  const [objections, setObjections] = useState<Record<string, ObjectionRecord>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Mark first question as visited immediately
    const firstQuestion = questions[0];
    setStatuses(prev => {
      if (!firstQuestion || prev[firstQuestion.id]) return prev;
      return { ...prev, [firstQuestion.id]: "not_answered" };
    });

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Focus textarea when modal opens
  useEffect(() => {
    if (objectionOpen && !objectionSubmitted && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [objectionOpen, objectionSubmitted]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) return null;

  const handleNavigate = (index: number, currentOverride?: QuestionStatus) => {
    setStatuses((prev) => {
      const next = { ...prev };
      if (currentOverride) {
        next[currentQuestion.id] = currentOverride;
      } else if (!answers[currentQuestion.id] && prev[currentQuestion.id] !== "marked" && prev[currentQuestion.id] !== "answered_marked") {
        next[currentQuestion.id] = "not_answered";
      }
      
      const targetQuestion = questions[index];
      if (targetQuestion) {
        if (!next[targetQuestion.id]) {
          next[targetQuestion.id] = "not_answered";
        }
      }
      return next;
    });

    setCurrentQuestionIndex(index);
    setActiveSubject(questions[index]?.subject);
  };

  const handleOptionSelect = (key: string) => {
    if (timeExpired || submitted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: key }));
    // Auto-update status to answered when option picked
    setStatuses(prev => {
      const cur = prev[currentQuestion.id];
      if (cur === "marked") return { ...prev, [currentQuestion.id]: "answered_marked" };
      return { ...prev, [currentQuestion.id]: "answered" };
    });
  };

  const toggleBookmark = () => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  const handleSubmitExam = () => {
    // Save current question status
    const status: QuestionStatus = answers[currentQuestion.id] ? "answered" : "not_answered";
    setStatuses(prev => ({ ...prev, [currentQuestion.id]: status }));
    setSubmitted(true);
    setSubmitOpen(false);
  };

  const handleSaveAndNext = () => {
    const status: QuestionStatus = answers[currentQuestion.id] ? "answered" : "not_answered";
    if (currentQuestionIndex < questions.length - 1) {
      handleNavigate(currentQuestionIndex + 1, status);
    } else {
      setStatuses((prev) => ({ ...prev, [currentQuestion.id]: status }));
    }
  };

  const handleMarkAndNext = () => {
    const status: QuestionStatus = answers[currentQuestion.id] ? "answered_marked" : "marked";
    if (currentQuestionIndex < questions.length - 1) {
      handleNavigate(currentQuestionIndex + 1, status);
    } else {
      setStatuses((prev) => ({ ...prev, [currentQuestion.id]: status }));
    }
  };

  const handleClearResponse = () => {
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    setAnswers(newAnswers);
    setStatuses((prev) => ({ ...prev, [currentQuestion.id]: "not_answered" }));
  };

  // --- Objection handlers ---
  const openObjectionModal = () => {
    const key = `${MOCK_ATTEMPT_ID}::${currentQuestion.id}`;
    const existing = objections[key];
    if (existing) {
      setObjectionText(existing.text);
    } else {
      setObjectionText("");
    }
    setObjectionError("");
    setObjectionSubmitted(false);
    setObjectionOpen(true);
  };

  const closeObjectionModal = () => {
    setObjectionOpen(false);
    setObjectionError("");
    setObjectionSubmitted(false);
  };

  const wordCount = countWords(objectionText);
  const isOverLimit = wordCount > MAX_WORDS;

  const handleObjectionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setObjectionText(val);
    const wc = countWords(val);
    if (wc > MAX_WORDS) {
      setObjectionError(`Word limit exceeded. Please reduce to ${MAX_WORDS} words.`);
    } else {
      setObjectionError("");
    }
  };

  const handleSubmitObjection = () => {
    if (objectionText.trim() === "") {
      setObjectionError("Please describe your concern before submitting.");
      return;
    }
    if (isOverLimit) {
      setObjectionError(`Word limit exceeded. Please reduce to ${MAX_WORDS} words.`);
      return;
    }
    const key = `${MOCK_ATTEMPT_ID}::${currentQuestion.id}`;
    const record: ObjectionRecord = {
      attemptId: MOCK_ATTEMPT_ID,
      questionId: currentQuestion.id,
      questionOrder: currentQuestion.order,
      text: objectionText.trim(),
      submittedAt: new Date().toISOString(),
    };
    setObjections(prev => ({ ...prev, [key]: record }));
    setObjectionSubmitted(true);
    setObjectionError("");
  };

  // Check if there's an existing objection for current question
  const hasExistingObjection = !!objections[`${MOCK_ATTEMPT_ID}::${currentQuestion.id}`];
  const isBookmarked = bookmarks.has(currentQuestion.id);

  // Computed summary for submit screen
  const finalCounts = {
    answered: Object.values(statuses).filter(s => s === "answered" || s === "answered_marked").length,
    notAnswered: Object.values(statuses).filter(s => s === "not_answered").length,
    notVisited: questions.length - Object.keys(statuses).length,
    markedForReview: Object.values(statuses).filter(s => s === "marked").length,
  };

  const counts = {
    not_visited: questions.length - Object.keys(statuses).length,
    not_answered: Object.values(statuses).filter(s => s === "not_answered").length,
    answered: Object.values(statuses).filter(s => s === "answered").length,
    marked: Object.values(statuses).filter(s => s === "marked").length,
    answered_marked: Object.values(statuses).filter(s => s === "answered_marked").length,
  };

  const getShapeClasses = (status?: QuestionStatus) => {
    const base = "shadow-md transition-all duration-300 hover:scale-[1.15] hover:shadow-lg active:scale-95";
    switch (status) {
      case "not_answered": 
        return `${base} bg-gradient-to-b from-[#e74c3c] to-[#c0392b] text-white [clip-path:polygon(0%_0%,100%_0%,100%_75%,50%_100%,0%_75%)]`;
      case "answered": 
        return `${base} bg-gradient-to-b from-[#2ecc71] to-[#27ae60] text-white [clip-path:polygon(50%_0%,100%_25%,100%_100%,0%_100%,0%_25%)]`;
      case "marked": 
        return `${base} bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] text-white rounded-full`;
      case "answered_marked": 
        return `${base} bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] text-white rounded-full relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-3.5 after:h-3.5 after:bg-[#2ecc71] after:rounded-full after:border-2 after:border-white after:shadow-sm`;
      default: 
        return `${base} bg-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-300`;
    }
  };

  // If exam is fully submitted, show results screen
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white font-sans p-8">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border-2 border-emerald-400/40">
          <CheckCircle2 size={44} className="text-emerald-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Test Submitted!</h1>
        <p className="text-slate-400 mb-10 text-base">Your responses have been recorded successfully.</p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-10">
          <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/10">
            <div className="text-3xl font-extrabold text-emerald-400">{finalCounts.answered}</div>
            <div className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Answered</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/10">
            <div className="text-3xl font-extrabold text-red-400">{finalCounts.notAnswered}</div>
            <div className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Not Answered</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/10">
            <div className="text-3xl font-extrabold text-slate-400">{finalCounts.notVisited}</div>
            <div className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Not Visited</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/10">
            <div className="text-3xl font-extrabold text-purple-400">{finalCounts.markedForReview}</div>
            <div className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Marked for Review</div>
          </div>
        </div>
        <p className="text-slate-500 text-sm">You can close this window.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-slate-50 font-sans text-sm overflow-hidden ${magnifierOn ? "[zoom:1.08]" : ""}`}>
      {/* Cinematic Dark Header */}
      <header className="flex justify-between items-center px-6 py-3 bg-slate-900 border-b border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.2)] z-20 relative">
        <h1 className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-200">
          PANTHER LAW PREP <span className="font-medium text-slate-400 text-sm ml-2 tracking-normal">| AIBE MOCK TEST 2026</span>
        </h1>
        <div className="flex gap-2 items-center">
          {/* Font size accessibility controls */}
          <button
            onClick={() => setFontSizeIdx(i => Math.max(0, i - 1))}
            disabled={fontSizeIdx === 0}
            title="Decrease font size"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:bg-slate-700 transition-colors disabled:opacity-30"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setFontSizeIdx(i => Math.min(FONT_SIZES.length - 1, i + 1))}
            disabled={fontSizeIdx === FONT_SIZES.length - 1}
            title="Increase font size"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:bg-slate-700 transition-colors disabled:opacity-30"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setMagnifierOn(m => !m)}
            title={magnifierOn ? "Disable magnifier" : "Enable magnifier (zoom)"}
            className={`flex items-center gap-2 text-xs px-4 py-1.5 rounded-full font-semibold border transition-colors ${
              magnifierOn
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                : "bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-700"
            }`}
          >
            <Type size={13} /> {magnifierOn ? "Magnifier ON" : "Magnifier"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Side: Question Panel */}
        <div className="flex-1 flex flex-col bg-white border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
          
          {/* Clean Info + Timer Bar (replaces subject tabs) */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="font-bold text-slate-800 text-base">AIBE 2026</span>
              <span className="w-px h-4 bg-slate-300" />
              <span className="font-medium">
                Question <span className="font-bold text-slate-800">{currentQuestion.order}</span>
                <span className="text-slate-400"> / {questions.length}</span>
              </span>
              <span className="w-px h-4 bg-slate-300" />
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-3 py-1 rounded-full border border-slate-200">
                {currentQuestion.subject}
              </span>
            </div>
            <div className="font-bold text-slate-700 whitespace-nowrap px-5 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Time Left : <span className="font-mono text-blue-700">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Question Meta Bar */}
          <div className="flex justify-between items-center px-8 py-3 border-b border-slate-100 bg-white text-sm">
            <div className="text-slate-500 font-medium">
              Question Type: <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md ml-2">Multiple Choice</span>
            </div>
            <div className="text-slate-500 font-medium flex items-center gap-3">
              Marks for correct answer: <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+1</span> 
              <span className="w-px h-4 bg-slate-300"></span> 
              Negative Marks: <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">0</span>
            </div>
          </div>

          <div className="flex justify-between items-center px-8 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <h2 className="font-extrabold text-slate-800 text-2xl tracking-tight">Question {currentQuestion.order}</h2>
              <button
                onClick={toggleBookmark}
                title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
                className={`flex items-center gap-1.5 border px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                  isBookmarked
                    ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                }`}
              >
                {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </button>
            </div>
          </div>

          {/* Question Body */}
          <div className="flex-1 overflow-y-auto p-10 bg-white">
            {timeExpired && (
              <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 font-semibold text-sm">
                <AlertCircle size={16} /> Time is up! You can no longer change your answers.
              </div>
            )}
            <div className={`text-slate-800 font-medium leading-[1.8] max-w-4xl mb-10 ${FONT_SIZES[fontSizeIdx]}`}>
              {currentQuestion.text}
            </div>
            
            <div className="space-y-4 max-w-3xl">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.key;
                const disabled = timeExpired || submitted;
                return (
                  <label
                    key={option.key}
                    htmlFor={`opt-${currentQuestion.id}-${option.key}`}
                    className={`flex items-start gap-5 p-5 rounded-2xl border-2 transition-all duration-200 ease-in-out group ${
                      disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"
                    } ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 shadow-[0_4px_16px_rgba(37,99,235,0.08)]"
                        : disabled
                          ? "border-slate-100 bg-white"
                          : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm"
                    }`}
                  >
                    <input
                      type="radio"
                      id={`opt-${currentQuestion.id}-${option.key}`}
                      name={`question-${currentQuestion.id}`}
                      value={option.key}
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() => handleOptionSelect(option.key)}
                      className="sr-only"
                    />
                    {/* Custom radio visual */}
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "border-blue-600" : "border-slate-300 group-hover:border-blue-400"
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                    </div>
                    <span className={`flex-1 leading-relaxed pt-px transition-colors ${FONT_SIZES[fontSizeIdx]} ${
                      isSelected ? "text-blue-900 font-semibold" : "text-slate-700 font-medium"
                    }`}>
                      <span className="font-bold text-slate-400 mr-2">{option.key}.</span>{option.text}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>


          {/* Premium Action Footer */}
          <div className="p-5 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex flex-wrap gap-3 justify-between items-center shadow-[0_-8px_30px_rgba(0,0,0,0.03)] z-20">
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={handleMarkAndNext} 
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3 px-6 rounded-xl text-sm shadow-sm transition-all hover:border-purple-300 hover:text-purple-700 active:scale-95"
              >
                Mark for Review &amp; Next
              </button>
              <button 
                onClick={handleClearResponse} 
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3 px-6 rounded-xl text-sm shadow-sm transition-all hover:border-red-300 hover:text-red-600 active:scale-95"
              >
                Clear Response
              </button>
              {/* Raise an Objection */}
              <button
                id="btn-raise-objection"
                onClick={openObjectionModal}
                className={`relative font-semibold py-3 px-6 rounded-xl text-sm shadow-sm transition-all active:scale-95 border ${
                  hasExistingObjection
                    ? "bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
                    : "bg-white border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50"
                }`}
                title={hasExistingObjection ? "You have already raised an objection for this question" : "Raise an objection for this question"}
              >
                {hasExistingObjection && (
                  <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" />
                )}
                Raise an Objection
              </button>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleSaveAndNext} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-8 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all active:scale-95 flex items-center gap-2"
              >
                Save &amp; Next <ChevronRight size={18} strokeWidth={3} />
              </button>
              <button
                onClick={() => setSubmitOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all active:scale-95"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Palette & Status (Cinematic & Clean) */}
        <div className="w-[340px] flex flex-col bg-slate-50/80 backdrop-blur-3xl border-l border-slate-200/50 z-0">
          
          {/* Candidate Profile Area */}
          <div className="bg-white/60 p-6 flex gap-5 items-center border-b border-slate-200 shadow-sm">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center shadow-inner border-2 border-white">
              <UserCircle2 size={32} className="text-slate-500" />
            </div>
            <div>
              <div className="font-extrabold text-slate-800 text-lg">John Doe</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">AIBE Aspirant</div>
            </div>
          </div>

          {/* Legend Area - Clean & Structured */}
          <div className="p-6 grid grid-cols-2 gap-y-5 bg-white/40 border-b border-slate-200 text-xs text-slate-700 font-semibold">
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-8 h-8 flex items-center justify-center font-bold text-xs shadow-md bg-gradient-to-b from-[#2ecc71] to-[#27ae60] text-white [clip-path:polygon(50%_0%,100%_25%,100%_100%,0%_100%,0%_25%)] group-hover:scale-110 transition-transform">
                {counts.answered}
              </div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-8 h-8 flex items-center justify-center font-bold text-xs shadow-md bg-gradient-to-b from-[#e74c3c] to-[#c0392b] text-white [clip-path:polygon(0%_0%,100%_0%,100%_75%,50%_100%,0%_75%)] group-hover:scale-110 transition-transform">
                {counts.not_answered}
              </div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-8 h-8 flex items-center justify-center font-bold text-xs shadow-sm bg-slate-200 text-slate-600 rounded-lg group-hover:scale-110 transition-transform">
                {counts.not_visited}
              </div>
              <span>Not Visited</span>
            </div>
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-8 h-8 flex items-center justify-center font-bold text-xs shadow-md bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] text-white rounded-full group-hover:scale-110 transition-transform">
                {counts.marked}
              </div>
              <span>Marked</span>
            </div>
            <div className="col-span-2 flex items-center gap-3 mt-2 group cursor-default">
              <div className="w-8 h-8 flex shrink-0 items-center justify-center font-bold text-xs shadow-md bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] text-white rounded-full relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-3 after:h-3 after:bg-[#2ecc71] after:rounded-full after:border-2 after:border-white group-hover:scale-110 transition-transform">
                {counts.answered_marked}
              </div>
              <span className="leading-snug text-[11px] text-slate-500">Answered & Marked for Review <br/><span className="text-emerald-600 font-bold">(Will be evaluated)</span></span>
            </div>
          </div>

          {/* Subject Header */}
          <div className="bg-slate-800 text-white font-bold text-sm px-6 py-3 shadow-sm flex items-center justify-between">
            <span className="uppercase tracking-widest">{activeSubject}</span>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
              {questions.filter(q => q.subject === activeSubject).length} Qs
            </span>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
            <div className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-4 h-px bg-slate-300"></span> Choose a Question
            </div>
            <div className="grid grid-cols-5 gap-3 justify-items-center">
              {questions.filter(q => q.subject === activeSubject).map((q) => {
                const status = statuses[q.id];
                const shapeClass = getShapeClasses(status);

                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavigate(q.order - 1, answers[currentQuestion.id] ? "answered" : "not_answered")}
                    className={`w-[42px] h-[42px] flex items-center justify-center font-bold text-sm ${shapeClass} ${
                      currentQuestionIndex === q.order - 1 ? 'ring-4 ring-blue-500/30 ring-offset-1' : ''
                    }`}
                  >
                    {q.order}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Submit Confirmation Modal ===== */}
      {submitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSubmitOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-800">Submit Exam?</h2>
              <button onClick={() => setSubmitOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-7 py-6">
              <p className="text-slate-600 text-sm mb-6">Once submitted, you cannot change your answers. Please review your progress:</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-extrabold text-emerald-600">{finalCounts.answered}</div>
                  <div className="text-xs text-emerald-700 mt-1 font-semibold">Answered</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-extrabold text-red-600">{finalCounts.notAnswered}</div>
                  <div className="text-xs text-red-700 mt-1 font-semibold">Not Answered</div>
                </div>
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-extrabold text-slate-600">{finalCounts.notVisited}</div>
                  <div className="text-xs text-slate-500 mt-1 font-semibold">Not Visited</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-extrabold text-purple-600">{finalCounts.markedForReview}</div>
                  <div className="text-xs text-purple-700 mt-1 font-semibold">Marked for Review</div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setSubmitOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors active:scale-95">
                  Go Back
                </button>
                <button onClick={handleSubmitExam} className="px-7 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black shadow-md transition-all active:scale-95">
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Raise an Objection Modal ===== */}
      {objectionOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="objection-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeObjectionModal}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 id="objection-modal-title" className="text-lg font-extrabold text-slate-800 tracking-tight">
                  Raise an Objection
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Question No. {currentQuestion.order}
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-400">{currentQuestion.subject}</span>
                </p>
              </div>
              <button
                onClick={closeObjectionModal}
                id="btn-close-objection-modal"
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-7 py-6">
              {!objectionSubmitted ? (
                <>
                  <label htmlFor="objection-textarea" className="block text-sm font-semibold text-slate-700 mb-2">
                    Please describe your concern regarding this question.
                  </label>

                  <textarea
                    id="objection-textarea"
                    ref={textareaRef}
                    value={objectionText}
                    onChange={handleObjectionTextChange}
                    rows={5}
                    placeholder="Describe the issue clearly — e.g., incorrect answer key, ambiguous question, typo, factual error…"
                    className={`w-full rounded-xl border-2 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 resize-none outline-none transition-colors focus:ring-2 focus:ring-offset-1 ${
                      isOverLimit
                        ? "border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50"
                        : "border-slate-200 focus:border-blue-400 focus:ring-blue-100 bg-white"
                    }`}
                  />

                  {/* Word Counter */}
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      {objectionError && (
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                          <AlertCircle size={13} /> {objectionError}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${
                      isOverLimit ? "text-red-600" : wordCount >= MAX_WORDS * 0.85 ? "text-amber-600" : "text-slate-400"
                    }`}>
                      {wordCount} / {MAX_WORDS} words
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      id="btn-cancel-objection"
                      onClick={closeObjectionModal}
                      className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-submit-objection"
                      onClick={handleSubmitObjection}
                      disabled={isOverLimit || objectionText.trim() === ""}
                      className="px-7 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-[0_4px_12px_rgba(234,88,12,0.3)] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      Submit Objection
                    </button>
                  </div>
                </>
              ) : (
                /* Success State */
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-inner">
                    <CheckCircle2 size={36} className="text-emerald-500" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-800 mb-1">Objection submitted successfully.</h3>
                  <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                    Your concern for <strong>Question {currentQuestion.order}</strong> has been recorded. You can continue answering the remaining questions.
                  </p>
                  <button
                    id="btn-close-objection-success"
                    onClick={closeObjectionModal}
                    className="mt-7 px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 shadow-md transition-all active:scale-95"
                  >
                    Continue Exam
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
