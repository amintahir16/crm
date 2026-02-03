import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentIntegration1703000000000 implements MigrationInterface {
  name = 'AddPaymentIntegration1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Detect database type
    const dbType = queryRunner.connection.options.type;
    const isPostgres = dbType === 'postgres';
    const timestampType = isPostgres ? 'timestamp' : 'datetime';
    const timestampDefault = isPostgres ? 'CURRENT_TIMESTAMP' : "(datetime('now'))";

    // Check if payment_plans table exists before creating
    const paymentPlansTable = await queryRunner.getTable('payment_plans');
    if (!paymentPlansTable) {
      // Create payment_plans table
      await queryRunner.query(`
        CREATE TABLE "payment_plans" (
          "id" varchar PRIMARY KEY NOT NULL,
          "name" varchar NOT NULL,
          "description" varchar NOT NULL,
          "plotSizeMarla" decimal(5,2) NOT NULL,
          "plotPrice" decimal(12,2) NOT NULL,
          "downPaymentAmount" decimal(12,2),
          "downPaymentPercentage" decimal(5,2),
          "monthlyPayment" decimal(12,2) NOT NULL,
          "quarterlyPayment" decimal(12,2),
          "biYearlyPayment" decimal(12,2),
          "triannualPayment" decimal(12,2),
          "tenureMonths" integer NOT NULL DEFAULT 24,
          "status" varchar NOT NULL DEFAULT 'active',
          "notes" text,
          "createdAt" ${timestampType} NOT NULL DEFAULT ${timestampDefault},
          "updatedAt" ${timestampType} NOT NULL DEFAULT ${timestampDefault}
        )
      `);
    }

    // Check if payment_proofs table exists before creating
    const paymentProofsTable = await queryRunner.getTable('payment_proofs');
    if (!paymentProofsTable) {
      // Create payment_proofs table
      await queryRunner.query(`
        CREATE TABLE "payment_proofs" (
          "id" varchar PRIMARY KEY NOT NULL,
          "paymentId" varchar NOT NULL,
          "fileName" varchar NOT NULL,
          "filePath" varchar NOT NULL,
          "fileSize" integer NOT NULL,
          "mimeType" varchar NOT NULL,
          "proofType" varchar NOT NULL DEFAULT 'screenshot',
          "description" text,
          "uploadedBy" varchar,
          "createdAt" ${timestampType} NOT NULL DEFAULT ${timestampDefault},
          "updatedAt" ${timestampType} NOT NULL DEFAULT ${timestampDefault}
        )
      `);
    }

    // Add new columns to bookings table (only if table exists)
    const bookingsTable = await queryRunner.getTable('bookings');
    if (bookingsTable) {
      const hasPaidAmount = bookingsTable.findColumnByName('paidAmount');
      const hasPendingAmount = bookingsTable.findColumnByName('pendingAmount');

      if (!hasPaidAmount) {
        await queryRunner.query(`
          ALTER TABLE "bookings" 
          ADD COLUMN "paidAmount" decimal(12,2) DEFAULT 0
        `);
      }
      
      if (!hasPendingAmount) {
        await queryRunner.query(`
          ALTER TABLE "bookings" 
          ADD COLUMN "pendingAmount" decimal(12,2) DEFAULT 0
        `);
      }

      // Update existing bookings to set pendingAmount = totalAmount - paidAmount
      await queryRunner.query(`
        UPDATE "bookings" 
        SET "pendingAmount" = "totalAmount" - COALESCE("paidAmount", 0)
      `);
    }

    // Add paymentPlanId column to payment_schedules table (only if table exists)
    const paymentSchedulesTable = await queryRunner.getTable('payment_schedules');
    if (paymentSchedulesTable) {
      const hasPaymentPlanId = paymentSchedulesTable.findColumnByName('paymentPlanId');
      if (!hasPaymentPlanId) {
        await queryRunner.query(`
          ALTER TABLE "payment_schedules" 
          ADD COLUMN "paymentPlanId" varchar
        `);
      }
    }

    // Note: SQLite foreign key constraints are handled by TypeORM automatically
    // We'll let TypeORM manage the relationships rather than adding explicit constraints
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const isPostgres = dbType === 'postgres';
    
    // SQLite doesn't support DROP COLUMN, so skip column drops for SQLite
    if (isPostgres) {
      // Remove columns from existing tables
      const paymentSchedulesTable = await queryRunner.getTable('payment_schedules');
      if (paymentSchedulesTable && paymentSchedulesTable.findColumnByName('paymentPlanId')) {
        await queryRunner.query(`ALTER TABLE "payment_schedules" DROP COLUMN "paymentPlanId"`);
      }

      const bookingsTable = await queryRunner.getTable('bookings');
      if (bookingsTable) {
        if (bookingsTable.findColumnByName('paidAmount')) {
          await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "paidAmount"`);
        }
        if (bookingsTable.findColumnByName('pendingAmount')) {
          await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "pendingAmount"`);
        }
      }
    }

    // Drop new tables (works for both SQLite and PostgreSQL)
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_proofs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_plans"`);
  }
}
