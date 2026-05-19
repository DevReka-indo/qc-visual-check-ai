import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.anomaly.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.user.deleteMany();
  await prisma.division.deleteMany();

  // Create divisions
  const divisions = await prisma.division.createMany({
    data: [
      {
        name: "Final Mechanic",
        description: "Final stage mechanical inspection",
        colorCode: "#FF6B6B",
      },
      {
        name: "Final Electric",
        description: "Final stage electrical inspection",
        colorCode: "#4ECDC4",
      },
      {
        name: "Incoming",
        description: "Incoming parts inspection",
        colorCode: "#45B7D1",
      },
    ],
  });

  console.log(`✅ Created ${divisions.count} divisions`);

  // Create seed user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: hashedPassword,
      fullName: "Admin User",
      employeeId: "REKA-QC-001",
      role: "admin",
      status: "online",
      divisionId: (await prisma.division.findFirst())?.id,
    },
  });

  console.log(`✅ Created seed user: ${adminUser.email}`);

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
