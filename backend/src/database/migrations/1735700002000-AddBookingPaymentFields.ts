import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddBookingPaymentFields1735700002000 implements MigrationInterface {
    name = 'AddBookingPaymentFields1735700002000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if columns exist before adding
        const bookingsTable = await queryRunner.getTable('bookings');
        
        if (bookingsTable) {
            const hasPaidAmount = bookingsTable.findColumnByName('paidAmount');
            const hasPendingAmount = bookingsTable.findColumnByName('pendingAmount');

            if (!hasPaidAmount) {
                await queryRunner.addColumn(
                    'bookings',
                    new TableColumn({
                        name: 'paidAmount',
                        type: 'numeric',
                        precision: 12,
                        scale: 2,
                        default: 0,
                    }),
                );
            }

            if (!hasPendingAmount) {
                await queryRunner.addColumn(
                    'bookings',
                    new TableColumn({
                        name: 'pendingAmount',
                        type: 'numeric',
                        precision: 12,
                        scale: 2,
                        default: 0,
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const bookingsTable = await queryRunner.getTable('bookings');
        
        if (bookingsTable) {
            const hasPaidAmount = bookingsTable.findColumnByName('paidAmount');
            const hasPendingAmount = bookingsTable.findColumnByName('pendingAmount');

            if (hasPaidAmount) {
                await queryRunner.dropColumn('bookings', 'paidAmount');
            }

            if (hasPendingAmount) {
                await queryRunner.dropColumn('bookings', 'pendingAmount');
            }
        }
    }
}

