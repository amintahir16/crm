import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstallmentTypeAndDescription1703100000000 implements MigrationInterface {
    name = 'AddInstallmentTypeAndDescription1703100000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const installmentsTable = await queryRunner.getTable('installments');
    if (installmentsTable) {
      const hasInstallmentType = installmentsTable.findColumnByName('installmentType');
      const hasDescription = installmentsTable.findColumnByName('description');

      if (!hasInstallmentType) {
        await queryRunner.query(`
          ALTER TABLE "installments" 
          ADD COLUMN "installmentType" varchar NULL
        `);
      }

      if (!hasDescription) {
        await queryRunner.query(`
          ALTER TABLE "installments" 
          ADD COLUMN "description" varchar NULL
        `);
      }
    }
  }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const dbType = queryRunner.connection.options.type;
        const isPostgres = dbType === 'postgres';
        
        // SQLite doesn't support DROP COLUMN, so skip for SQLite
        if (!isPostgres) {
            return;
        }
        
        const installmentsTable = await queryRunner.getTable('installments');
        if (installmentsTable) {
            if (installmentsTable.findColumnByName('installmentType')) {
                await queryRunner.query(`ALTER TABLE "installments" DROP COLUMN "installmentType"`);
            }
            if (installmentsTable.findColumnByName('description')) {
                await queryRunner.query(`ALTER TABLE "installments" DROP COLUMN "description"`);
            }
        }
    }
}
