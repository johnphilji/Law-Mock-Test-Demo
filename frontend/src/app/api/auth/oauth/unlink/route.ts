import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import prisma from "@/lib/db/client";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { provider } = body;

    if (!provider || typeof provider !== "string") {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    // Check if user has a password or at least one other account before unlinking
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        passwordHash: true,
        accounts: {
          select: { id: true, provider: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safety rule: Don't let users lock themselves out if they have no password and this is their only OAuth account
    if (!user.passwordHash && user.accounts.length <= 1) {
      return NextResponse.json(
        {
          error:
            "Cannot disconnect your only login method. Please set a password or link another account first.",
        },
        { status: 400 }
      );
    }

    // Delete the account linkage
    const deleted = await prisma.account.deleteMany({
      where: {
        userId: session.id,
        provider: provider.toLowerCase(),
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Linked account not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Disconnected ${provider} successfully.` });
  } catch (error) {
    console.error("Unlink account error:", error);
    return NextResponse.json({ error: "Failed to unlink account" }, { status: 500 });
  }
}
