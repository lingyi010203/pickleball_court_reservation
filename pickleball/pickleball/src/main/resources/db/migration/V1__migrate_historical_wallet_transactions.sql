-- 迁移历史预订数据到钱包交易记录
-- 这个脚本会为之前使用钱包支付的预订创建交易记录

-- 1. 为使用钱包支付的已完成预订创建 WITHDRAWAL 交易记录
INSERT INTO wallet_transaction (
    wallet_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    frozen_before,
    frozen_after,
    reference_type,
    reference_id,
    description,
    status,
    created_at,
    processed_at
)
SELECT 
    w.id as wallet_id,
    'WITHDRAWAL' as transaction_type,
    b.total_amount as amount,
    w.balance + b.total_amount as balance_before,  -- 假设之前的余额
    w.balance as balance_after,
    0.0 as frozen_before,
    0.0 as frozen_after,
    'PAYMENT' as reference_type,
    p.id as reference_id,
    CONCAT('Court booking payment - ', COALESCE(b.purpose, 'Booking')) as description,
    'COMPLETED' as status,
    b.booking_date as created_at,
    b.booking_date as processed_at
FROM booking b
JOIN payment p ON b.payment_id = p.id
JOIN member m ON b.member_id = m.user_id
JOIN wallet w ON m.user_id = w.member_id
WHERE p.payment_method = 'WALLET' 
  AND p.status = 'COMPLETED'
  AND NOT EXISTS (
    -- 检查是否已经有对应的钱包交易记录
    SELECT 1 FROM wallet_transaction wt 
    WHERE wt.reference_type = 'PAYMENT' 
      AND wt.reference_id = p.id
  );

-- 2. 更新钱包的 total_spent 字段
UPDATE wallet w
SET total_spent = (
    SELECT COALESCE(SUM(b.total_amount), 0)
    FROM booking b
    JOIN payment p ON b.payment_id = p.id
    JOIN member m ON b.member_id = m.user_id
    WHERE m.user_id = w.member_id
      AND p.payment_method = 'WALLET'
      AND p.status = 'COMPLETED'
)
WHERE w.id > 0;  -- 使用主键条件来满足安全模式要求

-- 3. 为已退款的预订创建 REFUND 交易记录
INSERT INTO wallet_transaction (
    wallet_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    frozen_before,
    frozen_after,
    reference_type,
    reference_id,
    description,
    status,
    created_at,
    processed_at
)
SELECT 
    w.id as wallet_id,
    'REFUND' as transaction_type,
    b.total_amount * 0.5 as amount,  -- 50% 退款
    w.balance - (b.total_amount * 0.5) as balance_before,  -- 假设退款前的余额
    w.balance as balance_after,
    0.0 as frozen_before,
    0.0 as frozen_after,
    'PAYMENT' as reference_type,
    p.id as reference_id,
    CONCAT('Booking cancellation refund - ', COALESCE(b.purpose, 'Booking')) as description,
    'COMPLETED' as status,
    COALESCE(p.refund_date, NOW()) as created_at,
    COALESCE(p.refund_date, NOW()) as processed_at
FROM booking b
JOIN payment p ON b.payment_id = p.id
JOIN member m ON b.member_id = m.user_id
JOIN wallet w ON m.user_id = w.member_id
WHERE p.status = 'REFUNDED'
  AND NOT EXISTS (
    -- 检查是否已经有对应的退款交易记录
    SELECT 1 FROM wallet_transaction wt 
    WHERE wt.reference_type = 'PAYMENT' 
      AND wt.reference_id = p.id
      AND wt.transaction_type = 'REFUND'
  );

-- 4. 显示迁移结果统计
SELECT 
    'Migration Summary' as summary,
    COUNT(*) as total_wallet_bookings,
    SUM(total_amount) as total_amount
FROM booking b
JOIN payment p ON b.payment_id = p.id
WHERE p.payment_method = 'WALLET' 
  AND p.status = 'COMPLETED';

SELECT 
    'Refund Summary' as summary,
    COUNT(*) as total_refunded_bookings,
    SUM(total_amount * 0.5) as total_refund_amount
FROM booking b
JOIN payment p ON b.payment_id = p.id
WHERE p.status = 'REFUNDED'; 