import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "all";
    const category = searchParams.get("category");

    const where: any = {};

    if (tab === "open") {
      where.status = { in: ["OPEN", "IN_PROGRESS", "WAITING_FOR_USER"] };
    } else if (tab === "resolved") {
      where.status = { in: ["RESOLVED", "CLOSED"] };
    }

    if (category) {
      where.category = category;
    }

    const [tickets, openCount, resolvedCount, allCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supportTicket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_FOR_USER"] } },
      }),
      prisma.supportTicket.count({
        where: { status: { in: ["RESOLVED", "CLOSED"] } },
      }),
      prisma.supportTicket.count(),
    ]);

    const formatted = tickets.map((t) => ({
      id: t.id,
      userId: t.userId,
      userName: t.user?.name ?? "Student",
      userEmail: t.user?.email ?? "",
      category: t.category,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      messageCount: t._count.messages,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      tickets: formatted,
      counts: {
        all: allCount,
        open: openCount,
        resolved: resolvedCount,
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
    const { ticketId, status, priority } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: `ADMIN_UPDATE_TICKET_${status || "PRIORITY"}`,
        entityType: "SupportTicket",
        entityId: ticket.id,
        metadata: updateData,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    return handleAuthError(error);
  }
}
