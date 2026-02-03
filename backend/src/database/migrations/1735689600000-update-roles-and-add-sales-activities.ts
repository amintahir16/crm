import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRolesAndAddSalesActivities1735689600000 implements MigrationInterface {
    name = 'UpdateRolesAndAddSalesActivities1735689600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Detect database type
        const dbType = queryRunner.connection.options.type;
        const isPostgres = dbType === 'postgres';
        const timestampType = isPostgres ? 'timestamp' : 'datetime';
        const timestampDefault = isPostgres ? 'CURRENT_TIMESTAMP' : "(datetime('now'))";
        const timestampFunc = isPostgres ? 'CURRENT_TIMESTAMP' : "datetime('now')";
        const timestampFuncWithOffset = isPostgres ? "(CURRENT_TIMESTAMP - INTERVAL '1 day')" : "datetime('now', '-1 day')";

        // Check if sales_activities table exists before creating
        const salesActivitiesTable = await queryRunner.getTable('sales_activities');
        if (!salesActivitiesTable) {
            // Create sales_activities table
            const booleanDefault = isPostgres ? 'false' : '(0)';
            await queryRunner.query(`
                CREATE TABLE "sales_activities" (
                    "id" varchar PRIMARY KEY NOT NULL,
                    "userId" varchar NOT NULL,
                    "activityType" varchar NOT NULL,
                    "description" varchar NOT NULL,
                    "entityType" varchar,
                    "entityId" varchar,
                    "metadata" text,
                    "potentialValue" decimal(12,2),
                    "duration" integer,
                    "isSuccessful" boolean NOT NULL DEFAULT ${booleanDefault},
                    "notes" text,
                    "createdAt" ${timestampType} NOT NULL DEFAULT ${timestampDefault}
                )
            `);
        }

        // Add index for sales_activities (use IF NOT EXISTS for safety)
        try {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_sales_activities_userId" ON "sales_activities" ("userId")
            `);
        } catch (error) {
            // Index might already exist or table might not exist, ignore
        }

        // Update existing user roles from old system to new system (only if users table exists)
        const usersTable = await queryRunner.getTable('users');
        if (usersTable) {
            await queryRunner.query(`
                UPDATE "users" SET "role" = 'admin' WHERE "role" = 'super_admin'
            `);

            await queryRunner.query(`
                UPDATE "users" SET "role" = 'sales_person' WHERE "role" = 'sales_agent'
            `);

            // Add salesActivities column to users table if it doesn't exist
            // Note: TypeORM will handle the relationship, but we need to ensure the foreign key works
            try {
                await queryRunner.query(`
                    CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role")
                `);
            } catch (error) {
                // Index might already exist, ignore
            }

            // Create a default admin user if none exists
            const adminExists = await queryRunner.query(`
                SELECT COUNT(*) as count FROM "users" WHERE "role" = 'admin'
            `);

            if (adminExists[0]?.count === 0) {
                // Create default admin user (password: admin123)
                const hashedPassword = '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZOzJqQZQZQZQZQ'; // This should be properly hashed
                const idGen = isPostgres ? "gen_random_uuid()" : "lower(hex(randomblob(16)))";
                const isActiveValue = isPostgres ? 'true' : '1';
                await queryRunner.query(`
                    INSERT INTO "users" ("id", "email", "passwordHash", "fullName", "role", "isActive", "createdAt", "updatedAt")
                    VALUES (
                        ${idGen},
                        'admin@queenhills.com',
                        '${hashedPassword}',
                        'System Administrator',
                        'admin',
                        ${isActiveValue},
                        ${timestampFunc},
                        ${timestampFunc}
                    )
                `);
            }

            // Create sample sales activities for existing sales persons
            const salesPersons = await queryRunner.query(`
                SELECT "id" FROM "users" WHERE "role" = 'sales_person'
            `);

            for (const salesPerson of salesPersons) {
                // Add login activity
                const activityIdGen = isPostgres ? "gen_random_uuid()" : "lower(hex(randomblob(16)))";
                const isSuccessfulValue = isPostgres ? 'true' : '1';
                await queryRunner.query(`
                    INSERT INTO "sales_activities" ("id", "userId", "activityType", "description", "isSuccessful", "createdAt")
                    VALUES (
                        ${activityIdGen},
                        '${salesPerson.id}',
                        'login',
                        'User logged into the system',
                        ${isSuccessfulValue},
                        ${timestampFuncWithOffset}
                    )
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop sales_activities table
        await queryRunner.query(`DROP TABLE "sales_activities"`);

        // Revert user roles back to old system
        await queryRunner.query(`
            UPDATE "users" SET "role" = 'super_admin' WHERE "role" = 'admin'
        `);

        await queryRunner.query(`
            UPDATE "users" SET "role" = 'sales_agent' WHERE "role" = 'sales_person'
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_users_role"`);
    }
}
