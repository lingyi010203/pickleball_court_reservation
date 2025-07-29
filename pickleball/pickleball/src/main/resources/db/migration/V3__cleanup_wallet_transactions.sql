-- 清理钱包交易记录的脚本
-- 注意：在执行之前请先备份数据库！

-- 1. 删除重复的钱包交易记录（保留最早的记录）
DELETE wt1 FROM wallet_transaction wt1
INNER JOIN wallet_transaction wt2
WHERE wt1.id > wt2.id
  AND wt1.reference_type = wt2.reference_type
  AND wt1.reference_id = wt2.reference_id
  AND wt1.transaction_type = wt2.transaction_type;

-- 2. 删除引用不存在的 payment 的交易记录
DELETE wt FROM wallet_transaction wt
WHERE wt.reference_type = 'PAYMENT'
  AND NOT EXISTS (
    SELECT 1 FROM payment p WHERE p.id = wt.reference_id
  );

-- 3. 删除引用不存在的 wallet 的交易记录
DELETE wt FROM wallet_transaction wt
WHERE NOT EXISTS (
  SELECT 1 FROM wallet w WHERE w.id = wt.wallet_id
);

-- 4. 重置钱包的 total_spent 字段（基于实际交易记录重新计算）
UPDATE wallet w
SET total_spent = (
    SELECT COALESCE(SUM(amount), 0)
    FROM wallet_transaction wt
    WHERE wt.wallet_id = w.id
      AND wt.transaction_type = 'WITHDRAWAL'
)
WHERE w.id > 0;  -- 使用主键条件来满足安全模式要求

-- 5. 显示清理后的统计信息
SELECT 
    'After Cleanup - Wallet Transactions' as category,
    transaction_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM wallet_transaction
GROUP BY transaction_type;

-- 6. 显示清理后的钱包统计
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