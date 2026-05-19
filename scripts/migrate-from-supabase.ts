/**
 * Migration script to transfer data from Supabase to local PostgreSQL
 * Run with: npx ts-node scripts/migrate-from-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import prisma from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrateData() {
  console.log("Starting migration from Supabase to PostgreSQL...");

  try {
    // 1. Migrate divisions
    console.log("\n📋 Migrating divisions...");
    const { data: divisions, error: divisionsError } = await supabase
      .from("divisions")
      .select("*");

    if (divisionsError) {
      console.error("Error fetching divisions:", divisionsError);
    } else if (divisions) {
      for (const division of divisions) {
        await prisma.division.upsert({
          where: { id: division.id },
          update: {},
          create: {
            id: division.id,
            name: division.name,
            description: division.description,
            colorCode: division.color_code,
            createdAt: new Date(division.created_at),
          },
        });
      }
      console.log(`✅ Migrated ${divisions.length} divisions`);
    }

    // 2. Migrate users
    console.log("\n👥 Migrating users...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*");

    if (usersError) {
      console.error("Error fetching users:", usersError);
    } else if (users) {
      for (const user of users) {
        // Generate a temporary password for users (they should change it)
        const tempPassword = await hashPassword("TempPassword123");

        await prisma.user.upsert({
          where: { id: user.id },
          update: {},
          create: {
            id: user.id,
            email: user.email,
            password: tempPassword,
            fullName: user.full_name,
            employeeId: user.employee_id,
            role: user.role,
            divisionId: user.division_id,
            avatarUrl: user.avatar_url,
            status: user.status,
            createdAt: new Date(user.created_at),
            lastLogin: user.last_login ? new Date(user.last_login) : null,
            updatedAt: new Date(user.updated_at),
          },
        });
      }
      console.log(`✅ Migrated ${users.length} users`);
      console.log("⚠️  Users have been assigned temporary password: TempPassword123");
    }

    // 3. Migrate inspections
    console.log("\n🔍 Migrating inspections...");
    const { data: inspections, error: inspectionsError } = await supabase
      .from("inspections")
      .select("*");

    if (inspectionsError) {
      console.error("Error fetching inspections:", inspectionsError);
    } else if (inspections) {
      for (const inspection of inspections) {
        await prisma.inspection.upsert({
          where: { id: inspection.id },
          update: {},
          create: {
            id: inspection.id,
            partId: inspection.part_id,
            divisionId: inspection.division_id,
            imageUrl: inspection.image_url,
            aiResultStatus: inspection.ai_result_status,
            mainDefect: inspection.main_defect,
            aiConfidenceScore: inspection.ai_confidence_score,
            validationStatus: inspection.validation_status,
            inspectorId: inspection.inspector_id,
            resolutionNote: inspection.resolution_note,
            createdAt: new Date(inspection.created_at),
            updatedAt: new Date(inspection.updated_at),
            inspectionDate: new Date(inspection.inspection_date),
          },
        });
      }
      console.log(`✅ Migrated ${inspections.length} inspections`);
    }

    // 4. Migrate anomalies
    console.log("\n⚠️  Migrating anomalies...");
    const { data: anomalies, error: anomaliesError } = await supabase
      .from("anomalies")
      .select("*");

    if (anomaliesError) {
      console.error("Error fetching anomalies:", anomaliesError);
    } else if (anomalies) {
      for (const anomaly of anomalies) {
        await prisma.anomaly.upsert({
          where: { id: anomaly.id },
          update: {},
          create: {
            id: anomaly.id,
            inspectionId: anomaly.inspection_id,
            defectType: anomaly.defect_type,
            location: anomaly.location,
            description: anomaly.description,
            confidenceScore: anomaly.confidence_score,
            boundingBox: anomaly.bounding_box,
            createdAt: new Date(anomaly.created_at),
          },
        });
      }
      console.log(`✅ Migrated ${anomalies.length} anomalies`);
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n🔐 IMPORTANT: Users need to change their passwords:");
    console.log("   Temporary password: TempPassword123");
    console.log("   Instruct users to change this password on first login");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
