import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testIds, userId, currency = "INR" } = body;

    if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return NextResponse.json(
        { error: "At least one testId must be provided" },
        { status: 400 }
      );
    }

    // In production, calculate order price from database models
    const orderId = `order_${Math.random().toString(36).substring(2, 12)}`;
    const mockAmountPaise = 29900; // ₹299.00

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        amount: mockAmountPaise,
        currency,
        receipt: `rcpt_${Date.now()}`,
        status: "created",
        keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create checkout order" },
      { status: 500 }
    );
  }
}
