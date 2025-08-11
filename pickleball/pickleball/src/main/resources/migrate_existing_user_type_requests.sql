-- Migrate existing user type change requests from user table to user_type_change_request table
-- This script will create user_type_change_request records for users who have requestedUserType set

INSERT INTO user_type_change_request (
    user_id,
    current_user_type,
    requested_user_type,
    request_reason,
    request_status,
    admin_notes,
    processed_by,
    processed_at,
    created_at,
    updated_at
)
SELECT 
    u.id as user_id,
    u.userType as current_user_type,
    u.requested_user_type as requested_user_type,
    'Migrated from existing user type change request' as request_reason,
    'PENDING' as request_status,
    NULL as admin_notes,
    NULL as processed_by,
    NULL as processed_at,
    NOW() as created_at,
    NOW() as updated_at
FROM user u
WHERE u.requested_user_type IS NOT NULL 
  AND u.requested_user_type != ''
  AND u.requested_user_type != u.userType
  AND NOT EXISTS (
    SELECT 1 FROM user_type_change_request utcr 
    WHERE utcr.user_id = u.id 
    AND utcr.request_status = 'PENDING'
  );

-- Update the count of migrated records
SELECT 
    COUNT(*) as migrated_records,
    'Successfully migrated existing user type change requests' as message
FROM user_type_change_request 
WHERE request_reason = 'Migrated from existing user type change request';
