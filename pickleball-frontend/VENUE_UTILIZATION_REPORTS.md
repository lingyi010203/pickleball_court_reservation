# 场地利用率报告系统

## 📊 新增报告类型

### 1. Venue Utilization Report (场地利用率报告)
**API端点**: `/api/admin/reports/venue-utilization`

#### 功能特点
- **综合利用率分析**: 全面的场地利用率指标和趋势
- **时间趋势**: 显示利用率随时间的变化趋势
- **统计指标**: 平均利用率、最高利用率、最低利用率等
- **详细数据**: 每个场地的具体利用率数据

#### 包含图表
- **Utilization Trend Over Time**: 利用率时间趋势图
- **Utilization Statistics**: 利用率统计柱状图
- **Venue Utilization Distribution**: 场地利用率分布饼图

#### 数据表格
| 字段 | 说明 |
|------|------|
| Venue | 场地名称 |
| Utilization Rate (%) | 利用率百分比 |
| Total Hours | 总可用小时数 |
| Booked Hours | 已预订小时数 |

---

### 2. Venue Utilization Ranking (场地利用率排名)
**API端点**: `/api/admin/reports/venue-ranking`

#### 功能特点
- **性能排名**: 基于利用率对场地进行排名
- **性能指标**: 综合性能评分系统
- **竞争分析**: 场地间的性能对比
- **改进建议**: 基于排名的改进建议

#### 包含图表
- **Venue Utilization Ranking**: 场地利用率排名柱状图
- **Venue Performance Metrics**: 场地性能指标图

#### 数据表格
| 字段 | 说明 |
|------|------|
| Rank | 排名 |
| Venue | 场地名称 |
| Utilization Rate (%) | 利用率百分比 |
| Performance Score | 性能评分 |

---

### 3. Peak/Off-Peak Period Analysis (高峰/非高峰时段分析)
**API端点**: `/api/admin/reports/peak-off-peak`

#### 功能特点
- **时段分析**: 高峰和非高峰时段的利用率对比
- **模式识别**: 识别利用率模式和时间规律
- **优化建议**: 基于时段分析的运营优化建议
- **容量规划**: 帮助进行容量规划和资源分配

#### 包含图表
- **Peak Period Utilization**: 高峰时段利用率图
- **Off-Peak Period Utilization**: 非高峰时段利用率图
- **Peak vs Off-Peak Comparison**: 高峰vs非高峰对比图

#### 数据表格
- **Peak Period Details**: 高峰时段详细数据
- **Off-Peak Period Details**: 非高峰时段详细数据

---

### 4. Venue Type Preference (场地类型偏好)
**API端点**: `/api/admin/reports/venue-type-preference`

#### 功能特点
- **偏好分析**: 用户对不同场地类型的偏好分析
- **预订模式**: 不同场地类型的预订模式
- **满意度分析**: 基于评分的满意度分析
- **投资决策**: 帮助进行场地类型投资决策

#### 包含图表
- **Venue Type Preference Distribution**: 场地类型偏好分布饼图
- **Venue Type Utilization Comparison**: 场地类型利用率对比图
- **Venue Type Booking Trend**: 场地类型预订趋势图

#### 数据表格
| 字段 | 说明 |
|------|------|
| Venue Type | 场地类型 |
| Booking Count | 预订数量 |
| Utilization Rate (%) | 利用率百分比 |
| Average Rating | 平均评分 |

## 🎯 使用场景

### 运营管理
- **资源优化**: 识别利用率低的场地，优化资源配置
- **定价策略**: 基于利用率制定差异化定价策略
- **维护计划**: 根据利用率安排维护时间

### 投资决策
- **扩建决策**: 基于利用率数据决定是否扩建
- **场地类型**: 选择最受欢迎的场地类型进行投资
- **时段优化**: 优化营业时间安排

### 营销策略
- **促销活动**: 针对利用率低的时段进行促销
- **会员服务**: 基于偏好提供个性化服务
- **客户教育**: 引导客户选择利用率较低的时段

## 📈 数据指标

### 利用率指标
- **整体利用率**: 所有场地的平均利用率
- **场地利用率**: 单个场地的利用率
- **时段利用率**: 不同时段的利用率
- **类型利用率**: 不同场地类型的利用率

