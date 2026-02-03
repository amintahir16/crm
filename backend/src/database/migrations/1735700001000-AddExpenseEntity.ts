import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddExpenseEntity1735700001000 implements MigrationInterface {
    name = 'AddExpenseEntity1735700001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const dbType = queryRunner.connection.options.type;
        const isPostgres = dbType === 'postgres';
        const idType = isPostgres ? 'uuid' : 'varchar';
        const idDefault = isPostgres ? 'gen_random_uuid()' : "lower(hex(randomblob(16)))";
        const timestampType = isPostgres ? 'timestamp' : 'datetime';
        const timestampDefault = isPostgres ? 'now()' : "datetime('now')";
        
        // Enable UUID extension for PostgreSQL if needed
        if (isPostgres) {
            try {
                await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
            } catch (error) {
                // Extension might already exist or not have permission, continue
            }
        }
        
        // Check if table exists first
        const tableExists = await queryRunner.getTable('expenses');
        if (!tableExists) {
            await queryRunner.createTable(
                new Table({
                    name: 'expenses',
                    columns: [
                    {
                        name: 'id',
                        type: idType,
                        isPrimary: true,
                        default: idDefault,
                    },
                    {
                        name: 'expenseName',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'category',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'amount',
                        type: 'numeric',
                        precision: 12,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'paidAmount',
                        type: 'numeric',
                        precision: 12,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        default: "'pending'",
                    },
                    {
                        name: 'expenseDate',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'dueDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'paidDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'vendorName',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'vendorContact',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'invoiceNumber',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'receiptNumber',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'paymentMethod',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'referenceNumber',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'accountId',
                        type: idType,
                        isNullable: true,
                    },
                    {
                        name: 'submittedBy',
                        type: idType,
                        isNullable: true,
                    },
                    {
                        name: 'approvedBy',
                        type: idType,
                        isNullable: true,
                    },
                    {
                        name: 'approvedAt',
                        type: timestampType,
                        isNullable: true,
                    },
                    {
                        name: 'rejectionReason',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: timestampType,
                        default: timestampDefault,
                    },
                    {
                        name: 'updatedAt',
                        type: timestampType,
                        default: timestampDefault,
                    },
                    ],
                }),
                true,
            );
        }

        // Add foreign keys (check if they exist first for PostgreSQL)
        const table = await queryRunner.getTable('expenses');
        if (table) {
            // Check and add submittedBy foreign key
            const hasSubmittedByFk = table.foreignKeys.find(fk => 
                fk.columnNames.length === 1 && fk.columnNames[0] === 'submittedBy'
            );
            if (!hasSubmittedByFk) {
                await queryRunner.createForeignKey(
                    'expenses',
                    new TableForeignKey({
                        columnNames: ['submittedBy'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'users',
                        onDelete: 'SET NULL',
                    }),
                );
            }

            // Check and add approvedBy foreign key
            const hasApprovedByFk = table.foreignKeys.find(fk => 
                fk.columnNames.length === 1 && fk.columnNames[0] === 'approvedBy'
            );
            if (!hasApprovedByFk) {
                await queryRunner.createForeignKey(
                    'expenses',
                    new TableForeignKey({
                        columnNames: ['approvedBy'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'users',
                        onDelete: 'SET NULL',
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('expenses');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const fk of foreignKeys) {
                await queryRunner.dropForeignKey('expenses', fk);
            }
        }
        await queryRunner.dropTable('expenses');
    }
}

