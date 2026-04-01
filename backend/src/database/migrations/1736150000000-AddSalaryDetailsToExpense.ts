import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddSalaryDetailsToExpense1736150000000 implements MigrationInterface {
    name = 'AddSalaryDetailsToExpense1736150000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const dbType = queryRunner.connection.options.type;
        const isPostgres = dbType === 'postgres';
        const idType = isPostgres ? 'uuid' : 'varchar';

        // Add targetUserId column
        await queryRunner.addColumn('expenses', new TableColumn({
            name: 'targetUserId',
            type: idType,
            isNullable: true,
        }));

        // Add baseAmount column
        await queryRunner.addColumn('expenses', new TableColumn({
            name: 'baseAmount',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: true,
        }));

        // Add bonusAmount column
        await queryRunner.addColumn('expenses', new TableColumn({
            name: 'bonusAmount',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: true,
            default: 0,
        }));

        // Add deductionAmount column
        await queryRunner.addColumn('expenses', new TableColumn({
            name: 'deductionAmount',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: true,
            default: 0,
        }));

        // Add Foreign Key for targetUserId
        await queryRunner.createForeignKey('expenses', new TableForeignKey({
            columnNames: ['targetUserId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('expenses');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('targetUserId') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('expenses', foreignKey);
            }
        }
        
        await queryRunner.dropColumn('expenses', 'deductionAmount');
        await queryRunner.dropColumn('expenses', 'bonusAmount');
        await queryRunner.dropColumn('expenses', 'baseAmount');
        await queryRunner.dropColumn('expenses', 'targetUserId');
    }
}
