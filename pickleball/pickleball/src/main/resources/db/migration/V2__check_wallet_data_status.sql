-- 检查钱包数据状态的查询脚本
-- 在 MySQL Workbench 中执行这些查询来了解当前数据状态

-- 1. 检查使用钱包支付的预订数量
SELECT 
    'Wallet Bookings' as category,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM booking b
JOIN payment p ON b.payment_id = p.id
WHERE p.payment_method = 'WALLET' 
  AND p.status = 'COMPLETED';

-- 2. 检查已退款的预订数量
SELECT 
    'Refunded Bookings' as category,
    COUNT(*) as count,
    SUM(total_amount * 0.5) as total_refund_amount
FROM booking b
JOIN payment p ON b.payment_id = p.id
WHERE p.status = 'REFUNDED';

-- 3. 检查现有的钱包交易记录
SELECT 
    'Existing Wallet Transactions' as category,
    transaction_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM wallet_transaction
GROUP BY transaction_type;

-- 4. 检查钱包余额和统计信息
SELECT 
    w.id as wallet_id,
    m.user_id as member_id,
    w.balance,
    w.total_deposited,
    w.total_spent,
    w.status
FROM wallet w
JOIN member m ON w.member_id = m.user_id
ORDER BY w.id;

-- 5. 检查哪些预订还没有对应的钱包交易记录
SELECT 
    b.id as booking_id,
    b.total_amount,
    b.booking_date,
    p.id as payment_id,
    p.payment_method,
    p.status,
    m.user_id as member_id
FROM booking b
JOIN payment p ON b.payment_id = p.id
JOIN member m ON b.member_id = m.user_id
WHERE p.payment_method = 'WALLET' 
  AND p.status = 'COMPLETED'
  AND NOT EXISTS (
    SELECT 1 FROM wallet_transaction wt 
    WHERE wt.reference_type = 'PAYMENT' 
      AND wt.reference_id = p.id
  );

-- 6. 检查哪些退款还没有对应的钱包交易记录
SELECT 
    b.id as booking_id,
    b.total_amount,
    b.booking_date,
    p.id as payment_id,
    p.refund_date,
    m.user_id as member_id
FROM booking b
JOIN payment p ON b.payment_id = p.id
JOIN member m ON b.member_id = m.user_id
WHERE p.status = 'REFUNDED'
  AND NOT EXISTS (
    SELECT 1 FROM wallet_transaction wt 
    WHERE wt.reference_type = 'PAYMENT' 
      AND wt.reference_id = p.id
      AND wt.transaction_type = 'REFUND'
  ); 