### 性能指标
- **利用率排名**: 场地在利用率方面的排名
- **性能评分**: 综合性能评分
- **增长趋势**: 利用率的变化趋势
- **季节性模式**: 利用率的季节性变化

### 偏好指标
- **预订偏好**: 用户对不同场地类型的偏好
- **时段偏好**: 用户对不同时段的偏好
- **满意度**: 基于评分的满意度指标
- **忠诚度**: 用户的重复预订行为

## 🔧 技术实现

### 前端组件
- **ReportGenerator**: 主报告生成器组件
- **ReportChart**: 图表渲染组件
- **PDFExportHelper**: PDF导出助手

### 数据格式
```javascript
// 场地利用率报告数据格式
{
  trends: {
    utilizationTrend: { /* 时间序列数据 */ },
    utilizationStats: { /* 统计数据 */ },
    venueUtilization: { /* 场地利用率分布 */ }
  },
  breakdown: {
    venueUtilizationDetails: {
      "Court 1": {
        utilizationRate: 85,
        totalHours: 168,
        bookedHours: 143
      }
    }
  }
}
```

### API端点
- `GET /api/admin/reports/venue-utilization`
- `GET /api/admin/reports/venue-ranking`
- `GET /api/admin/reports/peak-off-peak`
- `GET /api/admin/reports/venue-type-preference`

## 📋 报告配置

### 报告类型配置
```javascript
const REPORT_CONFIG = {
  types: [
    { value: 'venue_utilization', label: 'Venue Utilization Report', ... },
    { value: 'venue_ranking', label: 'Venue Utilization Ranking', ... },
    { value: 'peak_off_peak', label: 'Peak/Off-Peak Period Analysis', ... },
    { value: 'venue_type_preference', label: 'Venue Type Preference', ... }
  ]
}
```

### 图表类型支持
- **柱状图**: 用于排名和对比分析
- **折线图**: 用于趋势分析
- **饼图**: 用于分布分析

## 🎨 可视化特性

### 图表样式
- **品牌色彩**: 使用公司品牌色彩
- **响应式设计**: 适配不同屏幕尺寸
- **交互功能**: 悬停显示详细信息
- **导出支持**: 支持PDF导出

### 数据表格
- **排序功能**: 支持按列排序
- **分页显示**: 大量数据分页显示
- **搜索功能**: 支持数据搜索
- **导出功能**: 支持表格数据导出

## 📊 报告示例

### Venue Utilization Report
```
Executive Summary:
- Overall utilization rate: 78.5%
- Most utilized venue: Court A (92.3%)
- Least utilized venue: Court D (45.2%)
- Peak utilization time: 18:00-20:00

Key Insights:
- Weekend utilization is 15% higher than weekdays
- Morning slots (6:00-10:00) have lowest utilization
- Evening slots (18:00-22:00) are most popular
```

### Venue Ranking Report
```
Top Performing Venues:
1. Court A - 92.3% utilization
2. Court B - 87.1% utilization
3. Court C - 81.5% utilization
4. Court D - 45.2% utilization

Performance Metrics:
- Average utilization: 78.5%
- Standard deviation: 18.2%
- Performance range: 45.2% - 92.3%
```

## 🔮 未来扩展

### 计划功能
- [ ] 实时利用率监控
- [ ] 预测性分析
- [ ] 自动化报告生成
- [ ] 移动端报告查看
- [ ] 邮件报告推送

### 高级分析
- [ ] 机器学习预测
- [ ] 异常检测
- [ ] 关联分析
- [ ] 客户行为分析
- [ ] 收入影响分析

## 📞 技术支持

### 常见问题
1. **数据不显示**: 检查API端点是否正确
2. **图表渲染错误**: 确认数据格式正确
3. **PDF导出失败**: 检查浏览器兼容性

### 调试信息
```javascript
console.log('Report data:', reportData);
console.log('Chart configuration:', chartConfig);
console.log('API response:', apiResponse);
```

## 🎉 总结

这四个新的场地利用率报告类型提供了全面的场地管理分析工具：

- ✅ **Venue Utilization Report**: 全面的利用率分析
- ✅ **Venue Utilization Ranking**: 性能排名和对比
- ✅ **Peak/Off-Peak Period Analysis**: 时段分析和优化
- ✅ **Venue Type Preference**: 用户偏好和投资决策

这些报告将帮助管理者更好地理解场地使用情况，优化运营策略，提高资源利用效率！
