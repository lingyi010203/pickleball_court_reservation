# 场地类型设置指南

## 概述
为了改进场地利用率的分类显示，我们添加了 `court_type` 字段来明确区分不同类型的场地。

## 场地类型
- **STANDARD**: 标准球场
- **VIP**: VIP球场  
- **OTHER**: 其他类型场地

## 数据库设置

### 1. 执行SQL脚本

#### 方案A：使用子查询（推荐）
运行 `src/main/resources/add_court_type.sql` 脚本：
- 添加 `court_type` 字段到 `court` 表
- 使用子查询避免MySQL安全模式问题
- 根据现有场地名称自动设置场地类型

#### 方案B：临时禁用安全模式
如果方案A仍有问题，运行 `src/main/resources/add_court_type_simple.sql` 脚本：
- 临时禁用MySQL安全更新模式
- 执行更新操作
- 重新启用安全模式

```sql
-- 方案A：使用子查询
UPDATE court SET court_type = 'VIP' 
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM court 
        WHERE LOWER(name) LIKE '%vip%' OR LOWER(name) LIKE '%premium%'
    ) AS temp
);

-- 方案B：临时禁用安全模式
SET SQL_SAFE_UPDATES = 0;
UPDATE court SET court_type = 'VIP' 
WHERE LOWER(name) LIKE '%vip%' OR LOWER(name) LIKE '%premium%';
SET SQL_SAFE_UPDATES = 1;
```

### 2. 手动更新场地类型
使用API端点更新特定场地的类型：

```bash
PUT /api/admin/courts/{courtId}/type
Content-Type: application/json

{
  "courtType": "VIP"  // 或 "STANDARD" 或 "OTHER"
}
```

## 前端显示
场地利用率页面现在会根据 `courtType` 字段自动分组显示：
- **Standard Courts**: 蓝色主题
- **VIP Courts**: 橙色主题  
- **Other Courts**: 紫色主题

## 注意事项
1. 新创建的场地默认为 `STANDARD` 类型
2. 可以通过管理界面或API手动调整场地类型
3. 场地类型更改会立即反映在利用率分析中
