# A4 Report Preview Setup

## Overview

The report preview has been configured to use A4 paper dimensions (210mm x 297mm) to ensure consistency between the preview and the final PDF output.

## A4 Dimensions

### Standard A4 Paper
- **Width**: 210mm (8.27 inches)
- **Height**: 297mm (11.69 inches)
- **Aspect Ratio**: 1:1.414 (√2)

### Screen Display
- **Width**: 794px (at 96 DPI)
- **Height**: 1123px (at 96 DPI)
- **Responsive**: Adapts to screen size while maintaining proportions

## Implementation Details

### Preview Container
```jsx
<Paper 
  sx={{ 
    // A4尺寸设置
    width: '210mm',
    minHeight: '297mm',
    margin: '0 auto',
    backgroundColor: 'white',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    // 确保在屏幕上正确显示
    '@media screen': {
      width: '100%',
      maxWidth: '210mm',
      minHeight: 'auto'
    }
  }}
>
```

### Content Area
```jsx
<div 
  ref={previewRef} 
  data-preview-content 
  style={{ 
    backgroundColor: 'white', 
    padding: '20px',
    // A4内容区域设置
    width: '100%',
    minHeight: '250mm',
    boxSizing: 'border-box'
  }}
>
```

### Chart Optimization
- **Chart Height**: Reduced from 300px to 250px
- **Better Fit**: Charts now fit better within A4 constraints
- **Maintains Quality**: Charts remain clear and readable

## PDF Export Configuration

### A4 PDF Settings
```javascript
// 创建PDF (A4尺寸)
const pdf = new jsPDF('p', 'mm', 'a4'); // 使用A4尺寸

// 计算图片在A4页面上的尺寸
const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
const imgWidth = pdfWidth - 20; // 留出边距
const imgHeight = (canvas.height * imgWidth) / canvas.width;
```

### Canvas Capture Settings
```javascript
const canvas = await html2canvas(previewRef.current, {
  scale: 2, // 提高分辨率
  useCORS: true,
  allowTaint: true,
  backgroundColor: '#ffffff',
  width: 794, // A4宽度 (210mm = 794px at 96 DPI)
  height: 1123, // A4高度 (297mm = 1123px at 96 DPI)
  onclone: (clonedDoc) => {
    // 确保克隆的元素保持A4样式
    const clonedElement = clonedDoc.querySelector('[data-preview-content]');
    if (clonedElement) {
      clonedElement.style.width = '794px';
      clonedElement.style.minHeight = '1123px';
      clonedElement.style.backgroundColor = 'white';
      clonedElement.style.padding = '20px';
      clonedElement.style.boxSizing = 'border-box';
    }
  }
});
```

## Benefits

### ✅ **Consistency**
- Preview matches final PDF output
- No surprises when exporting
- Professional appearance

### ✅ **Standard Format**
- A4 is the most common paper size
- Compatible with all printers
- Standard for business reports

### ✅ **Optimized Layout**
- Charts fit properly within A4 constraints
- Text and spacing optimized for print
- Professional margins and padding

### ✅ **Multi-page Support**
- Automatic page breaks for long content
- Proper page numbering
- Consistent formatting across pages

## Chart Adjustments

### Height Optimization
- **Before**: 300px (too tall for A4)
- **After**: 250px (perfect fit)
- **Result**: Better use of A4 space

### Responsive Design
- Charts scale properly within A4 dimensions
- Maintain readability at all sizes
- Consistent appearance across devices

## Usage

### 1. Preview Report
1. Generate report data
2. Click "Preview Report"
3. View in A4 format
4. Verify layout and content

### 2. Export to PDF
1. Click "Export Preview"
2. PDF maintains A4 dimensions
3. Ready for printing or sharing

### 3. Print Settings
- Use A4 paper size
- Set margins to default
- Enable background graphics for charts

## Technical Notes

### CSS Units
- **mm**: Millimeters for precise A4 dimensions
- **px**: Pixels for screen display
- **%**: Percentages for responsive design

### Browser Compatibility
- Modern browsers support mm units
- Fallback to px for older browsers
- Responsive design ensures compatibility

### Performance
- Optimized canvas capture
- Efficient PDF generation
- Minimal memory usage

## Future Enhancements

- [ ] Custom page size options
- [ ] Landscape orientation support
- [ ] Custom margins and spacing
- [ ] Header and footer templates
- [ ] Watermark support
- [ ] Digital signature integration 