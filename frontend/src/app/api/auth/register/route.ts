import { NextResponse } from "next/server";
import { hash } from "@node-rs/argon2";
import prisma from "@/lib/db/client";
import { RegisterSchema } from "@/lib/validation/auth";
import { signSessionToken, setSessionCookie } from "@/lib/session";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Server-side schema validation
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0]?.toString() || "form";
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      return NextResponse.json(
        { error: "Validation failed", fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check for duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // 3. Hash password using Argon2id with OWASP-recommended parameters
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // 4. Create user in database (Explicitly enforce role: STUDENT)
    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: phone || null,
        passwordHash,
        role: "STUDENT",
        isEmailVerified: false,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // 5. Establish authenticated session
    const token = await signSessionToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });
    await setSessionCookie(token);

    logger.info({ userId: newUser.id, email: newUser.email }, "User registered successfully");

    return NextResponse.json(
      {
        success: true,
        user: newUser,
        message: "Registration successful",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    logger.error({ error: message }, "Registration error");
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
  }
}
