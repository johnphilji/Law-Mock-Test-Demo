"use client";

import { useState, useEffect } from "react";
import { MockQuestion, QuestionStatus, mockSubjects } from "@/lib/mockExamData";
import { UserCircle2, Info, ChevronRight } from "lucide-react";

interface ExamEngineProps {
  questions: MockQuestion[];
}

export default function ExamEngine({ questions }: ExamEngineProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeSubject, setActiveSubject] = useState(mockSubjects[0]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(177 * 60 + 58);

  useEffect(() => {
    if (!statuses[questions[0].id]) {
      setStatuses(prev => ({ ...prev, [questions[0].id]: "not_answered" }));
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleNavigate = (index: number, currentOverride?: QuestionStatus) => {
    setStatuses((prev) => {
      const next = { ...prev };
      if (currentOverride) {
        next[currentQuestion.id] = currentOverride;
      } else if (!answers[currentQuestion.id] && prev[currentQuestion.id] !== "marked" && prev[currentQuestion.id] !== "answered_marked") {
        next[currentQuestion.id] = "not_answered";
      }
      
      const targetId = questions[index].id;
      if (!next[targetId]) {
        next[targetId] = "not_answered";
      }
      return next;
    });

    setCurrentQuestionIndex(index);
    setActiveSubject(questions[index].subject);
  };

  const handleOptionSelect = (key: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: key });
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

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-sm overflow-hidden select-none">
      {/* Cinematic Dark Header */}
      <header className="flex justify-between items-center px-6 py-3 bg-slate-900 border-b border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.2)] z-20 relative">
        <h1 className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-200">
          PANTHER LAW PREP <span className="font-medium text-slate-400 text-sm ml-2 tracking-normal">| AIBE MOCK TEST 2026</span>
        </h1>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 text-xs bg-slate-800/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-slate-300 cursor-pointer hover:bg-slate-700 transition-colors border border-slate-700/50">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold border border-emerald-500/30">T</span> 
            Accessibility
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-800/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-slate-300 cursor-pointer hover:bg-slate-700 transition-colors border border-slate-700/50">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold border border-amber-500/30">Q</span> 
            Magnifier
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Side: Question Panel */}
        <div className="flex-1 flex flex-col bg-white border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
          
          {/* Subject Tabs - Premium Glassmorphism */}
          <div className="flex items-center gap-3 p-3 border-b border-slate-100 bg-slate-50/50 backdrop-blur-md overflow-x-auto">
            <span className="text-slate-400 font-semibold px-2 uppercase tracking-wider text-[11px] mr-2">Sections</span>
            {mockSubjects.map(subject => (
              <button 
                key={subject}
                onClick={() => {
                  const firstQ = questions.findIndex(q => q.subject === subject);
                  if (firstQ !== -1) handleNavigate(firstQ, answers[currentQuestion.id] ? "answered" : "not_answered");
                }}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeSubject === subject 
                    ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] scale-105" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                }`}
              >
                {subject} <Info size={14} className={`opacity-80 ${activeSubject === subject ? "text-white" : "text-slate-400"}`} />
              </button>
            ))}
            <div className="ml-auto font-bold text-slate-700 whitespace-nowrap px-6 py-2 bg-white rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
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
              <button className="text-slate-500 border border-slate-200 px-4 py-1.5 bg-white rounded-full text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm">
                Bookmark
              </button>
            </div>
          </div>

          {/* Question Body - Highly legible, beautiful typography */}
          <div className="flex-1 overflow-y-auto p-10 bg-white">
            <div className="text-slate-800 font-medium text-[17px] leading-[1.8] max-w-4xl mb-10">
              {currentQuestion.text}
            </div>
            
            <div className="space-y-4 max-w-3xl">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === option.key;
                return (
                  <label 
                    key={option.key} 
                    className={`flex items-start gap-5 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ease-in-out group ${
                      isSelected 
                        ? "border-blue-500 bg-blue-50/50 shadow-[0_4px_16px_rgba(37,99,235,0.08)]" 
                        : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm"
                    }`}
                  >
                    {/* Custom Radio Button for premium feel */}
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "border-blue-600" : "border-slate-300 group-hover:border-blue-400"
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-in zoom-in duration-200" />}
                    </div>
                    
                    <span className={`flex-1 leading-relaxed text-[15px] pt-px transition-colors ${
                      isSelected ? "text-blue-900 font-semibold" : "text-slate-700 font-medium"
                    }`}>
                      {option.text}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Premium Action Footer */}
          <div className="p-5 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex justify-between items-center shadow-[0_-8px_30px_rgba(0,0,0,0.03)] z-20">
            <div className="flex gap-4">
              <button 
                onClick={handleMarkAndNext} 
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3 px-8 rounded-xl text-sm shadow-sm transition-all hover:border-purple-300 hover:text-purple-700 active:scale-95"
              >
                Mark for Review & Next
              </button>
              <button 
                onClick={handleClearResponse} 
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3 px-8 rounded-xl text-sm shadow-sm transition-all hover:border-red-300 hover:text-red-600 active:scale-95"
              >
                Clear Response
              </button>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleSaveAndNext} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-10 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all active:scale-95 flex items-center gap-2"
              >
                Save & Next <ChevronRight size={18} strokeWidth={3} />
              </button>
              <button 
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-10 rounded-xl shadow-md transition-all active:scale-95"
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
    </div>
  );
}
