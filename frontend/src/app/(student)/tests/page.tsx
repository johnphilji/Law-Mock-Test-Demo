"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Clock, 
  ShoppingCart, 
  Check, 
  ShieldCheck, 
  Zap,
  BookOpen
} from "lucide-react";

interface TestItem {
  id: string;
  title: string;
  examName: string;
  type: string;
  durationMinutes: number;
  totalQuestions: number;
  pricePaise: number;
  discountedPricePaise: number | null;
  isFree?: boolean;
}

export default function StudentTestsCatalog() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tests")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tests && Array.isArray(data.tests)) {
          setTests(data.tests);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredTests = tests.filter((test) => {
    if (filterType !== "ALL" && test.type !== filterType) return false;
    if (search && !test.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleCart = (testId: string) => {
    setCart((prev) => 
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All India Mock Tests & Test Series</h1>
          <p className="text-sm text-slate-500 mt-1">
            Authentic NTA/TCS-iON CBT Computer Based Tests. Choose individual mocks or bundled test series.
          </p>
        </div>

        {cart.length > 0 && (
          <Link
            href={`/checkout?cart=${cart.join(",")}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
          >
            <ShoppingCart className="w-4 h-4" />
            Proceed to Checkout ({cart.length} item{cart.length > 1 ? "s" : ""})
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mocks by title, exam..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "MOCK", "SECTIONAL", "TOPIC"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterType === t
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t === "ALL" ? "All Formats" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Test Series Cards or Empty State */}
      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const inCart = cart.includes(test.id);
            const price = ((test.discountedPricePaise || test.pricePaise) / 100).toFixed(0);
            const originalPrice = (test.pricePaise / 100).toFixed(0);

            return (
              <div 
                key={test.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {test.type}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {test.durationMinutes} mins
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Exam: <strong className="text-slate-700 font-semibold">{test.examName}</strong>
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{test.totalQuestions} Questions with NTA Marking Scheme</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Server-side Instant Evaluation & AIR</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Unlimited Review with Expert Solutions</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/70 p-5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-slate-900">
                        {test.isFree ? "FREE" : `₹${price}`}
                      </span>
                      {test.discountedPricePaise && (
                        <span className="text-xs text-slate-400 line-through">₹{originalPrice}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Inclusive of all taxes</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCart(test.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        inCart
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {inCart ? "In Cart" : "Add"}
                    </button>

                    <Link
                      href={test.isFree ? `/test/${test.id}` : `/checkout?testId=${test.id}`}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
                    >
                      {test.isFree ? "Start Test" : "Buy Now"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No mock tests available yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            There are currently no mock tests published in the catalog. When real tests are created and published from the Admin Portal, they will automatically appear here.
          </p>
        </div>
      )}
    </div>
  );
}
