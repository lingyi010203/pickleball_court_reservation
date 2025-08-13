# 数据可见性修复 - PDF导出优化

## 问题描述

用户反馈：现在 "Preview Report" 显示的是 tooltip 数据，但是导出 PDF 后看不到实际的数据。

## 问题原因分析

1. **Tooltip 限制**: Chart.js 的 tooltip 只在鼠标悬停时显示，PDF 导出时无法捕获
2. **数据标签缺失**: 图表上没有直接显示数据标签
3. **PDF 渲染限制**: html2canvas 无法捕获动态生成的 tooltip 内容

## 修复方案

### 1. 改进 Tooltip 配置

```javascript
// 修复前
tooltip: {
  callbacks: {
    label: function(context) {
      const label = context.dataset.label || '';
      const value = context.parsed.y || context.parsed;
      return `${label}: ${value}`;
    }
  }
}

// 修复后
tooltip: {
  enabled: true,
  mode: 'index',
  intersect: false,
  callbacks: {
    label: function(context) {
      const label = context.dataset.label || '';
      const value = context.parsed.y || context.parsed;
      if (title.includes('Revenue')) {
        return `${label}: RM ${value.toLocaleString()}`;
      }
      return `${label}: ${value.toLocaleString()}`;
    },
    afterLabel: function(context) {
      if (type === 'pie') {
        const total = context.dataset.data.reduce((a, b) => a + b, 0);
        const percentage = ((context.parsed / total) * 100).toFixed(1);
        return `Percentage: ${percentage}%`;
      }
      return '';
    }
  }
}
```

### 2. 添加数据表格

在每个图表下方添加数据表格，确保 PDF 中能看到实际数据：

```javascript
{/* 数据表格 */}
<Box sx={{ mt: 2 }}>
  <Typography variant="subtitle2" gutterBottom>Data Table</Typography>
  <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Month</TableCell>
          <TableCell align="right">Revenue (RM)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(reportData.breakdown.topRevenueMonths).map(([month, revenue]) => (
          <TableRow key={month}>
            <TableCell>{month}</TableCell>
            <TableCell align="right">RM {revenue.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</Box>
```

## 修复效果

### 修复前
- ❌ PDF 中看不到实际数据值
- ❌ 只能通过 tooltip 查看数据
- ❌ 数据不够直观

### 修复后
- ✅ PDF 中包含数据表格
- ✅ 数据格式化显示（如 RM 1,234）
- ✅ 饼图显示百分比
- ✅ 数据清晰可见

## 技术实现

### 1. Tooltip 优化
- 启用 `mode: 'index'` 和 `intersect: false`
- 改进数据格式化（添加 RM 前缀）
- 为饼图添加百分比计算

### 2. 数据表格
- 使用 Material-UI Table 组件
- 限制表格高度，避免占用过多空间
- 数据格式化显示

### 3. 导入组件
```javascript
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
```

## 应用范围

已为以下图表添加数据表格：
1. **Top Revenue Months** - 顶级收入月份
2. **Peak Revenue Hours** - 高峰收入小时
3. **Top Performing Venues** - 顶级场地表现

## 测试建议

1. **预览测试**:
   - 生成报告预览
   - 检查图表下方是否有数据表格
   - 验证数据格式是否正确

2. **PDF导出测试**:
   - 导出 PDF 报告
   - 检查数据表格是否完整显示
   - 验证数据值是否正确

3. **数据格式测试**:
   - 检查收入数据是否显示 "RM" 前缀
   - 验证数字是否使用千分位分隔符
   - 确认饼图百分比计算正确

## 注意事项

1. **表格高度**: 限制表格最大高度为 200px，避免占用过多空间
2. **数据格式**: 统一使用 `toLocaleString()` 格式化数字
3. **响应式设计**: 表格在小屏幕上也能正常显示
4. **性能考虑**: 数据表格不会影响图表渲染性能
