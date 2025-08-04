-- 检查 court_image 表是否存在
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema = 'pickleball' 
AND table_name = 'court_image';

-- 如果表不存在，创建它
CREATE TABLE IF NOT EXISTS court_image (
    id INT AUTO_INCREMENT PRIMARY KEY,
    court_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_court_id (court_id)
);

-- 检查表结构
DESCRIBE court_image;

-- 查看现有数据
SELECT * FROM court_image LIMIT 10; 