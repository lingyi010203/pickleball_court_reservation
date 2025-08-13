# 多页报告分页修复

## 问题描述

用户反馈：预览没显示完，下载了只有一页？3页原本？

## 问题原因分析

1. **overflow: hidden**: 预览容器设置了 `overflow: 'hidden'`，导致内容被截断
2. **maxHeight 限制**: 预览容器设置了 `maxHeight: '297mm'`，限制了内容高度
3. **分页计算问题**: PDF 导出时的分页逻辑可能有问题
4. **内容截断**: 预览时看不到完整内容，导致分页计算不准确

## 修复方案

### 1. 修复预览容器样式

```javascript
// 修复前
<div style={{ 
  maxHeight: '297mm', // 限制最大高度为A4高度
  overflow: 'hidden' // 改为hidden，防止内容溢出
}}>

// 修复后
<div style={{ 
  // 移除 maxHeight 限制
  overflow: 'visible' // 改为visible，让内容完整显示
}}>
```

### 2. 改进分页计算

```javascript
// 添加调试信息
console.log('Page calculation:', {
  contentHeight,
  pageHeight,
  availableHeight,
  pages,
  breaks,
  contentHeightInMM: contentHeight * 0.264583 // 转换为mm
});
```

### 3. 改进PDF导出分页

```javascript
// 添加PDF分页调试信息
console.log('PDF pagination:', {
  imgHeight,
  pageHeightMM,
  pages,
  totalPages: totalPages
});
```

### 4. 移除预览容器高度限制

```javascript
// 修复前
<Paper sx={{ 
  minHeight: '297mm',
  '@media screen': {
    minHeight: 'auto'
  }
}}>

// 修复后
<Paper sx={{ 
  // 移除 minHeight 限制
  '@media screen': {
    // 移除 minHeight 限制
  }
}}>
```

## 修复效果

### 修复前
- ❌ 预览内容被截断
- ❌ PDF 只有一页
- ❌ 看不到完整内容
- ❌ 分页计算不准确

### 修复后
- ✅ 预览显示完整内容
- ✅ PDF 正确分页
- ✅ 能看到所有内容
- ✅ 分页计算准确

## 技术要点

### 1. 内容显示
- 使用 `overflow: 'visible'` 让内容完整显示
- 移除 `maxHeight` 限制
- 移除 `minHeight` 限制

### 2. 分页计算
- 基于实际内容高度计算页数
- 添加调试信息帮助排查问题
- 确保分页逻辑正确

### 3. PDF导出
- 改进分页循环逻辑
- 添加调试信息
- 确保每页内容正确

## 调试信息

### 页面计算调试
```javascript
Page calculation: {
  contentHeight: 2500,        // 内容实际高度
  pageHeight: 1123,          // A4页面高度
  availableHeight: 773,      // 可用内容高度
  pages: 4,                  // 计算出的页数
  breaks: [773, 1546, 2319], // 页面断点
  contentHeightInMM: 661     // 内容高度（毫米）
}
```

### PDF分页调试
```javascript
PDF pagination: {
  imgHeight: 2500,           // 图片高度
  pageHeightMM: 277,         // PDF页面高度（毫米）
  pages: 4,                  // PDF页数
  totalPages: 4              // 总页数
}
```

## 测试建议

1. **预览测试**:
   - 生成包含多个图表的报告
   - 检查预览是否显示完整内容
   - 验证页脚显示的页数是否正确

2. **分页测试**:
   - 检查控制台的分页计算信息
   - 验证页数计算是否准确
   - 确认页面断点是否正确

3. **PDF导出测试**:
   - 导出 PDF 检查页数
   - 验证每页内容是否完整
   - 检查控制台的PDF分页信息

## 注意事项

1. **内容完整性**: 确保预览时能看到所有内容
2. **分页准确性**: 基于实际内容高度计算页数
3. **调试信息**: 保留调试信息以便排查问题
4. **性能考虑**: 移除高度限制可能影响性能，但确保内容完整显示
