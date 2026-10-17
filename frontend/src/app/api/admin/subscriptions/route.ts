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

    if (tab === "active") where.status = "ACTIVE";
    else if (tab === "expired") where.status = "EXPIRED";
    else if (tab === "refunded") where.status = "REFUNDED";

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [total, subscriptions, counts] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          payment: {
            select: { id: true, amountPaise: true, status: true, razorpayPaymentId: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      Promise.all([
        prisma.subscription.count(),
        prisma.subscription.count({ where: { status: "ACTIVE" } }),
        prisma.subscription.count({ where: { status: "EXPIRED" } }),
        prisma.subscription.count({ where: { status: "REFUNDED" } }),
      ]),
    ]);

    const formatted = subscriptions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user?.name ?? "Student",
      userEmail: s.user?.email ?? "",
      status: s.status,
      startedAt: s.startedAt ? s.startedAt.toISOString() : null,
      expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
      paymentId: s.payment?.razorpayPaymentId ?? s.paymentId ?? null,
      amountPaise: s.payment?.amountPaise ?? 0,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      subscriptions: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        all: counts[0],
        active: counts[1],
        expired: counts[2],
        refunded: counts[3],
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
