-- EWA (Earned Wage Access) Schema
-- Migration: 001_create_ewa_schema.sql

-- Create EWA schema
CREATE SCHEMA IF NOT EXISTS ewa;

-- Organization settings for EWA
CREATE TABLE ewa.org_settings (
    org_id VARCHAR(255) PRIMARY KEY,
    advance_limit DECIMAL(5,2) DEFAULT 50.00, -- Percentage (e.g., 50.00 = 50%)
    pay_frequency VARCHAR(20) DEFAULT 'weekly', -- weekly, biweekly, monthly
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee records
CREATE TABLE ewa.employees (
    id VARCHAR(255) PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    external_id VARCHAR(255) NOT NULL, -- ID from ERP system
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    bank_verified BOOLEAN DEFAULT FALSE,
    bank_account VARCHAR(255),
    bank_routing VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, external_id)
);

-- Attendance tracking
CREATE TABLE ewa.attendance (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(255) NOT NULL REFERENCES ewa.employees(id),
    date DATE NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- Advance requests and tracking
CREATE TABLE ewa.advances (
    id VARCHAR(255) PRIMARY KEY,
    employee_id VARCHAR(255) NOT NULL REFERENCES ewa.employees(id),
    amount DECIMAL(10,2) NOT NULL,
    earned_amount DECIMAL(10,2) NOT NULL, -- Amount earned at time of request
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, disbursed, repaid, failed
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    disbursed_at TIMESTAMP,
    repaid_at TIMESTAMP,
    repayment_due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ERP integration configurations
CREATE TABLE ewa.erp_integrations (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    system_type VARCHAR(50) NOT NULL, -- workday, bamboohr, sap, adp
    api_key_encrypted TEXT,
    config JSONB, -- System-specific configuration
    webhook_secret VARCHAR(255),
    last_sync TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll periods for repayment tracking
CREATE TABLE ewa.payroll_periods (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, processing, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repayment transactions
CREATE TABLE ewa.repayments (
    id VARCHAR(255) PRIMARY KEY,
    advance_id VARCHAR(255) NOT NULL REFERENCES ewa.advances(id),
    payroll_period_id INTEGER REFERENCES ewa.payroll_periods(id),
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(20) DEFAULT 'payroll_deduction', -- payroll_deduction, manual
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_employees_org_id ON ewa.employees(org_id);
CREATE INDEX idx_employees_external_id ON ewa.employees(external_id);
CREATE INDEX idx_attendance_employee_date ON ewa.attendance(employee_id, date);
CREATE INDEX idx_advances_employee_id ON ewa.advances(employee_id);
CREATE INDEX idx_advances_status ON ewa.advances(status);
CREATE INDEX idx_repayments_advance_id ON ewa.repayments(advance_id);

-- Sample data for testing
INSERT INTO ewa.org_settings (org_id, advance_limit, pay_frequency) 
VALUES ('demo-org', 50.00, 'weekly');

INSERT INTO ewa.employees (id, org_id, external_id, name, email, hourly_rate, bank_verified) 
VALUES 
    ('emp-001', 'demo-org', 'EMP001', 'John Doe', 'john@company.com', 25.00, true),
    ('emp-002', 'demo-org', 'EMP002', 'Jane Smith', 'jane@company.com', 30.00, true);

INSERT INTO ewa.attendance (employee_id, date, hours_worked) 
VALUES 
    ('emp-001', CURRENT_DATE - INTERVAL '1 day', 8.0),
    ('emp-001', CURRENT_DATE - INTERVAL '2 days', 8.0),
    ('emp-002', CURRENT_DATE - INTERVAL '1 day', 7.5),
    ('emp-002', CURRENT_DATE - INTERVAL '2 days', 8.0);