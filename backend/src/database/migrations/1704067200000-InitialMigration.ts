import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1704067200000 implements MigrationInterface {
    name = 'InitialMigration1704067200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // This migration will be handled by TypeORM's synchronize feature
        // The actual schema creation is done through entity decorators
        console.log('Initial migration completed - schema created via synchronize');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all tables if needed
        await queryRunner.query(`DROP TABLE IF EXISTS "activity_logs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "installments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "plots"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    }
} 