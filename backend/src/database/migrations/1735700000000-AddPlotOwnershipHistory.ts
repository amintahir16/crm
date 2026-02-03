import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddPlotOwnershipHistory1735700000000 implements MigrationInterface {
    name = 'AddPlotOwnershipHistory1735700000000'

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
        const tableExists = await queryRunner.getTable('plot_ownership_history');
        if (!tableExists) {
            await queryRunner.createTable(
                new Table({
                    name: 'plot_ownership_history',
                    columns: [
                    {
                        name: 'id',
                        type: idType,
                        isPrimary: true,
                        default: idDefault,
                    },
                    {
                        name: 'plotId',
                        type: idType,
                        isNullable: false,
                    },
                    {
                        name: 'customerId',
                        type: idType,
                        isNullable: true,
                    },
                    {
                        name: 'bookingId',
                        type: idType,
                        isNullable: true,
                    },
                    {
                        name: 'ownershipType',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'salePrice',
                        type: 'numeric',
                        precision: 12,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'registrationDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'transferDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'registrationNumber',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'transferDocumentNumber',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'recordedBy',
                        type: idType,
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: timestampType,
                        default: timestampDefault,
                    },
                    ],
                }),
                true,
            );
        }

        // Add foreign keys (check if they exist first for PostgreSQL)
        const table = await queryRunner.getTable('plot_ownership_history');
        if (table) {
            // Check and add plotId foreign key
            const hasPlotIdFk = table.foreignKeys.find(fk => 
                fk.columnNames.length === 1 && fk.columnNames[0] === 'plotId'
            );
            if (!hasPlotIdFk) {
                await queryRunner.createForeignKey(
                    'plot_ownership_history',
                    new TableForeignKey({
                        columnNames: ['plotId'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'plots',
                        onDelete: 'CASCADE',
                    }),
                );
            }

            // Check and add customerId foreign key
            const hasCustomerIdFk = table.foreignKeys.find(fk => 
                fk.columnNames.length === 1 && fk.columnNames[0] === 'customerId'
            );
            if (!hasCustomerIdFk) {
                await queryRunner.createForeignKey(
                    'plot_ownership_history',
                    new TableForeignKey({
                        columnNames: ['customerId'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'customers',
                        onDelete: 'SET NULL',
                    }),
                );
            }

            // Check and add bookingId foreign key
            const hasBookingIdFk = table.foreignKeys.find(fk => 
                fk.columnNames.length === 1 && fk.columnNames[0] === 'bookingId'
            );
            if (!hasBookingIdFk) {
                await queryRunner.createForeignKey(
                    'plot_ownership_history',
                    new TableForeignKey({
                        columnNames: ['bookingId'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'bookings',
                        onDelete: 'SET NULL',
                    }),
                );
            }

            // Check and add recordedBy foreign key
            const hasRecordedByFk = table.foreignKeys.find(fk => 
                fk.columnNames.length === 1 && fk.columnNames[0] === 'recordedBy'
            );
            if (!hasRecordedByFk) {
                await queryRunner.createForeignKey(
                    'plot_ownership_history',
                    new TableForeignKey({
                        columnNames: ['recordedBy'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'users',
                        onDelete: 'SET NULL',
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('plot_ownership_history');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const fk of foreignKeys) {
                await queryRunner.dropForeignKey('plot_ownership_history', fk);
            }
        }
        await queryRunner.dropTable('plot_ownership_history');
    }
}

