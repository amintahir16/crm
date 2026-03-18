const { Client } = require('pg');

async function addColumn() {
    const client = new Client(process.env.DATABASE_URL || 'postgresql://postgres:wOhEWxYytmqxgQpJQQJnZbtBTIEffuwY@turntable.proxy.rlwy.net:33101/railway');

    try {
        await client.connect();
        console.log('Connected to database');

        // Add bookingNumber column if it doesn't exist
        await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS "bookingNumber" varchar UNIQUE
    `);
        console.log('bookingNumber column added successfully');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
        console.log('Done');
    }
}

addColumn();
