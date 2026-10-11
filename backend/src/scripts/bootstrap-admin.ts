import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email || !email.includes("@")) {
    console.error("Usage: npm run db:bootstrap-admin <admin-email>");
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.error(`User with email ${email} already exists.`);
    process.exit(1);
  }

  console.log(`Bootstrapping admin user for: ${email}`);

  // Create user with a strictly invalid password hash that can NEVER be matched by Argon2.
  // Argon2 hashes start with $argon2, so this string guarantees no password login is possible
  // until the admin uses the reset token to explicitly set a real password.
  const user = await prisma.user.create({
    data: {
      name: "Admin (Bootstrap)",
      email: email,
      passwordHash: "!BOOTSTRAP_NEEDS_SETUP!",
      role: "ADMIN",
      isEmailVerified: true,
    },
  });

  // Generate a secure one-time setup token
  const token = crypto.randomBytes(32).toString("hex");

  // SHA-256 hash it for database storage
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const setupUrl = `${appUrl}/auth/reset-password?token=${token}`;

  console.log("\n============================================================");
  console.log("✅ Admin user securely created!");
  console.log("");
  console.log("To complete setup and set your password, visit this secure link:");
  console.log(`\n    ${setupUrl}\n`);
  console.log("This link will expire in 24 hours and can only be used once.");
  console.log("============================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
