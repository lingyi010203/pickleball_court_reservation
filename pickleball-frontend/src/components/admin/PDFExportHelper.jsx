import React from 'react';

// PDF导出助手类
class PDFExportHelper {
  constructor() {
    this.A4_WIDTH_MM = 210;
    this.A4_HEIGHT_MM = 297;
    this.A4_WIDTH_PX = 794; // 210mm = 794px at 96 DPI
    this.A4_HEIGHT_PX = 1123; // 297mm = 1123px at 96 DPI
    this.MARGIN_MM = 20;
    this.HEADER_HEIGHT_MM = 40;
    this.FOOTER_HEIGHT_MM = 30;
  }

  // 计算A4页面可用高度
  getAvailableHeight() {
    return this.A4_HEIGHT_MM - this.MARGIN_MM * 2 - this.HEADER_HEIGHT_MM - this.FOOTER_HEIGHT_MM;
  }

  // 计算内容需要多少页
  calculatePages(contentHeightMM) {
    const availableHeight = this.getAvailableHeight();
    return Math.max(1, Math.ceil(contentHeightMM / availableHeight));
  }

  // 转换像素到毫米
  pxToMm(px) {
    return px * 0.264583; // 1px = 0.264583mm at 96 DPI
  }

  // 转换毫米到像素
  mmToPx(mm) {
    return mm / 0.264583;
  }

  // 生成PDF
  async generatePDF(element, filename) {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // 获取元素尺寸
      const rect = element.getBoundingClientRect();
      const contentHeightPx = element.scrollHeight;
      const contentHeightMM = this.pxToMm(contentHeightPx);
      
      console.log('Content dimensions:', {
        width: rect.width,
        height: contentHeightPx,
        heightMM: contentHeightMM
      });

      // 计算页数
      const pages = this.calculatePages(contentHeightMM);
      console.log('Calculated pages:', pages);

      // 捕获内容
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: this.A4_WIDTH_PX,
        height: contentHeightPx,
        scrollX: 0,
        scrollY: 0,
        windowWidth: this.A4_WIDTH_PX,
        windowHeight: contentHeightPx,
        onclone: (clonedDoc) => {
          this.prepareCloneForPDF(clonedDoc, contentHeightPx);
        }
      });

      // 创建PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // 计算图片尺寸
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - this.MARGIN_MM * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 分页处理
      const pageHeightMM = pdfHeight - this.MARGIN_MM * 2;
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
          this.MARGIN_MM, 
          this.MARGIN_MM - position, 
          imgWidth, 
          imgHeight
        );
        position += pageHeight;
        heightLeft -= pageHeight;
      }

      // 保存文件
      pdf.save(filename);
      console.log('PDF generated successfully:', filename);

      return {
        success: true,
        pages: totalPages,
        filename
      };

    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // 准备克隆元素用于PDF生成
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

    // 处理表格
    const tables = clonedElement.querySelectorAll('table');
    tables.forEach(table => {
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '11px';
    });

    // 处理表格单元格
    const cells = clonedElement.querySelectorAll('td, th');
    cells.forEach(cell => {
      cell.style.padding = '8px';
      cell.style.border = '1px solid #ddd';
      cell.style.fontSize = '11px';
    });
  }

  // 生成文件名
  generateFilename(reportType) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${reportType}_Report_${timestamp}.pdf`;
  }
}

export default PDFExportHelper;
