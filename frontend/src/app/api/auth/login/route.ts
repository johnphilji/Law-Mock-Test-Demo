import { NextResponse } from "next/server";
import { verify } from "@node-rs/argon2";
import prisma from "@/lib/db/client";
import { LoginSchema } from "@/lib/validation/auth";
import { signSessionToken, setSessionCookie } from "@/lib/session";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate inputs
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid email or password format." },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Fetch user from database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      // Delay response slightly to prevent timing attacks
      await new Promise((r) => setTimeout(r, 200));
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // 3. Verify Argon2 password hash
    const isValid = await verify(user.passwordHash, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 4. Update last login timestamp asynchronously
    prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch((e) => logger.warn({ error: e.message }, "Failed to update lastLoginAt"));

    // 5. Create secure session cookie
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    logger.info({ userId: user.id, role: user.role }, "User logged in successfully");

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Login successful",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    logger.error({ error: message }, "Login error");
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
