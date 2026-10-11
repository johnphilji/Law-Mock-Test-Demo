import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  const env = process.env.APP_ENVIRONMENT ?? "development";
  const isProduction = env === "production" || process.env.NODE_ENV === "production";

  if (isProduction) {
    console.log("⚠️ Production environment detected. Skipping predictable admin seeding.");
    console.log("👉 Please run `npm run db:bootstrap-admin <email>` to securely create the initial admin account.");
  } else {
    // Development Admin Seeding
    const adminEmail = process.env.ADMIN_SEED_EMAIL ?? "admin@pantherlawprep.com";
    const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "Admin@123";

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      console.log(`Creating development admin user: ${adminEmail}`);
      const passwordHash = await hash(adminPassword, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      await prisma.user.create({
        data: {
          name: "Dev Admin",
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
          isEmailVerified: true,
        },
      });
      console.log("✅ Development admin created successfully.");
    } else {
      console.log("✅ Development admin already exists.");
    }
  }

  console.log("🌱 Database seeding completed.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
