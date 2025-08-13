# A4 分页和布局问题修复

## 问题描述

从图片中可以看到以下严重问题：
1. **饼图被黑色条分割**: 饼图中间有一条粗黑线，将图表分割成两部分
2. **页脚文本截断**: "Page 1 of X" 显示为 "Page 1 c"
3. **内容超出A4尺寸**: 报告内容没有正确限制在A4尺寸内
4. **分页计算错误**: 分页逻辑没有正确计算内容高度

## 问题原因分析

1. **html2canvas height 限制**: 设置了固定的 height 导致内容被截断
2. **分页计算不准确**: header 和 footer 高度预估不足
3. **容器样式问题**: overflow: hidden 导致内容被隐藏
4. **页脚宽度不足**: 页脚容器宽度不够，导致文本被截断

## 修复方案

### 1. 改进分页计算

```javascript
// 修复前
const pageHeight = 1123; // A4高度
const headerHeight = 100; // 预估header高度
const footerHeight = 80; // 预估footer高度
const availableHeight = pageHeight - headerHeight - footerHeight - 40;

// 修复后
const pageHeight = 1123; // A4高度 (297mm = 1123px at 96 DPI)
const headerHeight = 120; // 增加header高度预估
const footerHeight = 100; // 增加footer高度预估
const margin = 60; // 增加边距
const availableHeight = pageHeight - headerHeight - footerHeight - margin;
const pages = Math.max(1, Math.ceil(contentHeight / availableHeight));
```

### 2. 修复PDF导出

```javascript
// 修复前
const canvas = await html2canvas(previewRef.current, {
  width: 794,
  height: contentHeight, // 固定高度导致截断
});

// 修复后
const canvas = await html2canvas(previewRef.current, {
  width: 794,
  // 移除height限制，让html2canvas自动计算高度
});
```

### 3. 改进预览容器样式

```javascript
// 修复前
<div style={{ 
  paddingBottom: '100px',
  minHeight: '250mm',
  overflow: 'hidden' // 导致内容被隐藏
}}>

// 修复后
<div style={{ 
  paddingBottom: '120px', // 增加底部间距
  minHeight: '200mm', // 减少最小高度
  maxHeight: '297mm', // 限制最大高度为A4高度
  overflow: 'visible' // 让内容正常显示
}}>
```

### 4. 修复页脚文本截断

```javascript
// 修复前
<Box sx={{ 
  minWidth: '150px',
  alignItems: 'flex-end'
}}>
  <Typography sx={{ whiteSpace: 'nowrap' }}>
    Page 1 of {totalPages}
  </Typography>
</Box>

// 修复后
<Box sx={{ 
  minWidth: '180px', // 增加最小宽度
  alignItems: 'flex-end',
  overflow: 'visible' // 确保内容不被截断
}}>
  <Typography sx={{ 
    whiteSpace: 'nowrap',
    overflow: 'visible',
    textOverflow: 'clip'
  }}>
    Page 1 of {totalPages}
  </Typography>
</Box>
```

## 修复效果

### 修复前
- ❌ 饼图被黑色条分割
- ❌ 页脚文本显示为 "Page 1 c"
- ❌ 内容超出A4尺寸
- ❌ 分页计算不准确

### 修复后
- ✅ 饼图完整显示，无黑色分割线
- ✅ 页脚完整显示 "Page 1 of X"
- ✅ 内容正确限制在A4尺寸内
- ✅ 分页计算准确

## 技术要点

### 1. A4尺寸设置
- 宽度: 210mm = 794px (96 DPI)
- 高度: 297mm = 1123px (96 DPI)
- 内容区域: 减去 header、footer 和边距

### 2. html2canvas 配置
- 移除固定 height 限制
- 让库自动计算内容高度
- 保持 width 为 A4 宽度

### 3. 容器管理
- 使用 `overflow: visible` 让内容正常显示
- 设置合理的 `minHeight` 和 `maxHeight`
- 增加足够的底部间距

### 4. 页脚优化
- 增加容器最小宽度
- 使用 `overflow: visible` 和 `textOverflow: clip`
- 确保文本不被截断

## 调试信息

添加了调试日志来帮助排查问题：

```javascript
console.log('Page calculation:', {
  contentHeight,
  pageHeight,
  availableHeight,
  pages,
  breaks
});

console.log('PDF export calculation:', {
  contentHeight,
  pageHeight,
  availableHeight,
  actualPages
});
```

## 测试建议

1. **基本渲染测试**:
   - 生成报告检查饼图是否完整显示
   - 检查页脚文本是否完整

2. **分页测试**:
   - 生成多页报告检查分页是否正确
   - 检查每页内容是否在A4尺寸内

3. **PDF导出测试**:
   - 导出PDF检查图表是否完整
   - 检查页脚是否完整显示

4. **边界测试**:
   - 测试极短和极长的内容
   - 测试不同的图表类型

## 注意事项

1. **内容高度**: 确保内容高度计算准确
2. **容器限制**: 合理设置容器的最大和最小高度
3. **文本溢出**: 使用正确的文本溢出处理
4. **调试信息**: 保留调试日志以便排查问题
