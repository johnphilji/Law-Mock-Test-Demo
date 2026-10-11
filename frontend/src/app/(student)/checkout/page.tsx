"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  ArrowRight,
  Sparkles,
  QrCode
} from "lucide-react";
import { mockTests } from "@/lib/mock-data";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const testIdParam = searchParams.get("testId");
  const cartParam = searchParams.get("cart");

  const [selectedItems, setSelectedItems] = useState<typeof mockTests>([]);
  const [gateway, setGateway] = useState<"RAZORPAY" | "STRIPE" | "UPI">("RAZORPAY");
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    let ids: string[] = [];
    if (cartParam) {
      ids = cartParam.split(",");
    } else if (testIdParam) {
      ids = [testIdParam];
    } else {
      ids = [mockTests[0]?.id || ""];
    }

    const items = mockTests.filter(t => ids.includes(t.id));
    setSelectedItems(items.length > 0 ? items : [mockTests[0]!]);
  }, [testIdParam, cartParam]);

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const subtotal = selectedItems.reduce((acc, curr) => acc + (curr.discountedPricePaise || curr.pricePaise), 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const handleProcessPayment = async () => {
    setLoading(true);
    // Simulate real Razorpay order creation & signature verification cycle
    setTimeout(() => {
      setLoading(false);
      setPaymentSuccess(true);
    }, 1800);
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg space-y-5">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Payment Captured & Reconciled</span>
          <h2 className="text-2xl font-extrabold text-slate-900">Enrolled Successfully!</h2>
          <p className="text-sm text-slate-500">
            Payment Ref: <strong>#PAY_RZP_{Math.random().toString(36).substring(2, 9).toUpperCase()}</strong>.
            Your selected mock tests have been unlocked and activated on your student dashboard.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl text-left text-xs space-y-1.5 border border-slate-100">
          <div className="flex justify-between text-slate-600">
            <span>Tests Unlocked:</span>
            <span className="font-semibold text-slate-800">{selectedItems.length} Mock Tests</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Total Paid:</span>
            <span className="font-semibold text-slate-800">₹{(total / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Validity:</span>
            <span className="font-semibold text-emerald-600">1 Year (Exam Season 2026-27)</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
          >
            Go to Student Dashboard
          </Link>
          <Link
            href={`/test/${selectedItems[0]?.id || 'test-clat-full-1'}`}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition"
          >
            Start Test Immediately
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Order Summary & Payment Gateway</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your selected mock test series and complete secure checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart items & Gateway selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Selected items */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Selected Mock Test Series ({selectedItems.length})</h2>

            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Your cart is empty. <Link href="/tests" className="text-blue-600 underline">Browse mock tests</Link>.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {selectedItems.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.examName} • {item.totalQuestions} Questions • {item.durationMinutes} mins</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-900 text-sm">
                        ₹{((item.discountedPricePaise || item.pricePaise) / 100).toFixed(0)}
                      </span>
                      {selectedItems.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Select Payment Method</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label 
                onClick={() => setGateway("RAZORPAY")}
                className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition ${
                  gateway === "RAZORPAY" 
                    ? "border-blue-600 bg-blue-50/50" 
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className={`w-5 h-5 ${gateway === "RAZORPAY" ? "text-blue-600" : "text-slate-400"}`} />
                  {gateway === "RAZORPAY" && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-slate-900">Razorpay</div>
                  <div className="text-[11px] text-slate-500">Cards, Netbanking, UPI</div>
                </div>
              </label>

              <label 
                onClick={() => setGateway("UPI")}
                className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition ${
                  gateway === "UPI" 
                    ? "border-blue-600 bg-blue-50/50" 
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <QrCode className={`w-5 h-5 ${gateway === "UPI" ? "text-blue-600" : "text-slate-400"}`} />
                  {gateway === "UPI" && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-slate-900">Instant UPI</div>
                  <div className="text-[11px] text-slate-500">GPay, PhonePe, Paytm QR</div>
                </div>
              </label>

              <label 
                onClick={() => setGateway("STRIPE")}
                className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition ${
                  gateway === "STRIPE" 
                    ? "border-blue-600 bg-blue-50/50" 
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Lock className={`w-5 h-5 ${gateway === "STRIPE" ? "text-blue-600" : "text-slate-400"}`} />
                  {gateway === "STRIPE" && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-slate-900">International</div>
                  <div className="text-[11px] text-slate-500">Stripe Global Cards</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Bill Breakdown */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-slate-900">Price Details</h2>

            <div className="space-y-3 text-sm text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span>Subtotal ({selectedItems.length} Tests)</span>
                <span className="font-semibold text-slate-900">₹{(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18% Educational Content)</span>
                <span className="font-semibold text-slate-900">₹{(gst / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Platform Discount</span>
                <span>- ₹0.00</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
              <span>Total Payable</span>
              <span>₹{(total / 100).toFixed(2)}</span>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-blue-800">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                128-bit SSL encrypted transaction. Instant webhook reconciliation with automated invoice delivery.
              </span>
            </div>

            <button
              onClick={handleProcessPayment}
              disabled={loading || selectedItems.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Connecting with {gateway} Secure Gateway...</span>
              ) : (
                <>
                  <span>Pay ₹{(total / 100).toFixed(2)} via {gateway}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
