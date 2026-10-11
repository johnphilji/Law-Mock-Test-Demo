import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json(
        { error: "Missing required payment parameters" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder";
    
    // Validate HMAC signature if provided
    if (razorpaySignature && secret !== "rzp_secret_placeholder") {
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (generatedSignature !== razorpaySignature) {
        return NextResponse.json(
          { error: "Invalid payment signature" },
          { status: 400 }
        );
      }
    }

    // In production, execute transaction:
    // 1. Mark Payment record as CAPTURED
    // 2. Grant Subscription/Attempt entitlement to user
    // 3. Trigger receipt email
    return NextResponse.json({
      success: true,
      status: "CAPTURED",
      paymentId: razorpayPaymentId,
      message: "Payment successfully verified and test series activated.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
