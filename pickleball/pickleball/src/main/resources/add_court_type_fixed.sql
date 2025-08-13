-- 添加 court_type 字段到 court 表（如果不存在）
ALTER TABLE court ADD COLUMN court_type VARCHAR(20) DEFAULT 'STANDARD';

-- 临时禁用安全更新模式
SET SQL_SAFE_UPDATES = 0;

-- 首先将所有场地设置为STANDARD
UPDATE court SET court_type = 'STANDARD';

-- 然后设置VIP场地（优先级最高）
UPDATE court SET court_type = 'VIP' 
WHERE LOWER(name) LIKE '%vip%' OR LOWER(name) LIKE '%premium%';

-- 最后设置OTHER场地（不包含standard、court、vip、premium关键字的）
UPDATE court SET court_type = 'OTHER' 
WHERE LOWER(name) NOT LIKE '%standard%' 
AND LOWER(name) NOT LIKE '%court%'
AND LOWER(name) NOT LIKE '%vip%' 
AND LOWER(name) NOT LIKE '%premium%';

-- 重新启用安全更新模式
SET SQL_SAFE_UPDATES = 1;

-- 显示结果
SELECT court_type, COUNT(*) as count FROM court GROUP BY court_type;
SELECT id, name, court_type FROM court ORDER BY id;
