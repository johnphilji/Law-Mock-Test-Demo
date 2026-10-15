import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { testIds } = body;

    // Check if active subscription already exists
    let subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.id,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    if (!subscription) {
      // Create a completed payment record and 1-year active subscription
      const payment = await prisma.payment.create({
        data: {
          userId: session.id,
          razorpayOrderId: `order_${Math.random().toString(36).substring(2, 12)}`,
          razorpayPaymentId: `pay_${Math.random().toString(36).substring(2, 12)}`,
          amountPaise: 4900,
          currency: "INR",
          status: "CAPTURED",
        },
      });

      subscription = await prisma.subscription.create({
        data: {
          userId: session.id,
          paymentId: payment.id,
          status: "ACTIVE",
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Enrolled successfully",
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Student enrollment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
