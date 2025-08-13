-- 添加 court_type 字段到 court 表
ALTER TABLE court ADD COLUMN court_type VARCHAR(20) DEFAULT 'STANDARD';

-- 更新现有场地数据，根据名称设置场地类型
-- VIP场地
UPDATE court SET court_type = 'VIP' 
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM court 
        WHERE LOWER(name) LIKE '%vip%' OR LOWER(name) LIKE '%premium%'
    ) AS temp
);

-- 标准场地（不包含VIP的）
UPDATE court SET court_type = 'STANDARD' 
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM court 
        WHERE LOWER(name) LIKE '%standard%' OR LOWER(name) LIKE '%court%'
    ) AS temp
);

-- 其他场地（不包含上述关键字的）
UPDATE court SET court_type = 'OTHER' 
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM court 
        WHERE court_type = 'STANDARD' 
        AND LOWER(name) NOT LIKE '%standard%' 
        AND LOWER(name) NOT LIKE '%court%'
    ) AS temp
);

-- 确保所有场地都有类型
UPDATE court SET court_type = 'STANDARD' 
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM court 
        WHERE court_type IS NULL
    ) AS temp
);
