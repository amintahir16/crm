import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserRoles1736000000000 implements MigrationInterface {
    name = 'FixUserRoles1736000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const dbType = queryRunner.connection.options.type;
        const isPostgres = dbType === 'postgres';

        // Valid roles: admin, sales_manager, sales_person, accountant
        const VALID_ROLES = ['admin', 'sales_manager', 'sales_person', 'accountant'];

        const usersTable = await queryRunner.getTable('users');
        if (!usersTable) {
            console.log('Users table does not exist, skipping role fix');
            return;
        }

        if (isPostgres) {
            // Step 1: Drop existing CHECK constraint if it exists
            console.log('Dropping existing role CHECK constraint...');
            try {
                // Find all CHECK constraints on the users table related to role
                const constraints = await queryRunner.query(`
                    SELECT constraint_name 
                    FROM information_schema.table_constraints 
                    WHERE table_name = 'users' 
                    AND table_schema = 'public'
                    AND constraint_type = 'CHECK'
                    AND constraint_name LIKE '%role%'
                `);

                for (const constraint of constraints) {
                    try {
                        await queryRunner.query(`
                            ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"
                        `);
                        console.log(`Dropped constraint: ${constraint.constraint_name}`);
                    } catch (error) {
                        console.log(`Could not drop constraint ${constraint.constraint_name}: ${error.message}`);
                    }
                }

                // Also try dropping the specific constraint name
                await queryRunner.query(`
                    ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "CHK_users_role"
                `);
            } catch (error) {
                console.log('No existing constraint to drop or error dropping:', error.message);
            }

            // Step 2: Update roles to valid values
            console.log('Updating user roles...');

            // Convert manager to sales_manager
            const managerResult = await queryRunner.query(`
                UPDATE "users" SET "role" = 'sales_manager' WHERE "role" = 'manager'
            `);
            console.log(`Converted ${managerResult[1] || managerResult.rowCount || 0} manager → sales_manager`);

            // Convert team_member to sales_person
            const teamMemberResult = await queryRunner.query(`
                UPDATE "users" SET "role" = 'sales_person' WHERE "role" = 'team_member'
            `);
            console.log(`Converted ${teamMemberResult[1] || teamMemberResult.rowCount || 0} team_member → sales_person`);

            // Fix specific users by email
            const accountantResult = await queryRunner.query(`
                UPDATE "users" 
                SET "role" = 'accountant' 
                WHERE email = 'accountant@queenhills.com' AND role != 'accountant'
            `);
            if (accountantResult[1] > 0 || accountantResult.rowCount > 0) {
                console.log(`Fixed accountant@queenhills.com → accountant`);
            }

            // Convert all other invalid roles to sales_person
            // First, convert any roles that are not in the valid list
            const invalidRolesResult = await queryRunner.query(`
                UPDATE "users" 
                SET "role" = 'sales_person' 
                WHERE "role" NOT IN ('admin', 'sales_manager', 'sales_person', 'accountant')
                AND email != 'accountant@queenhills.com'
            `);
            console.log(`Converted ${invalidRolesResult[1] || invalidRolesResult.rowCount || 0} invalid role(s) → sales_person`);

            // Step 3: Recreate CHECK constraint with correct allowed roles
            console.log('Recreating role CHECK constraint...');
            try {
                await queryRunner.query(`
                    ALTER TABLE "users" 
                    ADD CONSTRAINT "CHK_users_role" 
                    CHECK ("role" IN ('admin', 'sales_manager', 'sales_person', 'accountant'))
                `);
                console.log('Created CHECK constraint with valid roles: admin, sales_manager, sales_person, accountant');
            } catch (error) {
                console.log('Could not create constraint (might already exist):', error.message);
            }
        } else {
            // SQLite - just update roles (SQLite doesn't enforce CHECK constraints the same way)
            console.log('Updating user roles (SQLite)...');
            
            await queryRunner.query(`
                UPDATE "users" SET "role" = 'sales_manager' WHERE "role" = 'manager'
            `);
            
            await queryRunner.query(`
                UPDATE "users" SET "role" = 'sales_person' WHERE "role" = 'team_member'
            `);

            const otherRoles = ['accountant', 'investor', 'buyer', 'auditor', 'super_admin', 'sales_agent'];
            for (const oldRole of otherRoles) {
                await queryRunner.query(`
                    UPDATE "users" SET "role" = 'sales_person' WHERE "role" = ?
                `, [oldRole]);
            }
        }

        console.log('✅ User roles migration completed successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert is not straightforward since we don't know original roles
        // Just log that this migration cannot be safely reverted
        console.log('⚠️  Cannot safely revert role changes - original roles unknown');
    }
}

