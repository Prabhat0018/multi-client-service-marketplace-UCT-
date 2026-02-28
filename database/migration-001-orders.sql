-- ============================================
-- 🔄 MIGRATION: Update Orders Table
-- ============================================
-- Run this in MySQL Workbench to add new columns
-- ============================================

USE service_marketplace;

-- Add service_id column to link order to specific service
ALTER TABLE orders 
ADD COLUMN service_id VARCHAR(36) AFTER merchant_id,
ADD CONSTRAINT fk_order_service 
    FOREIGN KEY (service_id) 
    REFERENCES services(service_id) 
    ON DELETE SET NULL;

-- Add notes column for customer instructions
ALTER TABLE orders 
ADD COLUMN notes TEXT AFTER order_status;

-- Add scheduled_date for appointment booking
ALTER TABLE orders 
ADD COLUMN scheduled_date DATETIME AFTER notes;

-- Verify the changes
DESCRIBE orders;
