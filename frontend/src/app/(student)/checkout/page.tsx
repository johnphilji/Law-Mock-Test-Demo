"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  Trash2,
  ArrowRight,
  Loader2,
  AlertCircle
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

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  
  const testIdParam = searchParams.get("testId");
  const cartParam = searchParams.get("cart");

  const [selectedItems, setSelectedItems] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentResult, setEnrollmentResult] = useState<{ subscriptionId: string } | null>(null);

  // Load Razorpay official checkout.js script safely
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    let ids: string[] = [];
    if (cartParam) {
      ids = cartParam.split(",").filter(Boolean);
    } else if (testIdParam) {
      ids = [testIdParam];
    }

    if (ids.length === 0) {
      return;
    }

    fetch("/api/tests")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tests && Array.isArray(data.tests)) {
          const allTests: TestItem[] = data.tests;
          const matched = allTests.filter((t) => ids.includes(t.id));
          setSelectedItems(matched);
        }
      })
      .catch(() => {});
  }, [testIdParam, cartParam]);

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  // Fixed server-authoritative subscription plan price (₹49 for 30 Days Access)
  const planPricePaise = 4900;
  const planPriceInr = 49;

  const handleStartRazorpayCheckout = async () => {
    if (selectedItems.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Create order on the server
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testIds: selectedItems.map((i) => i.id),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Unable to initiate payment session");
      }

      const { orderId, amount, currency, keyId, student } = data;

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout engine is loading. Please try again in a few seconds.");
      }

      // 2. Configure Razorpay Standard Checkout modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "Panther Law Prep",
        description: "All-India Mock Test Access (30 Days)",
        order_id: orderId,
        prefill: {
          name: student?.name || "",
          email: student?.email || "",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            // User closed the modal without completing payment
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setLoading(false);
          setVerifying(true);
          setError(null);

          try {
            // 3. Verify payment authoritatively on the server
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed on the server.");
            }

            setEnrollmentResult({ subscriptionId: verifyData.subscriptionId });
          } catch (verifyErr: any) {
            setError(verifyErr.message || "Payment verification failed. Please contact support.");
          } finally {
            setVerifying(false);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", (failResponse: any) => {
        setLoading(false);
        setError(
          failResponse.error?.description || "Payment failed at gateway. Please try with another payment method."
        );
      });

      rzpInstance.open();
    } catch (err: any) {
      setError(err.message || "Payment initiation failed. Please try again.");
      setLoading(false);
    }
  };

  if (enrollmentResult) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Payment Confirmed</span>
          <h2 className="text-2xl font-extrabold text-slate-900">Enrolled Successfully!</h2>
          <p className="text-sm text-slate-500">
            Subscription Ref: <strong className="font-mono text-xs">{enrollmentResult.subscriptionId}</strong>.
            Your selected mock tests have been unlocked on your student dashboard.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl text-left text-xs space-y-2 border border-slate-100">
          <div className="flex justify-between text-slate-600">
            <span>Access Tier:</span>
            <span className="font-semibold text-slate-800">All-India Mock Test Series</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tests Included:</span>
            <span className="font-semibold text-slate-800">{selectedItems.length} Selected Test{selectedItems.length > 1 ? "s" : ""} + Full Series</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Amount Paid:</span>
            <span className="font-semibold text-slate-800">₹{planPriceInr}.00</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Validity Period:</span>
            <span className="font-semibold text-emerald-600">30 Days Full Access</span>
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
            href={selectedItems[0] ? `/test/${selectedItems[0].id}` : "/dashboard"}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition"
          >
            Start Test Immediately
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Secure Checkout & Enrollment</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your selected mock test series and complete enrollment via Razorpay Test Mode.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Test Selection List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Selected Mock Test Series</h2>

            {selectedItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                <p>No tests selected yet.</p>
                <Link
                  href="/tests"
                  className="mt-3 inline-flex items-center gap-1.5 text-blue-600 hover:underline font-semibold text-xs"
                >
                  Browse Mock Test Catalog
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {selectedItems.map((test) => (
                  <div key={test.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm text-slate-800">{test.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {test.examName}
                        </span>
                        <span>{test.durationMinutes} mins</span>
                        <span>•</span>
                        <span>{test.totalQuestions} Questions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedItems.length > 1 && (
                        <button
                          onClick={() => removeItem(test.id)}
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

          {/* Plan Entitlement details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Entitlement Plan</h2>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                All-India Mock Series Pass
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Provides <strong>30 days of full, proctored computer-based test (CBT) access</strong> to your selected mock tests and all-India percentile analytics. If you already have active access, your expiration date will be extended safely by 30 days.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600">Access Duration</span>
              <span className="font-bold text-slate-800">30 Days</span>
            </div>
          </div>
        </div>

        {/* Right: Bill Breakdown */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-slate-900">Price Details</h2>

            <div className="space-y-3 text-sm text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span>All-India Mock Series (30 Days)</span>
                <span className="font-semibold text-slate-900">₹{planPriceInr}.00</span>
              </div>
              <div className="flex justify-between">
                <span>Inclusive of Taxes (GST)</span>
                <span className="font-semibold text-slate-900">₹0.00</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
              <span>Total Payable</span>
              <span>₹{planPriceInr}.00</span>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-blue-800">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Secured by Razorpay. Official 128-bit SSL encrypted test-mode transaction.
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleStartRazorpayCheckout}
              disabled={loading || verifying || selectedItems.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Checkout...</span>
                </>
              ) : verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Payment...</span>
                </>
              ) : (
                <>
                  <span>Pay ₹{planPriceInr}.00 with Razorpay</span>
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="py-12 text-center text-sm text-slate-500">
        Loading checkout session...
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
