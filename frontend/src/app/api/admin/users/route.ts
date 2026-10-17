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

    const where: any = { role: "STUDENT" };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tab === "active") where.isActive = true;
    else if (tab === "inactive") where.isActive = false;
    else if (tab === "unverified") where.isEmailVerified = false;

    const [total, users, counts] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              attempts: true,
              subscriptions: true,
              payments: true,
            },
          },
        },
      }),
      Promise.all([
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
        prisma.user.count({ where: { role: "STUDENT", isActive: false } }),
        prisma.user.count({ where: { role: "STUDENT", isEmailVerified: false } }),
      ]),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isEmailVerified: u.isEmailVerified,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      attemptCount: u._count.attempts,
      subscriptionCount: u._count.subscriptions,
      paymentCount: u._count.payments,
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        all: counts[0],
        active: counts[1],
        inactive: counts[2],
        unverified: counts[3],
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { userId, isActive, isEmailVerified } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Do not allow deactivating self
    if (userId === admin.id && isActive === false) {
      return NextResponse.json({ error: "Cannot deactivate your own administrator account" }, { status: 400 });
    }

    const data: any = {};
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (typeof isEmailVerified === "boolean") data.isEmailVerified = isEmailVerified;

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    // Create audit log for security
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: isActive === false ? "ADMIN_DEACTIVATE_USER" : "ADMIN_UPDATE_USER",
        entityType: "User",
        entityId: userId,
        metadata: { changes: data },
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
