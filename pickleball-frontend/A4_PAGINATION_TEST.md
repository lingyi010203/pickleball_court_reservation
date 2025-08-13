# A4 尺寸和分页功能测试

## 改进内容

### 1. A4 尺寸设置
- ✅ **预览区域**: 210mm × 297mm (A4标准尺寸)
- ✅ **PDF导出**: 794px × 1123px (96 DPI下的A4尺寸)
- ✅ **响应式设计**: 在屏幕上正确显示，最大宽度210mm

### 2. 分页功能改进
- ✅ **动态页数计算**: 根据内容高度自动计算总页数
- ✅ **页面断点**: 计算页面断点位置
- ✅ **页脚显示**: 动态显示 "Page 1 of X" 而不是固定的 "Page 1 of 1"
- ✅ **PDF分页**: 改进的PDF导出分页逻辑

### 3. 新增功能
- ✅ **分页状态管理**: `currentPage`, `totalPages`, `pageBreaks`
- ✅ **自动重新计算**: 预览内容变化时自动重新计算分页
- ✅ **页面信息显示**: 在预览标题栏显示当前页数和总页数

## 测试步骤

### 1. 基本A4尺寸测试
1. 打开报告生成器
2. 选择任意报告类型
3. 设置日期范围
4. 点击 "Preview Report"
5. 验证预览区域是否为A4尺寸 (210mm × 297mm)

### 2. 分页功能测试
1. 生成包含大量数据的报告（如月度收入分析）
2. 检查页脚是否显示正确的页数 (如 "Page 1 of 3")
3. 检查预览标题栏是否显示页数信息

### 3. PDF导出测试
1. 点击 "Export Preview"
2. 验证生成的PDF是否为A4尺寸
3. 检查多页内容是否正确分页

## 技术实现细节

### 分页计算逻辑
```javascript
const calculatePageBreaks = useCallback(() => {
  const content = previewRef.current;
  const contentHeight = content.scrollHeight;
  const pageHeight = 1123; // A4高度 (297mm = 794px at 96 DPI)
  const headerHeight = 100; // 预估header高度
  const footerHeight = 80; // 预估footer高度
  const availableHeight = pageHeight - headerHeight - footerHeight - 40; // 40px边距
  
  const pages = Math.ceil(contentHeight / availableHeight);
  setTotalPages(pages);
}, []);
```

### PDF分页逻辑
```javascript
// 改进的分页逻辑
const pageHeightMM = pdfHeight - 20; // 留出边距
const pages = Math.ceil(imgHeight / pageHeightMM);
let heightLeft = imgHeight;
let position = 0;

for (let i = 0; i < pages; i++) {
  if (i > 0) {
    pdf.addPage();
  }
  
  const pageHeight = Math.min(pageHeightMM, heightLeft);
  pdf.addImage(imgData, 'JPEG', 10, 10 - position, imgWidth, imgHeight);
  position += pageHeight;
  heightLeft -= pageHeight;
}
```

## 预期结果

1. **A4尺寸**: 预览和PDF都应该是标准A4尺寸
2. **动态分页**: 根据内容长度自动计算页数
3. **正确显示**: 页脚显示 "Page 1 of X" 而不是固定值
4. **PDF质量**: 导出的PDF应该清晰且格式正确

## 注意事项

- 分页计算基于预估的header和footer高度
- 实际内容可能因字体大小、行间距等因素略有差异
- 建议在生成最终报告前先预览确认分页效果

