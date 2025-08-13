-- 检查场地类型分布
SELECT court_type, COUNT(*) as count FROM court GROUP BY court_type;

-- 检查所有场地名称
SELECT id, name, court_type FROM court ORDER BY id;

-- 检查包含VIP或Premium关键字的场地
SELECT id, name, court_type 
FROM court 
WHERE LOWER(name) LIKE '%vip%' OR LOWER(name) LIKE '%premium%';

-- 检查包含Standard或Court关键字的场地
SELECT id, name, court_type 
FROM court 
WHERE LOWER(name) LIKE '%standard%' OR LOWER(name) LIKE '%court%';
