import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class EnhanceCRMForProduction1736100000000 implements MigrationInterface {
    name = 'EnhanceCRMForProduction1736100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const dbType = queryRunner.connection.options.type;
        const isPostgres = dbType === 'postgres';
        const timestampType = isPostgres ? 'timestamp' : 'datetime';
        const timestampDefault = isPostgres ? 'CURRENT_TIMESTAMP' : "(datetime('now'))";

        // Step 1: Create lead_statuses table (dynamic status management)
        const leadStatusesTableExists = await queryRunner.getTable('lead_statuses');
        if (!leadStatusesTableExists) {
            await queryRunner.createTable(
                new Table({
                    name: 'lead_statuses',
                    columns: [
                        {
                            name: 'id',
                            type: isPostgres ? 'uuid' : 'varchar',
                            isPrimary: true,
                            default: isPostgres ? 'gen_random_uuid()' : undefined,
                            generationStrategy: isPostgres ? 'uuid' : undefined,
                        },
                        {
                            name: 'name',
                            type: 'varchar',
                            isUnique: true,
                        },
                        {
                            name: 'displayName',
                            type: 'varchar',
                        },
                        {
                            name: 'description',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'color',
                            type: 'varchar',
                            default: "'#6B7280'",
                        },
                        {
                            name: 'order',
                            type: 'integer',
                            default: 0,
                        },
                        {
                            name: 'isActive',
                            type: isPostgres ? 'boolean' : 'integer',
                            default: isPostgres ? 'true' : '1',
                        },
                        {
                            name: 'isDefault',
                            type: isPostgres ? 'boolean' : 'integer',
                            default: isPostgres ? 'false' : '0',
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

        // Deactivate old statuses (if table exists and has old statuses)
        if (leadStatusesTableExists) {
            const oldStatuses = ['contacted', 'qualified', 'follow_up', 'converted', 'lost'];
            const isActiveFalse = isPostgres ? 'false' : '0';
            for (const oldStatus of oldStatuses) {
                await queryRunner.query(`
                    UPDATE "lead_statuses" 
                    SET "isActive" = ${isActiveFalse} 
                    WHERE "name" = '${oldStatus}'
                `);
            }
        }

        // Insert default statuses (only if they don't exist)
        const defaultStatuses = [
            { name: 'new', displayName: 'New', color: '#3B82F6', order: 1, isDefault: true },
            { name: 'not_interested', displayName: 'Not Interested', color: '#EF4444', order: 2, isDefault: false },
            { name: 'interested', displayName: 'Interested', color: '#10B981', order: 3, isDefault: false },
            { name: 'will_visit', displayName: 'Will Visit', color: '#F59E0B', order: 4, isDefault: false },
            { name: 'future', displayName: 'Future', color: '#8B5CF6', order: 5, isDefault: false },
            { name: 'close_won', displayName: 'Close Won', color: '#059669', order: 6, isDefault: false },
            { name: 'in_process', displayName: 'In Process', color: '#06B6D4', order: 7, isDefault: false },
        ];

        for (const status of defaultStatuses) {
            // Check if status already exists
            const existingStatus = await queryRunner.query(`
                SELECT id FROM "lead_statuses" WHERE "name" = '${status.name}'
            `);

            if (existingStatus.length === 0) {
                // Status doesn't exist, insert it
                const idValue = isPostgres ? 'gen_random_uuid()' : `'${Date.now()}-${Math.random()}'`;
                const isActiveValue = isPostgres ? 'true' : '1';
                const isDefaultValue = isPostgres 
                    ? (status.isDefault ? 'true' : 'false')
                    : (status.isDefault ? '1' : '0');
                await queryRunner.query(`
                    INSERT INTO "lead_statuses" (id, name, "displayName", color, "order", "isActive", "isDefault", "createdAt", "updatedAt")
                    VALUES (${idValue}, '${status.name}', '${status.displayName}', '${status.color}', ${status.order}, ${isActiveValue}, ${isDefaultValue}, ${timestampDefault}, ${timestampDefault})
                `);
            } else {
                // Status exists, ensure it's active and has correct values
                const isActiveValue = isPostgres ? 'true' : '1';
                const isDefaultValue = isPostgres 
                    ? (status.isDefault ? 'true' : 'false')
                    : (status.isDefault ? '1' : '0');
                await queryRunner.query(`
                    UPDATE "lead_statuses" 
                    SET "isActive" = ${isActiveValue}, 
                        "displayName" = '${status.displayName}', 
                        "color" = '${status.color}', 
                        "order" = ${status.order},
                        "isDefault" = ${isDefaultValue}
                    WHERE "name" = '${status.name}'
                `);
            }
        }

        // Step 2: Add leadId field to leads table (unique identifier)
        const leadsTable = await queryRunner.getTable('leads');
        if (leadsTable) {
            const hasLeadId = leadsTable.findColumnByName('leadId');
            if (!hasLeadId) {
                await queryRunner.addColumn(
                    'leads',
                    new TableColumn({
                        name: 'leadId',
                        type: 'varchar',
                        isNullable: true,
                        isUnique: true,
                    })
                );
            }
        }

        // Step 3: Add dueDate field to leads table
        if (leadsTable) {
            const hasDueDate = leadsTable.findColumnByName('dueDate');
            if (!hasDueDate) {
                await queryRunner.addColumn(
                    'leads',
                    new TableColumn({
                        name: 'dueDate',
                        type: 'date',
                        isNullable: true,
                    })
                );
            }
        }

        // Step 4: Add statusId field to leads table (reference to lead_statuses)
        if (leadsTable) {
            const hasStatusId = leadsTable.findColumnByName('statusId');
            if (!hasStatusId) {
                await queryRunner.addColumn(
                    'leads',
                    new TableColumn({
                        name: 'statusId',
                        type: isPostgres ? 'uuid' : 'varchar',
                        isNullable: true,
                    })
                );

                // Add foreign key
                try {
                    await queryRunner.createForeignKey(
                        'leads',
                        new TableForeignKey({
                            columnNames: ['statusId'],
                            referencedColumnNames: ['id'],
                            referencedTableName: 'lead_statuses',
                            onDelete: 'SET NULL',
                        })
                    );
                } catch (error) {
                    console.log('Could not create statusId foreign key:', error.message);
                }
            }
        }

        // Step 5: Create lead_activity_log table for comprehensive activity tracking
        const activityLogTableExists = await queryRunner.getTable('lead_activity_log');
        if (!activityLogTableExists) {
            await queryRunner.createTable(
                new Table({
                    name: 'lead_activity_log',
                    columns: [
                        {
                            name: 'id',
                            type: isPostgres ? 'uuid' : 'varchar',
                            isPrimary: true,
                            default: isPostgres ? 'gen_random_uuid()' : undefined,
                            generationStrategy: isPostgres ? 'uuid' : undefined,
                        },
                        {
                            name: 'leadId',
                            type: isPostgres ? 'uuid' : 'varchar',
                        },
                        {
                            name: 'userId',
                            type: isPostgres ? 'uuid' : 'varchar',
                            isNullable: true,
                        },
                        {
                            name: 'activityType',
                            type: 'varchar',
                        },
                        {
                            name: 'description',
                            type: 'text',
                        },
                        {
                            name: 'metadata',
                            type: 'text',
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

            // Add foreign keys
            try {
                await queryRunner.createForeignKey(
                    'lead_activity_log',
                    new TableForeignKey({
                        columnNames: ['leadId'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'leads',
                        onDelete: 'CASCADE',
                    })
                );
            } catch (error) {
                console.log('Could not create leadId foreign key:', error.message);
            }

            try {
                await queryRunner.createForeignKey(
                    'lead_activity_log',
                    new TableForeignKey({
                        columnNames: ['userId'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'users',
                        onDelete: 'SET NULL',
                    })
                );
            } catch (error) {
                console.log('Could not create userId foreign key:', error.message);
            }

            // Add indexes
            await queryRunner.createIndex(
                'lead_activity_log',
                new TableIndex({
                    name: 'IDX_lead_activity_leadId',
                    columnNames: ['leadId'],
                })
            );

            await queryRunner.createIndex(
                'lead_activity_log',
                new TableIndex({
                    name: 'IDX_lead_activity_userId',
                    columnNames: ['userId'],
                })
            );

            await queryRunner.createIndex(
                'lead_activity_log',
                new TableIndex({
                    name: 'IDX_lead_activity_type',
                    columnNames: ['activityType'],
                })
            );
        }

        // Step 6: Create notifications table
        const notificationsTableExists = await queryRunner.getTable('crm_notifications');
        if (!notificationsTableExists) {
            await queryRunner.createTable(
                new Table({
                    name: 'crm_notifications',
                    columns: [
                        {
                            name: 'id',
                            type: isPostgres ? 'uuid' : 'varchar',
                            isPrimary: true,
                            default: isPostgres ? 'gen_random_uuid()' : undefined,
                            generationStrategy: isPostgres ? 'uuid' : undefined,
                        },
                        {
                            name: 'userId',
                            type: isPostgres ? 'uuid' : 'varchar',
                        },
                        {
                            name: 'type',
                            type: 'varchar',
                        },
                        {
                            name: 'title',
                            type: 'varchar',
                        },
                        {
                            name: 'message',
                            type: 'text',
                        },
                        {
                            name: 'entityType',
                            type: 'varchar',
                            isNullable: true,
                        },
                        {
                            name: 'entityId',
                            type: isPostgres ? 'uuid' : 'varchar',
                            isNullable: true,
                        },
                        {
                            name: 'isRead',
                            type: isPostgres ? 'boolean' : 'integer',
                            default: isPostgres ? 'false' : '0',
                        },
                        {
                            name: 'readAt',
                            type: timestampType,
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

            // Add foreign key
            try {
                await queryRunner.createForeignKey(
                    'crm_notifications',
                    new TableForeignKey({
                        columnNames: ['userId'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'users',
                        onDelete: 'CASCADE',
                    })
                );
            } catch (error) {
                console.log('Could not create userId foreign key:', error.message);
            }

            // Add indexes
            await queryRunner.createIndex(
                'crm_notifications',
                new TableIndex({
                    name: 'IDX_crm_notifications_userId',
                    columnNames: ['userId'],
                })
            );

            await queryRunner.createIndex(
                'crm_notifications',
                new TableIndex({
                    name: 'IDX_crm_notifications_isRead',
                    columnNames: ['isRead'],
                })
            );
        }

        // Step 7: Generate leadId for existing leads that don't have one
        if (leadsTable) {
            if (isPostgres) {
                // For PostgreSQL, cast UUID to text first
                await queryRunner.query(`
                    UPDATE leads 
                    SET "leadId" = 'LEAD-' || SUBSTR(REPLACE(id::text, '-', ''), 1, 8)
                    WHERE "leadId" IS NULL
                `);
            } else {
                // For SQLite
                await queryRunner.query(`
                    UPDATE leads 
                    SET "leadId" = 'LEAD-' || SUBSTR(REPLACE(id, '-', ''), 1, 8)
                    WHERE "leadId" IS NULL
                `);
            }
        }

        console.log('✅ CRM enhancement migration completed');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.dropTable('crm_notifications', true);
        await queryRunner.dropTable('lead_activity_log', true);
        
        const leadsTable = await queryRunner.getTable('leads');
        if (leadsTable) {
            const hasStatusId = leadsTable.findColumnByName('statusId');
            if (hasStatusId) {
                await queryRunner.dropColumn('leads', 'statusId');
            }
            const hasDueDate = leadsTable.findColumnByName('dueDate');
            if (hasDueDate) {
                await queryRunner.dropColumn('leads', 'dueDate');
            }
            const hasLeadId = leadsTable.findColumnByName('leadId');
            if (hasLeadId) {
                await queryRunner.dropColumn('leads', 'leadId');
            }
        }
        
        await queryRunner.dropTable('lead_statuses', true);
    }
}

