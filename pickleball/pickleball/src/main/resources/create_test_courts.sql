-- 创建测试VIP场地（如果不存在的话）
INSERT INTO court (name, location, status, opening_time, closing_time, operating_days, court_type) 
VALUES 
('VIP Court 1', 'Main Area', 'ACTIVE', '09:00', '22:00', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday', 'VIP'),
('Premium Court A', 'VIP Zone', 'ACTIVE', '09:00', '22:00', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday', 'VIP'),
('VIP Training Court', 'Training Area', 'ACTIVE', '09:00', '22:00', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday', 'VIP')
ON DUPLICATE KEY UPDATE name = name;

-- 显示所有场地
SELECT id, name, court_type FROM court ORDER BY court_type, name;
