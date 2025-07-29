import React, { useState, useEffect, useRef } from 'react';
import {
  Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem, TextField,
  FormControlLabel, Checkbox, Button, Box, CircularProgress, IconButton, Divider
} from '@mui/material';
import {
  BarChart as BarChartIcon, EventNote as EventNoteIcon, People as PeopleIcon,
  AttachMoney as AttachMoneyIcon, Analytics as AnalyticsIcon, ArrowForward as ArrowForwardIcon,
  PictureAsPdf as PictureAsPdfIcon, TableChart as TableChartIcon, GridOn as GridOnIcon,
  FileDownload as FileDownloadIcon, Close as CloseIcon, Business as BusinessIcon,
  PieChart as PieChartIcon, Visibility as VisibilityIcon, InsertChart as InsertChartIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';
import ReportChart from './ReportChart';

// 配置
const REPORT_CONFIG = {
  types: [
    { value: 'revenue', label: 'Revenue Report', icon: <AttachMoneyIcon />, description: 'Detailed revenue analysis and financial metrics' },
    { value: 'booking', label: 'Booking Analytics', icon: <EventNoteIcon />, description: 'Booking patterns, trends, and performance analysis' },
    { value: 'user', label: 'User Activity Report', icon: <PeopleIcon />, description: 'User engagement, growth, and activity patterns' }
  ],
  formats: [
    { value: 'pdf', label: 'PDF (Formal)', icon: <PictureAsPdfIcon />, color: '#e53e3e' },
    { value: 'excel', label: 'Excel (Analytical)', icon: <TableChartIcon />, color: '#38a169' },
    { value: 'csv', label: 'CSV (Raw Data)', icon: <GridOnIcon />, color: '#3182ce' }
  ],
  visualizationOptions: [
    { value: 'bar', label: 'Bar Charts', icon: <BarChartIcon /> },
    { value: 'line', label: 'Line Charts', icon: <InsertChartIcon /> },
    { value: 'pie', label: 'Pie Charts', icon: <PieChartIcon /> }
  ],
  sections: [
    { name: 'summary', label: 'Executive Summary', default: true },
    { name: 'trends', label: 'Trend Analysis', default: true },
    { name: 'breakdown', label: 'Detailed Breakdown', default: false },
    { name: 'insights', label: 'Key Insights', default: true }
  ],
  formattingOptions: [
    { name: 'includeHeaderFooter', label: 'Header & Footer', description: 'Include company header and page numbers' },
    { name: 'useBrandColors', label: 'Brand Colors', description: 'Use company colors in charts and tables' },
    { name: 'includeAppendix', label: 'Data Appendix', description: 'Include raw data tables in appendix' }
  ]
};

const ReportGenerator = ({ onGenerateReport, companyInfo }) => {
  // State
  const [reportType, setReportType] = useState('revenue');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [visualizationType, setVisualizationType] = useState('bar');
  const [reportSections, setReportSections] = useState(
    REPORT_CONFIG.sections.reduce((acc, section) => {
      acc[section.name] = section.default;
      return acc;
    }, {})
  );
  const [formattingOptions, setFormattingOptions] = useState({
    includeHeaderFooter: true,
    useBrandColors: true,
    includeAppendix: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // 真实数据状态
  const [reportData, setReportData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  
  // 导出PDF相关
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef(null);

  // 自动生成报告标题
  const generateReportTitle = () => {
    const reportTypeLabel = REPORT_CONFIG.types.find(t => t.value === reportType)?.label || 'Report';
    
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const endDate = new Date(dateRange.end).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      return `${reportTypeLabel} - ${startDate} to ${endDate}`;
    } else {
      return `${reportTypeLabel} - All Time`;
    }
  };

  // 当报告类型或日期范围改变时，自动更新标题
  useEffect(() => {
    const autoTitle = generateReportTitle();
    setReportTitle(autoTitle);
  }, [reportType, dateRange.start, dateRange.end]);

  // 数据转换函数
  const convertDataForCharts = (data) => {
    if (!data) return data;
    
    const converted = { ...data };
    
    // 转换趋势数据
    if (converted.trends) {
      // 转换每日收入数据
      if (converted.trends.dailyRevenue) {
        const revenueData = {};
        Object.entries(converted.trends.dailyRevenue).forEach(([key, value]) => {
          revenueData[key] = typeof value === 'object' ? value.doubleValue() : value;
        });
        converted.trends.dailyRevenue = revenueData;
      }
      
      // 转换每日预订数据
      if (converted.trends.dailyBookings) {
        const bookingData = {};
        Object.entries(converted.trends.dailyBookings).forEach(([key, value]) => {
          bookingData[key] = typeof value === 'object' ? value.longValue() : value;
        });
        converted.trends.dailyBookings = bookingData;
      }
      
      // 转换收入按状态分布
      if (converted.trends.revenueByStatus) {
        const statusData = {};
        Object.entries(converted.trends.revenueByStatus).forEach(([key, value]) => {
          statusData[key] = typeof value === 'object' ? value.doubleValue() : value;
        });
        converted.trends.revenueByStatus = statusData;
      }
      
      // 转换预订按状态分布
      if (converted.trends.bookingsByStatus) {
        const statusData = {};
        Object.entries(converted.trends.bookingsByStatus).forEach(([key, value]) => {
          statusData[key] = typeof value === 'object' ? value.longValue() : value;
        });
        converted.trends.bookingsByStatus = statusData;
      }
    }
    
    // 转换详细数据
    if (converted.breakdown) {
      // 转换顶级收入日
      if (converted.breakdown.topRevenueDays) {
        const revenueData = {};
        converted.breakdown.topRevenueDays.forEach(item => {
          if (item.date && item.revenue) {
            revenueData[item.date] = typeof item.revenue === 'object' ? item.revenue.doubleValue() : item.revenue;
          }
        });
        converted.breakdown.topRevenueDays = revenueData;
      }
      
      // 转换顶级预订日
      if (converted.breakdown.topBookingDays) {
        const bookingData = {};
        converted.breakdown.topBookingDays.forEach(item => {
          if (item.date && item.bookings) {
            bookingData[item.date] = typeof item.bookings === 'object' ? item.bookings.longValue() : item.bookings;
          }
        });
        converted.breakdown.topBookingDays = bookingData;
      }
      
      // 转换顶级活跃用户
      if (converted.breakdown.topActiveUsers) {
        const userData = {};
        converted.breakdown.topActiveUsers.forEach(item => {
          if (item.user && item.bookings) {
            userData[item.user] = typeof item.bookings === 'object' ? item.bookings.longValue() : item.bookings;
          }
        });
        converted.breakdown.topActiveUsers = userData;
      }
      
      // 转换按用户预订分布
      if (converted.breakdown.bookingsPerUser) {
        const userBookingData = {};
        Object.entries(converted.breakdown.bookingsPerUser).forEach(([key, value]) => {
          userBookingData[key] = typeof value === 'object' ? value.longValue() : value;
        });
        converted.breakdown.bookingsPerUser = userBookingData;
      }
    }
    
    // 转换趋势数据中的用户活动指标
    if (converted.trends) {
      // 转换活跃用户数
      if (converted.trends.activeUsers) {
        converted.trends.activeUsers = typeof converted.trends.activeUsers === 'object' ? 
          converted.trends.activeUsers.longValue() : converted.trends.activeUsers;
      }
      
      // 转换新用户数
      if (converted.trends.newUsers) {
        converted.trends.newUsers = typeof converted.trends.newUsers === 'object' ? 
          converted.trends.newUsers.longValue() : converted.trends.newUsers;
      }
      
      // 转换用户活动率
      if (converted.trends.userActivityRate) {
        converted.trends.userActivityRate = typeof converted.trends.userActivityRate === 'object' ? 
          converted.trends.userActivityRate.doubleValue() : converted.trends.userActivityRate;
      }
    }
    
    return converted;
  };

  // 获取真实数据
  const fetchReportData = async () => {
    if (!dateRange.start || !dateRange.end) return;
    
    setDataLoading(true);
    setError(null); // 清除之前的错误
    try {
      const token = UserService.getAdminToken();
      const response = await axios.get(`http://localhost:8081/api/admin/reports/${reportType}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      // 转换数据格式
      const convertedData = convertDataForCharts(response.data);
      console.log('User Activity Report Data:', {
        trends: convertedData.trends,
        breakdown: convertedData.breakdown,
        summary: convertedData.summary
      });
      setReportData(convertedData);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      // 只有在用户明确操作时才显示错误
      if (dateRange.start && dateRange.end) {
        setError('Failed to load report data. Please check your date range and try again.');
      }
    } finally {
      setDataLoading(false);
    }
  };

  // 当报表类型或日期范围改变时重新获取数据
  useEffect(() => {
    // 只有当两个日期都选择了才获取数据
    if (dateRange.start && dateRange.end) {
      // 添加一个小延迟，避免用户快速选择日期时的频繁请求
      const timeoutId = setTimeout(() => {
        fetchReportData();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [reportType, dateRange.start, dateRange.end]);

  // 生成报表数据
  const generateReportData = () => {
    const selectedSections = Object.keys(reportSections)
      .filter(key => reportSections[key])
      .map(key => REPORT_CONFIG.sections.find(s => s.name === key).label);

    return {
      metadata: {
        title: reportTitle || `${REPORT_CONFIG.types.find(t => t.value === reportType).label} - ${(companyInfo?.name || 'Company')}`,
        company: companyInfo,
        generatedAt: new Date().toISOString(),
        period: dateRange,
        sections: selectedSections,
        visualization: visualizationType,
        formatting: formattingOptions
      },
      configuration: {
        type: reportType,
        format: exportFormat || 'pdf'
      },
      content: reportData || {}
    };
  };

  // 生成报表
  const handleGenerate = async () => {
    if (!dateRange.start || !dateRange.end) {
      setError('Please select a valid date range');
      return;
    }
    if (new Date(dateRange.start) > new Date(dateRange.end)) {
      setError('End date must be after start date');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const reportData = generateReportData();
      await onGenerateReport(reportData);
    } catch (err) {
      setError('Report generation failed. Please try again.');
      console.error('Report error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 预览
  const handlePreview = () => {
    if (!dateRange.start || !dateRange.end) {
      setError('Please select date range');
      return;
    }
    setShowPreview(true);
    fetchReportData();
  };

  // 导出前端预览为PDF
  const exportPreviewToPDF = async () => {
    if (!previewRef.current) return;
    
    setIsExporting(true);
    try {
      console.log('Starting PDF export...');
      
      // 动态导入库
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      console.log('Libraries loaded, capturing content...');
      
      // 捕获内容
      const canvas = await html2canvas(previewRef.current, {
        scale: 2, // 提高分辨率
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4宽度 (210mm = 794px at 96 DPI)
        height: 1123, // A4高度 (297mm = 1123px at 96 DPI)
        onclone: (clonedDoc) => {
          // 确保克隆的元素保持A4样式和header/footer
          const clonedElement = clonedDoc.querySelector('[data-preview-content]');
          if (clonedElement) {
            clonedElement.style.width = '794px';
            clonedElement.style.minHeight = '1123px';
            clonedElement.style.backgroundColor = 'white';
            clonedElement.style.padding = '20px';
            clonedElement.style.boxSizing = 'border-box';
            clonedElement.style.position = 'relative';
            
            // 确保header和footer样式正确
            const header = clonedElement.querySelector('[data-header]');
            const footer = clonedElement.querySelector('[data-footer]');
            
            if (header) {
              header.style.borderBottom = '2px solid #667eea';
              header.style.paddingBottom = '16px';
              header.style.marginBottom = '24px';
            }
            
            if (footer) {
              footer.style.borderTop = '2px solid #667eea';
              footer.style.paddingTop = '16px';
              footer.style.marginTop = '32px';
              footer.style.position = 'absolute';
              footer.style.bottom = '20px';
              footer.style.left = '20px';
              footer.style.right = '20px';
            }
          }
        }
      });
      
      console.log('Content captured, creating PDF...');
      
      // 创建PDF (A4尺寸)
      const pdf = new jsPDF('p', 'mm', 'a4'); // 使用A4尺寸
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // 计算图片在A4页面上的尺寸
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 留出边距
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 如果内容超过一页，需要分页
      if (imgHeight > pdfHeight - 20) {
        const pages = Math.ceil(imgHeight / (pdfHeight - 20));
        let heightLeft = imgHeight;
        let position = 0;
        
        for (let i = 0; i < pages; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          const pageHeight = Math.min(pdfHeight - 20, heightLeft);
          pdf.addImage(imgData, 'JPEG', 10, 10 - position, imgWidth, imgHeight);
          position += pageHeight;
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      }
      
      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `${reportType}_Report_${timestamp}.pdf`;
      
      console.log('PDF created, saving...');
      pdf.save(filename);
      
      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // 渲染
  return (
    <Box sx={{ 
      maxWidth: '1100px', 
      width: '100%', 
      mx: 'auto',
      px: 2
    }}>
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
          <BusinessIcon sx={{ color: '#667eea', fontSize: 28, mr: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
            Advanced Report Generator
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          {/* 自动生成的标题显示 */}
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 3, 
              bgcolor: 'primary.50', 
              borderRadius: 2, 
              border: '1px solid',
              borderColor: 'primary.200',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)'
            }}>
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 'bold', letterSpacing: '1px' }}>
                Auto-Generated Report Title
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                {reportTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Updates automatically based on your selections
              </Typography>
            </Paper>
          </Grid>
          
          {/* 基本配置卡片 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2d3748', mb: 2 }}>
                Basic Configuration
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4} sx={{ minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      label="Report Type"
                    >
                      {REPORT_CONFIG.types.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ mr: 1.5 }}>{type.icon}</Box>
                            <Typography>{type.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4} sx={{ minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Export Format</InputLabel>
                    <Select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      label="Export Format"
                    >
                      {REPORT_CONFIG.formats.map((fmt) => (
                        <MenuItem key={fmt.value} value={fmt.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ mr: 1.5 }}>{fmt.icon}</Box>
                            <Typography>{fmt.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4} sx={{ minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Visualization Style</InputLabel>
                    <Select
                      value={visualizationType}
                      onChange={(e) => setVisualizationType(e.target.value)}
                      label="Visualization Style"
                    >
                      {REPORT_CONFIG.visualizationOptions.map((vis) => (
                        <MenuItem key={vis.value} value={vis.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ mr: 1.5 }}>{vis.icon}</Box>
                            <Typography>{vis.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {/* 日期范围 */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2d3748', mb: 1.5 }}>
                  Date Range
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={5} sx={{ minWidth: '180px' }}>
                    <TextField
                      fullWidth
                      type="date"
                      size="small"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      label="Start Date"
                      disabled={dataLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '60px' }}>
                    {dataLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <ArrowForwardIcon sx={{ color: '#a0aec0' }} />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={5} sx={{ minWidth: '180px' }}>
                    <TextField
                      fullWidth
                      type="date"
                      size="small"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      label="End Date"
                      disabled={dataLoading}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
          
          {/* 分隔线 - 更明显的分隔 */}
          <Grid item xs={12}>
            <Divider sx={{ my: 3, borderWidth: 2, borderColor: '#e2e8f0' }} />
          </Grid>
          
          {/* 报表部分 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2d3748', mb: 2 }}>
                Report Sections
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which sections to include in your report
              </Typography>
              <Grid container spacing={2}>
                {REPORT_CONFIG.sections.map((section) => (
                  <Grid item xs={12} sm={6} md={3} key={section.name}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={reportSections[section.name]}
                          onChange={(e) => setReportSections({
                            ...reportSections,
                            [section.name]: e.target.checked
                          })}
                          color="primary"
                        />
                      }
                      label={section.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
          
          {/* 格式化选项 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2d3748', mb: 2 }}>
                Formatting Options
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Customize the appearance and layout of your report
              </Typography>
              <Grid container spacing={2}>
                {REPORT_CONFIG.formattingOptions.map((option) => (
                  <Grid item xs={12} sm={4} key={option.name}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formattingOptions[option.name]}
                          onChange={(e) => setFormattingOptions({
                            ...formattingOptions,
                            [option.name]: e.target.checked
                          })}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
          {/* 预览 */}
          {showPreview && (
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: 3, 
                  mt: 2,
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Report Preview (A4 Size)</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<DownloadIcon />}
                      onClick={exportPreviewToPDF}
                      disabled={isExporting || dataLoading}
                      size="small"
                    >
                      {isExporting ? 'Exporting...' : 'Export Preview'}
                    </Button>
                    <IconButton onClick={() => setShowPreview(false)}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                {isExporting && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.contrastText">
                      Generating PDF from preview... This may take a few moments.
                    </Typography>
                  </Box>
                )}

                <div 
                  ref={previewRef} 
                  data-preview-content 
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '20px',
                    paddingBottom: '80px', // 增加底部间距，为footer留出空间
                    // A4内容区域设置
                    width: '100%',
                    minHeight: '250mm',
                    boxSizing: 'border-box',
                    position: 'relative'
                  }}
                >
                  {/* Header */}
                  {formattingOptions.includeHeaderFooter && (
                    <Box 
                      data-header
                      sx={{ 
                        borderBottom: '2px solid #667eea', 
                        pb: 2, 
                        mb: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 'bold', 
                          color: '#667eea',
                          mb: 1
                        }}>
                          {companyInfo?.name || 'Picklefy'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {companyInfo?.address || 'Professional Picklefy Court Management'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {companyInfo?.phone || 'Phone: +60 12-345 6789'} | {companyInfo?.email || 'Email: info@picklefy.com'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', minWidth: '200px' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                          Report Generated
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                          })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date().toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Report Content */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom sx={{ 
                      fontWeight: 'bold',
                      color: '#667eea',
                      mb: 1
                    }}>
                      {reportTitle}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  
                  {dataLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : reportData ? (
                  <>
                    {reportSections.summary && reportData.summary && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>Executive Summary</Typography>
                    <Grid container spacing={2}>
                          {reportData.summary.keyMetrics?.map((metric, index) => (
                        <Grid item xs={12} sm={4} key={index}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="subtitle2">{metric.name}</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{metric.value}</Typography>
                                <Typography variant="caption" color={metric.change?.startsWith('+') ? 'success.main' : 'error.main'}>
                              {metric.change}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                        {reportData.summary.highlights && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>Key Highlights:</Typography>
                            <ul>
                              {reportData.summary.highlights.map((highlight, index) => (
                                <li key={index}><Typography>{highlight}</Typography></li>
                              ))}
                            </ul>
                          </Box>
                        )}
                  </Box>
                )}
                    
                    {reportSections.trends && reportData.trends && (
                  <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">Trend Analysis</Typography>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Chart Type</InputLabel>
                            <Select
                              value={visualizationType}
                              onChange={(e) => setVisualizationType(e.target.value)}
                              label="Chart Type"
                            >
                              {REPORT_CONFIG.visualizationOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ mr: 1 }}>{option.icon}</Box>
                                    {option.label}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                        
                        {/* 收入趋势图表 */}
                        {reportData.trends.dailyRevenue && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>Revenue Trend</Typography>
                            <Box sx={{ height: 250, position: 'relative' }}>
                              <ReportChart
                                type={visualizationType}
                                data={reportData.trends.dailyRevenue}
                                title="Daily Revenue Trend"
                                useBrandColors={formattingOptions.useBrandColors}
                              />
                            </Box>
                          </Box>
                        )}
                        
                        {/* 预订趋势图表 */}
                        {reportData.trends.dailyBookings && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>Booking Trend</Typography>
                            <Box sx={{ height: 250, position: 'relative' }}>
                              <ReportChart
                                type={visualizationType}
                                data={reportData.trends.dailyBookings}
                                title="Daily Booking Trend"
                                useBrandColors={formattingOptions.useBrandColors}
                              />
                            </Box>
                          </Box>
                        )}
                        
                        {/* 收入按状态分布 */}
                        {reportData.trends.revenueByStatus && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>Revenue by Status</Typography>
                            <Box sx={{ height: 250, position: 'relative' }}>
                              <ReportChart
                                type="pie"
                                data={reportData.trends.revenueByStatus}
                                title="Revenue Distribution by Status"
                                useBrandColors={formattingOptions.useBrandColors}
                              />
                            </Box>
                          </Box>
                        )}
                        
                        {/* 预订按状态分布 */}
                        {reportData.trends.bookingsByStatus && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>Bookings by Status</Typography>
                            <Box sx={{ height: 250, position: 'relative' }}>
                              <ReportChart
                                type="pie"
                                data={reportData.trends.bookingsByStatus}
                                title="Booking Distribution by Status"
                                useBrandColors={formattingOptions.useBrandColors}
                              />
                            </Box>
                          </Box>
                        )}
                        
                        {/* 用户活动指标 */}
                        {(reportData.trends.activeUsers || reportData.trends.newUsers || reportData.trends.userActivityRate) && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>User Activity Metrics</Typography>
                            <Box sx={{ height: 250, position: 'relative' }}>
                              <ReportChart
                                type={visualizationType}
                                data={{
                                  "Active Users": reportData.trends.activeUsers || 0,
                                  "New Users": reportData.trends.newUsers || 0,
                                  "Activity Rate (%)": reportData.trends.userActivityRate || 0
                                }}
                                title="User Activity Overview"
                                useBrandColors={formattingOptions.useBrandColors}
                              />
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}
                    
                    {reportSections.breakdown && reportData.breakdown && (
                  <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>Detailed Breakdown</Typography>
                        
                        {/* 顶级收入日 */}
                        {reportData.breakdown.topRevenueDays && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>Top Revenue Days</Typography>
                            <Box sx={{ height: 250, position: 'relative' }}>
                              <ReportChart
                                type="bar"
                                data={reportData.breakdown.topRevenueDays}
                                title="Top Revenue Days"
                                useBrandColors={formattingOptions.useBrandColors}
                              />
                            </Box>
                          </Box>
                        )}
                        
                        {/* 顶级预订日 */}
                        {reportData.breakdown.topBookingDays && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>Top Booking Days</Typography>
                            <Box sx={{ height: 250, position: 'relative' }}>
                              <ReportChart
                                type="bar"
                                data={reportData.breakdown.topBookingDays}
                                title="Top Booking Days"
                                useBrandColors={formattingOptions.useBrandColors}
                              />
                            </Box>
                          </Box>
                        )}
                        
                        {/* 顶级活跃用户 */}
                        {reportData.breakdown.topActiveUsers && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>Top Active Users</Typography>
                            <Box sx={{ height: 250, position: 'relative' }}>
                              <ReportChart
                                type={visualizationType}
                                data={reportData.breakdown.topActiveUsers}
                                title="Top Active Users"
                                useBrandColors={formattingOptions.useBrandColors}
                              />
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}
                    
                    {reportSections.insights && reportData.insights && (
                  <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>Key Insights</Typography>
                    <ul>
                          {reportData.insights.map((insight, index) => (
                            <li key={index}><Typography>{insight}</Typography></li>
                      ))}
                    </ul>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No data available for the selected period</Typography>
                  </Box>
                )}

                  {/* Footer */}
                  {formattingOptions.includeHeaderFooter && (
                    <Box 
                      data-footer
                      sx={{ 
                        borderTop: '2px solid #667eea', 
                        pt: 2, 
                        mt: 4,
                        mb: 2,
                        pb: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        width: '100%',
                        backgroundColor: 'rgba(102, 126, 234, 0.02)',
                        borderRadius: '0 0 8px 8px'
                      }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          © {new Date().getFullYear()} {companyInfo?.name || 'Picklefy'}. All rights reserved.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {companyInfo?.website || 'www.picklefy.com'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                          Page 1 of 1
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Report ID: {reportType.toUpperCase()}-{new Date().getTime().toString().slice(-6)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </div>
              </Paper>
            </Grid>
          )}
          {/* 操作按钮 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', bgcolor: 'grey.50' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2d3748', mb: 2, textAlign: 'center' }}>
                Generate Report
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} sx={{ minWidth: '200px' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handlePreview}
                    disabled={dataLoading || !reportData}
                    startIcon={<VisibilityIcon />}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      borderRadius: 1.5,
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': {
                        borderColor: '#5c6bc0',
                        backgroundColor: 'rgba(102, 126, 234, 0.04)'
                      }
                    }}
                  >
                    Preview Report
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ minWidth: '200px' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleGenerate}
                    disabled={isGenerating || dataLoading || !reportData}
                    startIcon={isGenerating ? <CircularProgress size={24} /> : <FileDownloadIcon />}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      letterSpacing: '0.5px',
                      borderRadius: 1.5,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                        background: 'linear-gradient(90deg, #5c6bc0, #6a45a2)'
                      }
                    }}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                </Grid>
              </Grid>
              
              {/* 状态信息 */}
              {dataLoading && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading report data...
                  </Typography>
                </Box>
              )}
              {error && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ReportGenerator;