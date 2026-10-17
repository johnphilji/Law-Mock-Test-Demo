import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const tab = searchParams.get("tab") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (tab === "captured") where.status = "CAPTURED";
    else if (tab === "failed") where.status = "FAILED";
    else if (tab === "refunded") where.status = "REFUNDED";

    if (search) {
      where.OR = [
        { razorpayOrderId: { contains: search, mode: "insensitive" } },
        { razorpayPaymentId: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, payments, counts, sums] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          subscription: {
            select: { id: true, status: true, expiresAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { status: "CAPTURED" } }),
        prisma.payment.count({ where: { status: "FAILED" } }),
        prisma.payment.count({ where: { status: "REFUNDED" } }),
      ]),
      prisma.payment.aggregate({
        where: { status: "CAPTURED" },
        _sum: { amountPaise: true },
      }),
    ]);

    const formatted = payments.map((p) => ({
      id: p.id,
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      userId: p.userId,
      userName: p.user?.name ?? "Student",
      userEmail: p.user?.email ?? "",
      amountPaise: p.amountPaise,
      currency: p.currency,
      status: p.status,
      failureReason: p.failureReason,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      subscriptionId: p.subscription?.id ?? null,
      subscriptionStatus: p.subscription?.status ?? null,
    }));

    return NextResponse.json({
      payments: formatted,
      totalCapturedRevenuePaise: sums._sum.amountPaise ?? 0,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        all: counts[0],
        captured: counts[1],
        failed: counts[2],
        refunded: counts[3],
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
