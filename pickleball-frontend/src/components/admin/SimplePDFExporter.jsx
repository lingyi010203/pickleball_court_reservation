import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

class PDFExporter {
  constructor() {
    this.A4_WIDTH_MM = 210;
    this.A4_HEIGHT_MM = 297;
    this.A4_WIDTH_PX = 794;
    this.A4_HEIGHT_PX = 1123;
  }

  async exportToPDF(element, filename) {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // 获取元素尺寸
      const contentHeight = element.scrollHeight;
      const contentWidth = element.scrollWidth;

      console.log('Exporting PDF:', {
        contentHeight,
        contentWidth,
        filename
      });

      // 捕获内容
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: this.A4_WIDTH_PX,
        height: contentHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: this.A4_WIDTH_PX,
        windowHeight: contentHeight,
        onclone: (clonedDoc) => {
          this.prepareCloneForPDF(clonedDoc, contentHeight);
        }
      });

      // 创建PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // 计算图片尺寸
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 分页处理
      const pageHeightMM = pdfHeight - 20; // 10mm margin top and bottom
      const totalPages = Math.ceil(imgHeight / pageHeightMM);
      let heightLeft = imgHeight;
      let position = 0;

      console.log('PDF generation:', {
        imgHeight,
        pageHeightMM,
        totalPages
      });

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const pageHeight = Math.min(pageHeightMM, heightLeft);
        pdf.addImage(
          imgData,
          'JPEG',
          10, // left margin
          10 - position, // top margin
          imgWidth,
          imgHeight
        );
        position += pageHeight;
        heightLeft -= pageHeight;
      }

      // 保存文件
      pdf.save(filename);
      console.log('PDF exported successfully:', filename);

      return {
        success: true,
        pages: totalPages,
        filename
      };

    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error(`PDF export failed: ${error.message}`);
    }
  }

  prepareCloneForPDF(clonedDoc, contentHeight) {
    const clonedElement = clonedDoc.querySelector('[data-preview-content]');
    if (!clonedElement) return;

    // 设置基本样式
    clonedElement.style.width = `${this.A4_WIDTH_PX}px`;
    clonedElement.style.height = `${contentHeight}px`;
    clonedElement.style.backgroundColor = 'white';
    clonedElement.style.padding = '20px';
    clonedElement.style.boxSizing = 'border-box';
    clonedElement.style.position = 'relative';
    clonedElement.style.overflow = 'visible';
    clonedElement.style.fontFamily = 'Arial, sans-serif';
    clonedElement.style.fontSize = '12px';
    clonedElement.style.lineHeight = '1.4';

    // 处理header
    const header = clonedElement.querySelector('[data-header]');
    if (header) {
      header.style.borderBottom = '2px solid #667eea';
      header.style.paddingBottom = '16px';
      header.style.marginBottom = '24px';
      header.style.position = 'relative';
      header.style.zIndex = '1';
    }

    // 处理footer
    const footer = clonedElement.querySelector('[data-footer]');
    if (footer) {
      footer.style.borderTop = '2px solid #667eea';
      footer.style.paddingTop = '16px';
      footer.style.marginTop = '32px';
      footer.style.position = 'relative';
      footer.style.zIndex = '1';
      footer.style.minHeight = '80px';
      footer.style.display = 'flex';
      footer.style.justifyContent = 'space-between';
      footer.style.alignItems = 'flex-start';
      footer.style.flexWrap = 'wrap';
      footer.style.gap = '8px';

      // 确保页脚文本不被截断
      const footerTexts = footer.querySelectorAll('p, div');
      footerTexts.forEach(text => {
        text.style.whiteSpace = 'nowrap';
        text.style.overflow = 'visible';
        text.style.textOverflow = 'clip';
        text.style.wordBreak = 'keep-all';
        text.style.fontSize = '11px';
      });
    }

    // 处理图表容器
    const chartContainers = clonedElement.querySelectorAll('[style*="height"]');
    chartContainers.forEach(container => {
      container.style.overflow = 'visible';
      container.style.position = 'relative';
      container.style.border = '1px solid #e0e0e0';
      container.style.borderRadius = '8px';
      container.style.padding = '12px';
      container.style.backgroundColor = '#fafafa';
    });
  }

  generateFilename(reportType) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${reportType}_Report_${timestamp}.pdf`;
  }
}

// React组件
const SimplePDFExporter = ({ elementRef, reportType, isExporting, onExport }) => {
  const exporter = React.useRef(new PDFExporter());

  const handleExport = async () => {
    if (!elementRef.current) {
      alert('No content to export');
      return;
    }

    try {
      onExport(true);
      const filename = exporter.current.generateFilename(reportType);
      const result = await exporter.current.exportToPDF(elementRef.current, filename);
      
      console.log('Export completed:', result);
      alert(`PDF exported successfully! ${result.pages} page(s) generated.`);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export PDF: ${error.message}`);
    } finally {
      onExport(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={isExporting ? <CircularProgress size={24} /> : <DownloadIcon />}
      onClick={handleExport}
      disabled={isExporting || !elementRef.current}
      size="large"
      sx={{
        py: 1.5,
        fontWeight: 600,
        fontSize: '0.95rem',
        borderRadius: 1.5
      }}
    >
      {isExporting ? 'Exporting...' : 'Export PDF'}
    </Button>
  );
};

export default SimplePDFExporter;
