import { NextResponse } from "next/server";
import crypto from "crypto";
import { hash } from "@node-rs/argon2";
import prisma from "@/lib/db/client";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: "Password reset token is required. Please use the reset link sent to your email." },
        { status: 400 }
      );
    }

    // SHA-256 hash the incoming token to match against database
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link. Please request a new link." },
        { status: 400 }
      );
    }

    // Hash new password using Argon2id
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (err: any) {
    console.error("Password reset error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting your password." },
      { status: 500 }
    );
  }
}
