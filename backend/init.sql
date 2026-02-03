-- Initial database setup for Queen Hills Murree
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
CREATE DATABASE queenhills;

-- Connect to the database
\c queenhills;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'buyer',
    is_active BOOLEAN DEFAULT true,
    assigned_to_user_id UUID,
    department VARCHAR(100),
    employee_id VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    workload_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create plots table
CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_number VARCHAR(20) UNIQUE NOT NULL,
    size_marla DECIMAL(5,2) NOT NULL,
    size_sqm DECIMAL(8,2) NOT NULL,
    phase VARCHAR(10) NOT NULL,
    block VARCHAR(10) NOT NULL,
    price_pkr DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    coordinates POINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnic VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    plot_id UUID REFERENCES plots(id),
    created_by UUID REFERENCES users(id),
    down_payment DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create installments table
CREATE TABLE IF NOT EXISTS installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    late_fee DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_plots_status ON plots(status);
CREATE INDEX IF NOT EXISTS idx_plots_phase_block ON plots(phase, block);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_plot ON bookings(plot_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_customers_cnic ON customers(cnic);

-- Create admin user
INSERT INTO users (email, password_hash, full_name, role, is_active) 
VALUES (
    'admin@queenhills.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4/LewdBPj4', -- admin123
    'System Administrator',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Create sample plots
INSERT INTO plots (plot_number, size_marla, size_sqm, phase, block, price_pkr, status) VALUES
('A-01', 5.0, 125.0, 'Phase 1', 'A', 2500000, 'available'),
('A-02', 5.0, 125.0, 'Phase 1', 'A', 2500000, 'available'),
('A-03', 5.0, 125.0, 'Phase 1', 'A', 2500000, 'sold'),
('B-01', 10.0, 250.0, 'Phase 1', 'B', 5000000, 'available'),
('B-02', 10.0, 250.0, 'Phase 1', 'B', 5000000, 'reserved'),
('C-01', 20.0, 500.0, 'Phase 2', 'C', 10000000, 'available')
ON CONFLICT (plot_number) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
