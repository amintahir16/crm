const { Client } = require('pg');

async function addDiscountColumns() {
    const client = new Client(process.env.DATABASE_URL || 'postgresql://postgres:wOhEWxYytmqxgQpJQQJnZbtBTIEffuwY@turntable.proxy.rlwy.net:33101/railway');

    try {
        await client.connect();
        console.log('Connected to database');

        // Add discountPercentage column
        await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS "discountPercentage" decimal(5,2) DEFAULT 0
    `);
        console.log('✅ discountPercentage column added');

        // Add discountAmount column
        await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS "discountAmount" decimal(12,2) DEFAULT 0
    `);
        console.log('✅ discountAmount column added');

        // Add originalAmount column
        await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS "originalAmount" decimal(12,2)
    `);
        console.log('✅ originalAmount column added');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
        console.log('Done');
    }
}

addDiscountColumns();
