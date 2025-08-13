-- Create user_type_change_request table for enhanced user type change request management
-- This table stores detailed information about user type change requests with audit trail

CREATE TABLE IF NOT EXISTS user_type_change_request (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_user_type VARCHAR(50) NOT NULL,
    requested_user_type VARCHAR(50) NOT NULL,
    request_reason TEXT,
    request_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    processed_by VARCHAR(100),
    processed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_user_id (user_id),
    INDEX idx_status (request_status),
    INDEX idx_requested_type (requested_user_type),
    INDEX idx_created_at (created_at),
    INDEX idx_processed_at (processed_at),
    INDEX idx_user_status (user_id, request_status)
);

-- Add comments to explain the table structure
ALTER TABLE user_type_change_request 
COMMENT = 'Enhanced user type change request management with audit trail';

-- Insert sample data for testing (optional)
-- INSERT INTO user_type_change_request (user_id, current_user_type, requested_user_type, request_reason, request_status) 
-- VALUES 
-- (1, 'User', 'Coach', 'I have extensive coaching experience and would like to offer coaching services', 'PENDING'),
-- (2, 'User', 'EventOrganizer', 'I want to organize pickleball tournaments and events', 'PENDING'),
-- (3, 'User', 'Coach', 'I am a certified pickleball instructor', 'APPROVED'),
-- (4, 'User', 'EventOrganizer', 'I have experience organizing sports events', 'REJECTED');

-- Create a view for easy access to pending requests
CREATE OR REPLACE VIEW pending_user_type_requests AS
SELECT 
    r.id,
    r.user_id,
    u.name as user_name,
    u.email as user_email,
    u.phone as user_phone,
    u.created_at as user_created_at,
    r.current_user_type,
    r.requested_user_type,
    r.request_reason,
    r.request_status,
    r.admin_notes,
    r.processed_by,
    r.processed_at,
    r.created_at,
    r.updated_at
FROM user_type_change_request r
JOIN user u ON r.user_id = u.id
WHERE r.request_status = 'PENDING'
ORDER BY r.created_at DESC;

-- Create a view for request statistics
CREATE OR REPLACE VIEW user_type_request_statistics AS
SELECT 
    COUNT(*) as total_requests,
    SUM(CASE WHEN request_status = 'PENDING' THEN 1 ELSE 0 END) as pending_requests,
    SUM(CASE WHEN request_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_requests,
    SUM(CASE WHEN request_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_requests,
    SUM(CASE WHEN request_status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_requests,
    SUM(CASE WHEN requested_user_type = 'Coach' AND request_status = 'PENDING' THEN 1 ELSE 0 END) as coach_requests,
    SUM(CASE WHEN requested_user_type = 'EventOrganizer' AND request_status = 'PENDING' THEN 1 ELSE 0 END) as event_organizer_requests,
    AVG(CASE 
        WHEN request_status IN ('APPROVED', 'REJECTED') AND processed_at IS NOT NULL 
        THEN TIMESTAMPDIFF(HOUR, created_at, processed_at)
        ELSE NULL 
    END) as average_processing_time_hours
FROM user_type_change_request;
