-- Update production_plans table to add CANCELLED status
ALTER TABLE production_plans 
MODIFY COLUMN status ENUM('WAITING_PRODUCTION', 'IN_PRODUCTION', 'PRODUCTION_DONE', 'CANCELLED') DEFAULT 'WAITING_PRODUCTION';

-- Display confirmation
SELECT 'Database updated successfully' AS message;
