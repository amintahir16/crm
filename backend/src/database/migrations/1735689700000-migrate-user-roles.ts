import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateUserRoles1735689700000 implements MigrationInterface {
    name = 'MigrateUserRoles1735689700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Detect database type
        const dbType = queryRunner.connection.options.type;
        const isPostgres = dbType === 'postgres';
        const timestampType = isPostgres ? 'timestamp' : 'datetime';
        const timestampDefault = isPostgres ? 'CURRENT_TIMESTAMP' : "(datetime('now'))";
        const timestampFunc = isPostgres ? 'CURRENT_TIMESTAMP' : "datetime('now')";

        // Step 1: Check if sales_activities table exists before creating
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

        // Step 2: Add indexes for sales_activities
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_sales_activities_userId" ON "sales_activities" ("userId")
        `);

        // Step 3: Update existing user roles to new values BEFORE changing schema (only if users table exists)
        const usersTable = await queryRunner.getTable('users');
        if (usersTable) {
            console.log('Updating existing user roles...');
            
            // Update super_admin to admin
            const superAdminCount = await queryRunner.query(`
                SELECT COUNT(*) as count FROM "users" WHERE "role" = 'super_admin'
            `);
            if (superAdminCount[0]?.count > 0) {
                await queryRunner.query(`
                    UPDATE "users" SET "role" = 'admin' WHERE "role" = 'super_admin'
                `);
                console.log(`Updated ${superAdminCount[0].count} super_admin users to admin`);
            }

            // Update sales_agent to sales_person
            const salesAgentCount = await queryRunner.query(`
                SELECT COUNT(*) as count FROM "users" WHERE "role" = 'sales_agent'
            `);
            if (salesAgentCount[0]?.count > 0) {
                await queryRunner.query(`
                    UPDATE "users" SET "role" = 'sales_person' WHERE "role" = 'sales_agent'
                `);
                console.log(`Updated ${salesAgentCount[0].count} sales_agent users to sales_person`);
            }

            // Step 4: Verify all roles are valid before schema change
            const invalidRoles = await queryRunner.query(`
                SELECT DISTINCT "role" FROM "users" 
                WHERE "role" NOT IN ('admin', 'sales_manager', 'sales_person', 'accountant')
            `);
            
            if (invalidRoles.length > 0) {
                console.log('Found invalid roles:', invalidRoles.map(r => r.role));
                // Update any other invalid roles to sales_person (default)
                await queryRunner.query(`
                    UPDATE "users" SET "role" = 'sales_person' 
                    WHERE "role" NOT IN ('admin', 'sales_manager', 'sales_person', 'accountant')
                `);
            }
        }

        // Step 5: Now it's safe to update the schema with the new CHECK constraint (only if users table exists)
        const usersTableForSchema = await queryRunner.getTable('users');
        if (usersTableForSchema) {
            // Check if users_new table already exists (from previous failed migration)
            const usersNewTable = await queryRunner.getTable('users_new');
            if (usersNewTable) {
                // Drop it first
                await queryRunner.query(`DROP TABLE "users_new"`);
            }
            
            // Check if the constraint already exists on the users table
            // If it does, we don't need to recreate the table - just verify the schema
            let existingConstraint: any[] = [];
            try {
                if (isPostgres) {
                    existingConstraint = await queryRunner.query(`
                        SELECT constraint_name 
                        FROM information_schema.table_constraints 
                        WHERE table_name = 'users' 
                        AND constraint_name = 'UQ_97672ac88f789774dd47f7c8be3'
                    `);
                } else {
                    // SQLite - check if unique index exists
                    const indexes = await queryRunner.query(`PRAGMA index_list('users')`);
                    existingConstraint = indexes.filter((idx: any) => idx.name === 'UQ_97672ac88f789774dd47f7c8be3');
                }
            } catch (error) {
                // If query fails, assume constraint doesn't exist
                existingConstraint = [];
            }
            
            // Only recreate table if constraint doesn't exist or if we need to update the schema
            const needsRecreation = existingConstraint.length === 0;
            
            if (needsRecreation) {
                // Create temporary table with new schema
                const isActiveDefault = isPostgres ? 'true' : '(1)';
                const constraintName = isPostgres ? 'UQ_97672ac88f789774dd47f7c8be3' : 'UQ_97672ac88f789774dd47f7c8be3';
                await queryRunner.query(`
                    CREATE TABLE "users_new" (
                        "id" varchar PRIMARY KEY NOT NULL,
                        "email" varchar NOT NULL,
                        "passwordHash" varchar NOT NULL,
                        "fullName" varchar NOT NULL,
                        "role" varchar CHECK( "role" IN ('admin','sales_manager','sales_person','accountant') ) NOT NULL DEFAULT ('sales_person'),
                        "isActive" boolean NOT NULL DEFAULT ${isActiveDefault},
                        "createdAt" ${timestampType} NOT NULL DEFAULT ${timestampDefault},
                        "updatedAt" ${timestampType} NOT NULL DEFAULT ${timestampDefault},
                        CONSTRAINT "${constraintName}" UNIQUE ("email")
                    )
                `);

                // Copy data to new table (all roles should now be valid)
                await queryRunner.query(`
                    INSERT INTO "users_new" ("id", "email", "passwordHash", "fullName", "role", "isActive", "createdAt", "updatedAt")
                    SELECT "id", "email", "passwordHash", "fullName", "role", "isActive", "createdAt", "updatedAt"
                    FROM "users"
                `);

                // Drop old table and rename new one
                await queryRunner.query(`DROP TABLE "users"`);
                await queryRunner.query(`ALTER TABLE "users_new" RENAME TO "users"`);
            } else {
                // Constraint already exists, just verify the schema is correct
                // Check if the role CHECK constraint exists
                let roleConstraint: any[] = [];
                try {
                    if (isPostgres) {
                        roleConstraint = await queryRunner.query(`
                            SELECT constraint_name 
                            FROM information_schema.table_constraints 
                            WHERE table_name = 'users' 
                            AND constraint_type = 'CHECK'
                            AND constraint_name LIKE '%role%'
                        `);
                    } else {
                        // SQLite - check table schema for CHECK constraint
                        const tableInfo = await queryRunner.query(`PRAGMA table_info('users')`);
                        // SQLite stores CHECK constraints in table creation, not separately
                        // We'll try to add it and catch if it exists
                        roleConstraint = [];
                    }
                } catch (error) {
                    roleConstraint = [];
                }
                
                // If no CHECK constraint exists, add it
                if (roleConstraint.length === 0) {
                    try {
                        await queryRunner.query(`
                            ALTER TABLE "users" 
                            ADD CONSTRAINT "CHK_users_role" 
                            CHECK ("role" IN ('admin','sales_manager','sales_person','accountant'))
                        `);
                    } catch (error) {
                        // Constraint might already exist with different name, ignore
                    }
                }
            }

            // Step 6: Add index for role
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role")
            `);

            // Step 7: Create default admin if none exists
            const adminExists = await queryRunner.query(`
                SELECT COUNT(*) as count FROM "users" WHERE "role" = 'admin'
            `);

            if (adminExists[0]?.count === 0) {
                console.log('Creating default admin user...');
                // Create a proper UUID-like ID
                const adminId = 'admin-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
                const isActiveValue = isPostgres ? 'true' : '1';
                await queryRunner.query(`
                    INSERT INTO "users" ("id", "email", "passwordHash", "fullName", "role", "isActive", "createdAt", "updatedAt")
                    VALUES (
                        '${adminId}',
                        'admin@queenhills.com',
                        '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ',
                        'System Administrator',
                        'admin',
                        ${isActiveValue},
                        ${timestampFunc},
                        ${timestampFunc}
                    )
                `);
                console.log('Default admin user created');
            }
        }

        console.log('✅ User roles migration completed successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert role changes
        await queryRunner.query(`
            UPDATE "users" SET "role" = 'super_admin' WHERE "role" = 'admin'
        `);

        await queryRunner.query(`
            UPDATE "users" SET "role" = 'sales_agent' WHERE "role" = 'sales_person'
        `);

        // Drop sales_activities table
        await queryRunner.query(`DROP TABLE IF EXISTS "sales_activities"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role"`);

        console.log('✅ User roles migration reverted');
    }
}
