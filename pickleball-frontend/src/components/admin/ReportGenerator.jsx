import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem, TextField,
  FormControlLabel, Checkbox, Button, Box, CircularProgress, IconButton, Divider,
  Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
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
// import SimplePDFExporter from './SimplePDFExporter'; // Removed - file doesn't exist
import { usePageTheme } from '../../hooks/usePageTheme';

// 配置 - 简化版本
const REPORT_CONFIG = {
  types: [
    { value: 'monthly_revenue', label: 'Monthly Revenue Analysis', icon: <AttachMoneyIcon />, description: 'Comprehensive monthly revenue analysis excluding cancelled bookings' },
    { value: 'peak_hour_revenue', label: 'Peak Hour Revenue Analysis', icon: <AnalyticsIcon />, description: 'Revenue analysis by peak hours and time slots' },
    { value: 'total_revenue', label: 'Total Revenue Overview', icon: <BusinessIcon />, description: 'Complete revenue overview with growth metrics' },
    { value: 'growth_rate', label: 'Growth Rate Analysis', icon: <InsertChartIcon />, description: 'Revenue growth rate and trend analysis' },
    { value: 'venue_comparison', label: 'Court Performance Comparison', icon: <BarChartIcon />, description: 'Revenue comparison across different courts' },
    { value: 'venue_utilization', label: 'Court Utilization Report', icon: <BusinessIcon />, description: 'Comprehensive court utilization analysis and metrics' },
    { value: 'venue_ranking', label: 'Court Utilization Ranking', icon: <BarChartIcon />, description: 'Court performance ranking based on utilization rates' },
    { value: 'peak_off_peak', label: 'Peak/Off-Peak Period Analysis', icon: <AnalyticsIcon />, description: 'Analysis of peak and off-peak utilization patterns' },
    { value: 'venue_type_preference', label: 'Court Type Preference', icon: <PieChartIcon />, description: 'User preferences and booking patterns by court type' },
    { value: 'booking', label: 'Booking Analytics', icon: <EventNoteIcon />, description: 'Booking patterns, trends, and performance analysis' },
    { value: 'user', label: 'User Activity Report', icon: <PeopleIcon />, description: 'User engagement, growth, and activity patterns' }
  ],
  sections: [
    { name: 'summary', label: 'Executive Summary', default: true },
    { name: 'trends', label: 'Trend Analysis', default: true },
    { name: 'breakdown', label: 'Detailed Breakdown', default: false },
    { name: 'insights', label: 'Key Insights', default: true }
  ],
  formattingOptions: [
    { name: 'includeHeaderFooter', label: 'Header & Footer', description: 'Include company header and page numbers' },
    { name: 'useBrandColors', label: 'Brand Colors', description: 'Use company colors in charts and tables' }
  ]
};

// 根据报告类型自动选择最佳图表类型
const getOptimalChartType = (reportType) => {
  const chartTypeMap = {
    'monthly_revenue': 'line',
    'peak_hour_revenue': 'bar',
    'total_revenue': 'line',
    'growth_rate': 'line',
    'venue_comparison': 'bar',
    'venue_utilization': 'bar',
    'venue_ranking': 'bar',
    'peak_off_peak': 'bar',
    'venue_type_preference': 'pie',
    'booking': 'line',
    'user': 'line'
  };
  return chartTypeMap[reportType] || 'bar';
};

const ReportGenerator = ({ onGenerateReport, companyInfo }) => {
  // 移除usePageTheme调用，避免不必要的主题切换
  // usePageTheme('admin'); // 设置页面类型为admin
  // State - 简化版本
  const [reportType, setReportType] = useState('monthly_revenue');
  // 移除exportFormat，只支持PDF
  // 移除visualizationType，自动选择最佳图表
  const [includeDetailedAnalysis, setIncludeDetailedAnalysis] = useState(false);
  const [formattingOptions, setFormattingOptions] = useState({
    includeHeaderFooter: true,
    useBrandColors: true
  });

  // 自动计算报告部分
  const reportSections = {
    summary: true,
    trends: true,
    breakdown: includeDetailedAnalysis,
    insights: true
  };

  // 自动选择最佳图表类型
  const visualizationType = getOptimalChartType(reportType);

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

  // 添加分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageBreaks, setPageBreaks] = useState([]);
  
  // 当页面改变时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [reportType, dateRange.start, dateRange.end]);
  
  // 监听当前页面变化，用于调试
  useEffect(() => {
    console.log('Current page changed to:', currentPage, 'Total pages:', totalPages);
  }, [currentPage, totalPages]);

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

      // 转换每月收入数据
      if (converted.trends.monthlyRevenue) {
        const monthlyData = {};
        Object.entries(converted.trends.monthlyRevenue).forEach(([key, value]) => {
          monthlyData[key] = typeof value === 'object' ? value.doubleValue() : value;
        });
        converted.trends.monthlyRevenue = monthlyData;
      }

      // 转换每小时收入数据
      if (converted.trends.hourlyRevenue) {
        const hourlyData = {};
        Object.entries(converted.trends.hourlyRevenue).forEach(([key, value]) => {
          hourlyData[key] = typeof value === 'object' ? value.doubleValue() : value;
        });
        converted.trends.hourlyRevenue = hourlyData;
      }

      // 转换时间段收入数据
      if (converted.trends.timeSlotRevenue) {
        const timeSlotData = {};
        Object.entries(converted.trends.timeSlotRevenue).forEach(([key, value]) => {
          timeSlotData[key] = typeof value === 'object' ? value.doubleValue() : value;
        });
        converted.trends.timeSlotRevenue = timeSlotData;
      }

      // 转换增长率数据
      if (converted.trends.growthRates) {
        const growthData = {};
        Object.entries(converted.trends.growthRates).forEach(([key, value]) => {
          growthData[key] = typeof value === 'object' ? value.doubleValue() : value;
        });
        converted.trends.growthRates = growthData;
      }

      // 转换场地收入数据
      if (converted.trends.venueRevenue) {
        const venueData = {};
        Object.entries(converted.trends.venueRevenue).forEach(([key, value]) => {
          venueData[key] = typeof value === 'object' ? value.doubleValue() : value;
        });
        converted.trends.venueRevenue = venueData;
      }

      // 转换场地预订数据
      if (converted.trends.venueBookings) {
        const venueBookingData = {};
        Object.entries(converted.trends.venueBookings).forEach(([key, value]) => {
          venueBookingData[key] = typeof value === 'object' ? value.longValue() : value;
        });
        converted.trends.venueBookings = venueBookingData;
      }

      // 转换场地利用率数据
      if (converted.trends.venueUtilization) {
        const utilizationData = {};
        Object.entries(converted.trends.venueUtilization).forEach(([key, value]) => {
          utilizationData[key] = typeof value === 'object' ? value.doubleValue() : value;
        });
        converted.trends.venueUtilization = utilizationData;
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

      // 转换顶级收入月
      if (converted.breakdown.topRevenueMonths) {
        const monthlyData = {};
        converted.breakdown.topRevenueMonths.forEach(item => {
          if (item.month && item.revenue) {
            monthlyData[item.month] = typeof item.revenue === 'object' ? item.revenue.doubleValue() : item.revenue;
          }
        });
        converted.breakdown.topRevenueMonths = monthlyData;
      }

      // 转换高峰小时
      if (converted.breakdown.peakHours) {
        const peakData = {};
        converted.breakdown.peakHours.forEach(item => {
          if (item.hour && item.revenue) {
            peakData[item.hour] = typeof item.revenue === 'object' ? item.revenue.doubleValue() : item.revenue;
          }
        });
        converted.breakdown.peakHours = peakData;
      }

      // 转换顶级场地
      if (converted.breakdown.topVenues) {
        const venueData = {};
        converted.breakdown.topVenues.forEach(item => {
          if (item.venue && item.revenue) {
            venueData[item.venue] = typeof item.revenue === 'object' ? item.revenue.doubleValue() : item.revenue;
          }
        });
        converted.breakdown.topVenues = venueData;
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
      const token = UserService.getAdminToken() || UserService.getToken();

      // 根据报告类型选择对应的API端点
      let endpoint = '';
      switch (reportType) {
        case 'monthly_revenue':
          endpoint = 'monthly-revenue';
          break;
        case 'peak_hour_revenue':
          endpoint = 'peak-hour-revenue';
          break;
        case 'total_revenue':
          endpoint = 'total-revenue';
          break;
        case 'growth_rate':
          endpoint = 'growth-rate';
          break;
        case 'venue_comparison':
          endpoint = 'venue-comparison';
          break;
        case 'venue_utilization':
          endpoint = 'venue-utilization';
          break;
        case 'venue_ranking':
          endpoint = 'venue-ranking';
          break;
        case 'peak_off_peak':
          endpoint = 'peak-off-peak';
          break;
        case 'venue_type_preference':
          endpoint = 'venue-type-preference';
          break;
        case 'booking':
          endpoint = 'booking';
          break;
        case 'user':
          endpoint = 'user';
          break;
        default:
          endpoint = 'monthly-revenue';
      }

      const response = await axios.get(`http://localhost:8081/api/admin/reports/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      // 转换数据格式
      const convertedData = convertDataForCharts(response.data);
      console.log(`${reportType} Report Data:`, {
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
        format: 'pdf'
      },
      content: reportData || {}
    };
  };

  // 生成报表


  // 预览
  const handlePreview = () => {
    if (!dateRange.start || !dateRange.end) {
      setError('Please select date range');
      return;
    }
    setShowPreview(true);
    fetchReportData();
  };

    // 计算分页
  const calculatePageBreaks = useCallback(() => {
    if (!previewRef.current) return;
    
    const content = previewRef.current;
    const contentHeight = content.scrollHeight;
    
        // 簡化分頁邏輯 - 暫時只顯示一頁，讓用戶可以滾動查看完整內容
    const pages = 1;
    const shouldPaginate = false;
    
    setTotalPages(pages);
    
    // 计算页面断点 - 簡化版本
    const breaks = [];
    setPageBreaks(breaks);
    
    console.log('Page calculation:', {
      contentHeight,
      pages,
      breaks,
      shouldPaginate,
      currentPage: currentPage
    });
  }, [currentPage]);

  // 更新预览时重新计算分页
  useEffect(() => {
    if (showPreview && reportData) {
      // 延迟计算，确保内容已渲染
      setTimeout(() => {
        calculatePageBreaks();
        // 重置到第一页
        setCurrentPage(1);
      }, 200);
    }
  }, [showPreview, reportData, calculatePageBreaks]);

  // 简化的导出处理
  const handleExport = (exporting) => {
    setIsExporting(exporting);
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
                <Grid item xs={12} md={6} sx={{ minWidth: '200px' }}>
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

                <Grid item xs={12} md={6} sx={{ minWidth: '200px' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeDetailedAnalysis}
                        onChange={(e) => setIncludeDetailedAnalysis(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Include Detailed Analysis"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Adds detailed breakdown and data tables
                  </Typography>
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
                Report Content
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your report will include: Executive Summary, Trend Analysis, and Key Insights
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeDetailedAnalysis}
                      onChange={(e) => setIncludeDetailedAnalysis(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Include Detailed Analysis"
                />
                <Typography variant="caption" color="text.secondary">
                  Adds detailed breakdown and data tables
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* 格式化选项 - 简化版本 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2d3748', mb: 2 }}>
                Report Style
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Professional formatting with company branding
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formattingOptions.includeHeaderFooter}
                      onChange={(e) => setFormattingOptions({
                        ...formattingOptions,
                        includeHeaderFooter: e.target.checked
                      })}
                      color="primary"
                    />
                  }
                  label="Header & Footer"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formattingOptions.useBrandColors}
                      onChange={(e) => setFormattingOptions({
                        ...formattingOptions,
                        useBrandColors: e.target.checked
                      })}
                      color="primary"
                    />
                  }
                  label="Brand Colors"
                />
              </Box>
            </Paper>
          </Grid>
          {/* 预览 */}
          {showPreview && (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  mt: 2,
                  // A4尺寸设置 - 更像打印機效果
                  width: '100%',
                  maxWidth: '900px',
                  margin: '0 auto',
                  backgroundColor: '#f5f5f5', // 灰色背景模擬打印機
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  borderRadius: '8px'
                }}
              >
                {/* 打印機效果邊框 */}
                <Box sx={{
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 0 1px #ddd',
                  position: 'relative'
                }}>
                  {/* 打印機進紙口效果 */}
                  <Box sx={{
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderBottom: '1px solid #ccc',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60px',
                      height: '4px',
                      backgroundColor: '#999',
                      borderRadius: '2px'
                    }
                  }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, p: 3, borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
                    <Typography variant="h6" sx={{ color: '#667eea', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      📄 Report Preview (Scroll to view full content)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {false && totalPages > 1 && (
                        <Typography variant="body2" color="text.secondary" sx={{
                          backgroundColor: '#667eea',
                          color: 'white',
                          px: 2,
                          py: 1,
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          📖 Page {currentPage} of {totalPages}
                        </Typography>
                      )}
                      {/* 調試信息 - 暫時隱藏 */}
                      {false && process.env.NODE_ENV === 'development' && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ 
                            backgroundColor: '#f0f0f0', 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: '4px',
                            fontSize: '10px',
                            color: '#666'
                          }}>
                            Debug: {currentPage}/{totalPages}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              console.log('Test button clicked');
                              setCurrentPage(currentPage === 1 ? 2 : 1);
                            }}
                            sx={{ fontSize: '10px', px: 1, py: 0.5 }}
                          >
                            Test
                          </Button>
                        </Box>
                      )}
                      <IconButton
                        onClick={() => setShowPreview(false)}
                        sx={{
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e0e0e0',
                          '&:hover': { 
                            backgroundColor: '#e3f2fd',
                            borderColor: '#667eea'
                          }
                        }}
                      >
                        <CloseIcon sx={{ fontSize: '20px', color: '#666' }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {isExporting && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, mx: 2 }}>
                      <Typography variant="body2" color="info.contrastText">
                        🔄 Generating PDF from preview... This may take a few moments.
                      </Typography>
                    </Box>
                  )}

                  {/* A4 內容區域 */}
                  <Box sx={{
                    backgroundColor: 'white',
                    margin: '0 8px 8px 8px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    overflow: 'auto',
                    position: 'relative',
                    maxHeight: '1000px'
                  }}>
                    <div
                      ref={previewRef}
                      data-preview-content
                      style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        paddingBottom: '40px',
                        width: '100%',
                        minHeight: 'auto',
                        boxSizing: 'border-box',
                        position: 'relative',
                        overflow: 'visible',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '12px',
                        lineHeight: '1.4',
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)',
                        backgroundSize: '20px 20px'
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
                      <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom sx={{
                          fontWeight: 'bold',
                          color: '#667eea',
                          mb: 2,
                          textAlign: 'center'
                        }}>
                          {reportTitle}
                        </Typography>
                        <Divider sx={{ my: 3, borderWidth: 2, borderColor: '#667eea' }} />
                      </Box>

                                              {dataLoading ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 6 }}>
                            <CircularProgress size={40} sx={{ color: '#667eea', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                              Loading report data...
                            </Typography>
                          </Box>
                      ) : reportData ? (
                        <>
                                                     {reportSections.summary && reportData.summary && (
                             <Box sx={{ mb: 4 }}>
                               <Typography variant="h5" gutterBottom sx={{ 
                                 color: '#667eea', 
                                 fontWeight: 'bold',
                                 borderBottom: '2px solid #667eea',
                                 pb: 1,
                                 mb: 3
                               }}>
                                 📊 Executive Summary
                               </Typography>
                                                             <Grid container spacing={3}>
                                 {reportData.summary.keyMetrics?.map((metric, index) => (
                                   <Grid item xs={12} sm={4} key={index}>
                                     <Paper sx={{ 
                                       p: 3, 
                                       textAlign: 'center',
                                       borderRadius: '12px',
                                       boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                       border: '1px solid #e0e0e0',
                                       transition: 'transform 0.2s ease-in-out',
                                       '&:hover': {
                                         transform: 'translateY(-2px)',
                                         boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                                       }
                                     }}>
                                       <Typography variant="subtitle1" sx={{ 
                                         fontWeight: 'bold', 
                                         color: '#667eea',
                                         mb: 1
                                       }}>
                                         {metric.name}
                                       </Typography>
                                       <Typography variant="h4" sx={{ 
                                         fontWeight: 'bold',
                                         color: '#2d3748',
                                         mb: 1
                                       }}>
                                         {metric.value}
                                       </Typography>
                                       <Typography variant="body2" sx={{ 
                                         color: metric.change?.startsWith('+') ? '#38a169' : '#e53e3e',
                                         fontWeight: 'bold',
                                         backgroundColor: metric.change?.startsWith('+') ? 'rgba(56, 161, 105, 0.1)' : 'rgba(229, 62, 62, 0.1)',
                                         px: 2,
                                         py: 0.5,
                                         borderRadius: '12px',
                                         display: 'inline-block'
                                       }}>
                                         {metric.change}
                                       </Typography>
                                     </Paper>
                                   </Grid>
                                 ))}
                               </Grid>
                                                             {reportData.summary.highlights && (
                                 <Box sx={{ mt: 4 }}>
                                   <Typography variant="h6" gutterBottom sx={{ 
                                     color: '#667eea', 
                                     fontWeight: 'bold',
                                     mb: 2
                                   }}>
                                     ✨ Key Highlights
                                   </Typography>
                                   <Box sx={{ 
                                     backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                     borderRadius: '8px',
                                     p: 3
                                   }}>
                                     <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                       {reportData.summary.highlights.map((highlight, index) => (
                                         <li key={index}>
                                           <Typography sx={{ 
                                             mb: 1,
                                             lineHeight: 1.6,
                                             color: '#2d3748'
                                           }}>
                                             {highlight}
                                           </Typography>
                                         </li>
                                       ))}
                                     </ul>
                                   </Box>
                                 </Box>
                               )}
                            </Box>
                          )}

                                                     {reportSections.trends && reportData.trends && (
                             <Box sx={{ mb: 3 }}>
                               <Box sx={{ mb: 3 }}>
                                 <Typography variant="h5" sx={{ 
                                   color: '#667eea', 
                                   fontWeight: 'bold',
                                   borderBottom: '2px solid #667eea',
                                   pb: 1,
                                   mb: 3
                                 }}>
                                   📈 Trend Analysis
                                 </Typography>
                               </Box>

                              {/* 收入趋势图表 */}
                              {reportData.trends.dailyRevenue && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle1" gutterBottom>Revenue Trend</Typography>
                                                                     <Box sx={{
                                     height: 200,
                                     position: 'relative',
                                     width: '100%',
                                     overflow: 'hidden',
                                     border: '1px solid #e0e0e0',
                                     borderRadius: '8px',
                                     padding: '12px',
                                     backgroundColor: '#fafafa'
                                   }}>
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
                                   <Typography variant="subtitle1" gutterBottom>Reservation Activity Trend</Typography>
                                   <Box sx={{
                                     height: 250,
                                     position: 'relative',
                                     width: '100%',
                                     overflow: 'hidden',
                                     border: '1px solid #e0e0e0',
                                     borderRadius: '8px',
                                     padding: '12px',
                                     backgroundColor: '#fafafa'
                                   }}>
                                    <ReportChart
                                      type={visualizationType}
                                      data={reportData.trends.dailyBookings}
                                      title="Daily Reservation Activity"
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

                              {/* 每月收入趋势图表 */}
                              {reportData.trends.monthlyRevenue && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle1" gutterBottom>Monthly Revenue Trend</Typography>
                                  <Box sx={{ height: 250, position: 'relative' }}>
                                    <ReportChart
                                      type={visualizationType}
                                      data={reportData.trends.monthlyRevenue}
                                      title="Monthly Revenue Trend"
                                      useBrandColors={formattingOptions.useBrandColors}
                                    />
                                  </Box>
                                </Box>
                              )}

                              {/* 每小时收入趋势图表 */}
                              {reportData.trends.hourlyRevenue && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle1" gutterBottom>Hourly Revenue Distribution</Typography>
                                  <Box sx={{ height: 250, position: 'relative' }}>
                                    <ReportChart
                                      type={visualizationType}
                                      data={reportData.trends.hourlyRevenue}
                                      title="Hourly Revenue Distribution"
                                      useBrandColors={formattingOptions.useBrandColors}
                                    />
                                  </Box>
                                </Box>
                              )}

                              {/* 时间段收入分布图表 */}
                              {reportData.trends.timeSlotRevenue && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle1" gutterBottom>Revenue by Time Slots</Typography>
                                  <Box sx={{ height: 250, position: 'relative' }}>
                                    <ReportChart
                                      type="pie"
                                      data={reportData.trends.timeSlotRevenue}
                                      title="Revenue Distribution by Time Slots"
                                      useBrandColors={formattingOptions.useBrandColors}
                                    />
                                  </Box>
                                </Box>
                              )}

                              {/* 增长率趋势图表 */}
                              {reportData.trends.growthRates && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle1" gutterBottom>Growth Rate Analysis</Typography>
                                  <Box sx={{ height: 250, position: 'relative' }}>
                                    <ReportChart
                                      type={visualizationType}
                                      data={reportData.trends.growthRates}
                                      title="Revenue Growth Rate Trend"
                                      useBrandColors={formattingOptions.useBrandColors}
                                    />
                                  </Box>
                                </Box>
                              )}

                              {/* 场地收入比较图表 */}
                              {reportData.trends.venueRevenue && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle1" gutterBottom>Court Revenue Comparison</Typography>
                                  <Box sx={{ height: 250, position: 'relative' }}>
                                    <ReportChart
                                      type="bar"
                                      data={reportData.trends.venueRevenue}
                                      title="Revenue by Court"
                                      useBrandColors={formattingOptions.useBrandColors}
                                    />
                                  </Box>
                                </Box>
                              )}

                              {/* 场地利用率图表 */}
                              {reportData.trends.venueUtilization && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle1" gutterBottom>Court Utilization Rate</Typography>
                                  <Box sx={{ height: 250, position: 'relative' }}>
                                    <ReportChart
                                      type="pie"
                                      data={reportData.trends.venueUtilization}
                                      title="Court Utilization Distribution"
                                      useBrandColors={formattingOptions.useBrandColors}
                                    />
                                  </Box>
                                </Box>
                              )}

                              {/* 场地利用率报告专用图表 */}
                              {reportType === 'venue_utilization' && reportData.trends && (
                                <>
                                  {/* 场地利用率趋势 */}
                                  {reportData.trends.utilizationTrend && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" gutterBottom>Utilization Trend Over Time</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type={visualizationType}
                                          data={reportData.trends.utilizationTrend}
                                          title="Court Utilization Trend"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}

                                  {/* 场地利用率统计 */}
                                  {reportData.trends.utilizationStats && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" gutterBottom>Utilization Statistics</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="bar"
                                          data={reportData.trends.utilizationStats}
                                          title="Court Utilization Statistics"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}
                                </>
                              )}

                              {/* 场地排名报告专用图表 */}
                              {reportType === 'venue_ranking' && reportData.trends && (
                                <>
                                  {/* 场地利用率排名 */}
                                  {reportData.trends.venueRanking && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" gutterBottom>Court Utilization Ranking</Typography>
                                      <Box sx={{
                                        height: 300,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="bar"
                                          data={reportData.trends.venueRanking}
                                          title="Court Utilization Ranking"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}

                                  {/* 场地性能指标 */}
                                  {reportData.trends.venuePerformance && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" gutterBottom>Court Performance Metrics</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="bar"
                                          data={reportData.trends.venuePerformance}
                                          title="Court Performance Metrics"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}
                                </>
                              )}

                              {/* 高峰/非高峰分析报告专用图表 */}
                              {reportType === 'peak_off_peak' && reportData.trends && (
                                <>
                                  {/* 高峰时段利用率 */}
                                  {reportData.trends.peakUtilization && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" gutterBottom>Peak Period Utilization</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type={visualizationType}
                                          data={reportData.trends.peakUtilization}
                                          title="Peak Period Utilization"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}

                                  {/* 非高峰时段利用率 */}
                                  {reportData.trends.offPeakUtilization && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" gutterBottom>Off-Peak Period Utilization</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type={visualizationType}
                                          data={reportData.trends.offPeakUtilization}
                                          title="Off-Peak Period Utilization"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}

                                  {/* 高峰vs非高峰对比 */}
                                  {reportData.trends.peakVsOffPeak && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" gutterBottom>Peak vs Off-Peak Comparison</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="bar"
                                          data={reportData.trends.peakVsOffPeak}
                                          title="Peak vs Off-Peak Utilization"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}
                                </>
                              )}

                              {/* 场地类型偏好报告专用图表 */}
                              {reportType === 'venue_type_preference' && reportData.trends && (
                                <>
                                  {/* 场地类型偏好分布 */}
                                  {reportData.trends.venueTypePreference && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" gutterBottom>Court Type Preference Distribution</Typography>
                                      <Box sx={{
                                        height: 300,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="pie"
                                          data={reportData.trends.venueTypePreference}
                                          title="Court Type Preference"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}

                                  {/* 场地类型利用率对比 */}
                                  {reportData.trends.venueTypeUtilization && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" gutterBottom>Court Type Utilization Comparison</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="bar"
                                          data={reportData.trends.venueTypeUtilization}
                                          title="Court Type Utilization"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}

                                  {/* 场地类型预订趋势 */}
                                  {reportData.trends.venueTypeTrend && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" gutterBottom>Court Type Booking Trend</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type={visualizationType}
                                          data={reportData.trends.venueTypeTrend}
                                          title="Court Type Booking Trend"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}
                                </>
                              )}
                            </Box>
                          )}

                                                     {reportSections.breakdown && reportData.breakdown && (
                             <Box sx={{ mb: 4 }}>
                               <Typography variant="h5" gutterBottom sx={{ 
                                 color: '#667eea', 
                                 fontWeight: 'bold',
                                 borderBottom: '2px solid #667eea',
                                 pb: 1,
                                 mb: 3
                               }}>
                                 📋 Detailed Breakdown
                               </Typography>

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

                              {/* 顶级收入月 */}
                              {reportData.breakdown.topRevenueMonths && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle1" gutterBottom>Top Revenue Months</Typography>
                                  <Box sx={{
                                    height: 250,
                                    position: 'relative',
                                    width: '100%',
                                    overflow: 'hidden',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    backgroundColor: '#fafafa'
                                  }}>
                                    <ReportChart
                                      type="bar"
                                      data={reportData.breakdown.topRevenueMonths}
                                      title="Top Revenue Months"
                                      useBrandColors={formattingOptions.useBrandColors}
                                    />
                                  </Box>
                                  {/* 数据表格 */}
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>Data Table</Typography>
                                    <TableContainer component={Paper} sx={{ maxHeight: 150 }}>
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
                                </Box>
                              )}

                              {/* 高峰小时 */}
                              {reportData.breakdown.peakHours && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle1" gutterBottom>Peak Revenue Hours</Typography>
                                  <Box sx={{
                                    height: 250,
                                    position: 'relative',
                                    width: '100%',
                                    overflow: 'hidden',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    backgroundColor: '#fafafa'
                                  }}>
                                    <ReportChart
                                      type="bar"
                                      data={reportData.breakdown.peakHours}
                                      title="Peak Revenue Hours"
                                      useBrandColors={formattingOptions.useBrandColors}
                                    />
                                  </Box>
                                  {/* 数据表格 */}
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>Data Table</Typography>
                                    <TableContainer component={Paper} sx={{ maxHeight: 150 }}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell>Hour</TableCell>
                                            <TableCell align="right">Revenue (RM)</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {Object.entries(reportData.breakdown.peakHours).map(([hour, revenue]) => (
                                            <TableRow key={hour}>
                                              <TableCell>{hour}</TableCell>
                                              <TableCell align="right">RM {revenue.toLocaleString()}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </Box>
                                </Box>
                              )}

                              {/* 顶级场地 */}
                              {reportData.breakdown.topVenues && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle1" gutterBottom>Top Performing Courts</Typography>
                                  <Box sx={{
                                    height: 250,
                                    position: 'relative',
                                    width: '100%',
                                    overflow: 'hidden',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    backgroundColor: '#fafafa'
                                  }}>
                                    <ReportChart
                                      type="bar"
                                      data={reportData.breakdown.topVenues}
                                      title="Top Performing Courts"
                                      useBrandColors={formattingOptions.useBrandColors}
                                    />
                                  </Box>
                                </Box>
                              )}

                              {/* 场地利用率报告详细分析 */}
                              {reportType === 'venue_utilization' && reportData.breakdown && (
                                <>
                                  {/* 场地利用率详细数据 */}
                                  {reportData.breakdown.venueUtilizationDetails && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle1" gutterBottom>Court Utilization Details</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="bar"
                                          data={reportData.breakdown.venueUtilizationDetails}
                                          title="Court Utilization Details"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                      {/* 数据表格 */}
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="subtitle2" gutterBottom>Data Table</Typography>
                                        <TableContainer component={Paper} sx={{ maxHeight: 150 }}>
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow>
                                                <TableCell>Court</TableCell>
                                                <TableCell align="right">Utilization Rate (%)</TableCell>
                                                <TableCell align="right">Total Hours</TableCell>
                                                <TableCell align="right">Booked Hours</TableCell>
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {Object.entries(reportData.breakdown.venueUtilizationDetails).map(([venue, data]) => (
                                                <TableRow key={venue}>
                                                  <TableCell>{venue}</TableCell>
                                                  <TableCell align="right">{data.utilizationRate}%</TableCell>
                                                  <TableCell align="right">{data.totalHours}</TableCell>
                                                  <TableCell align="right">{data.bookedHours}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </TableContainer>
                                      </Box>
                                    </Box>
                                  )}
                                </>
                              )}

                              {/* 场地排名报告详细分析 */}
                              {reportType === 'venue_ranking' && reportData.breakdown && (
                                <>
                                  {/* 场地排名详细数据 */}
                                  {reportData.breakdown.venueRankingDetails && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle1" gutterBottom>Court Ranking Details</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="bar"
                                          data={reportData.breakdown.venueRankingDetails}
                                          title="Court Ranking Details"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                      {/* 数据表格 */}
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="subtitle2" gutterBottom>Data Table</Typography>
                                        <TableContainer component={Paper} sx={{ maxHeight: 150 }}>
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow>
                                                <TableCell>Rank</TableCell>
                                                <TableCell>Court</TableCell>
                                                <TableCell align="right">Utilization Rate (%)</TableCell>
                                                <TableCell align="right">Performance Score</TableCell>
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {Object.entries(reportData.breakdown.venueRankingDetails).map(([venue, data], index) => (
                                                <TableRow key={venue}>
                                                  <TableCell>{index + 1}</TableCell>
                                                  <TableCell>{venue}</TableCell>
                                                  <TableCell align="right">{data.utilizationRate}%</TableCell>
                                                  <TableCell align="right">{data.performanceScore}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </TableContainer>
                                      </Box>
                                    </Box>
                                  )}
                                </>
                              )}

                              {/* 高峰/非高峰分析报告详细分析 */}
                              {reportType === 'peak_off_peak' && reportData.breakdown && (
                                <>
                                  {/* 高峰时段详细数据 */}
                                  {reportData.breakdown.peakPeriodDetails && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle1" gutterBottom>Peak Period Details</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="bar"
                                          data={reportData.breakdown.peakPeriodDetails}
                                          title="Peak Period Details"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}

                                  {/* 非高峰时段详细数据 */}
                                  {reportData.breakdown.offPeakPeriodDetails && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle1" gutterBottom>Off-Peak Period Details</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="bar"
                                          data={reportData.breakdown.offPeakPeriodDetails}
                                          title="Off-Peak Period Details"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                    </Box>
                                  )}
                                </>
                              )}

                              {/* 场地类型偏好报告详细分析 */}
                              {reportType === 'venue_type_preference' && reportData.breakdown && (
                                <>
                                  {/* 场地类型偏好详细数据 */}
                                  {reportData.breakdown.venueTypePreferenceDetails && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle1" gutterBottom>Court Type Preference Details</Typography>
                                      <Box sx={{
                                        height: 250,
                                        position: 'relative',
                                        width: '100%',
                                        overflow: 'visible',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: '#fafafa'
                                      }}>
                                        <ReportChart
                                          type="bar"
                                          data={reportData.breakdown.venueTypePreferenceDetails}
                                          title="Court Type Preference Details"
                                          useBrandColors={formattingOptions.useBrandColors}
                                        />
                                      </Box>
                                      {/* 数据表格 */}
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="subtitle2" gutterBottom>Data Table</Typography>
                                        <TableContainer component={Paper} sx={{ maxHeight: 150 }}>
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow>
                                                <TableCell>Court Type</TableCell>
                                                <TableCell align="right">Booking Count</TableCell>
                                                <TableCell align="right">Utilization Rate (%)</TableCell>
                                                <TableCell align="right">Average Rating</TableCell>
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {Object.entries(reportData.breakdown.venueTypePreferenceDetails).map(([venueType, data]) => (
                                                <TableRow key={venueType}>
                                                  <TableCell>{venueType}</TableCell>
                                                  <TableCell align="right">{data.bookingCount}</TableCell>
                                                  <TableCell align="right">{data.utilizationRate}%</TableCell>
                                                  <TableCell align="right">{data.averageRating}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </TableContainer>
                                      </Box>
                                    </Box>
                                  )}
                                </>
                              )}
                            </Box>
                          )}

                                                     {reportSections.insights && reportData.insights && (
                             <Box sx={{ mb: 4 }}>
                               <Typography variant="h5" gutterBottom sx={{ 
                                 color: '#667eea', 
                                 fontWeight: 'bold',
                                 borderBottom: '2px solid #667eea',
                                 pb: 1,
                                 mb: 3
                               }}>
                                 💡 Key Insights
                               </Typography>
                                                             <Box sx={{ 
                                 backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                 borderRadius: '8px',
                                 p: 3
                               }}>
                                 <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                   {reportData.insights.map((insight, index) => (
                                     <li key={index}>
                                       <Typography sx={{ 
                                         mb: 1,
                                         lineHeight: 1.6,
                                         color: '#2d3748'
                                       }}>
                                         {insight}
                                       </Typography>
                                     </li>
                                   ))}
                                 </ul>
                               </Box>
                            </Box>
                          )}
                        </>
                                              ) : (
                          <Box sx={{ p: 6, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                              📊 No Data Available
                            </Typography>
                            <Typography color="text.secondary">
                              No data available for the selected period. Please try a different date range.
                            </Typography>
                          </Box>
                        )}

                                              {/* Footer */}
                        {formattingOptions.includeHeaderFooter && (
                          <Box
                            data-footer
                            sx={{
                              borderTop: '2px solid #667eea',
                              pt: 3,
                              mt: 6,
                              mb: 2,
                              pb: 3,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              position: 'relative',
                              width: '100%',
                              backgroundColor: 'rgba(102, 126, 234, 0.05)',
                              borderRadius: '8px',
                              minHeight: '80px',
                              flexWrap: 'wrap',
                              gap: 2,
                              px: 3
                            }}
                          >
                                                      <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word', fontWeight: 'medium' }}>
                                © {new Date().getFullYear()} {companyInfo?.name || 'Picklefy'}. All rights reserved.
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word', mt: 0.5 }}>
                                🌐 {companyInfo?.website || 'www.picklefy.com'}
                              </Typography>
                            </Box>
                                                      <Box sx={{
                              flex: '0 0 auto',
                              textAlign: 'right',
                              minWidth: '200px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              wordBreak: 'keep-all'
                            }}>
                                                           <Typography variant="body2" color="text.secondary" sx={{
                               whiteSpace: 'nowrap',
                               fontSize: '12px',
                               fontWeight: 'medium',
                               color: '#667eea'
                             }}>
                               📄 Page {currentPage} of {totalPages}
                             </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{
                                whiteSpace: 'nowrap',
                                fontSize: '11px',
                                mt: 0.5
                              }}>
                                🆔 {reportType.toUpperCase()}-{new Date().getTime().toString().slice(-6)}
                              </Typography>
                            </Box>
                        </Box>
                      )}
                    </div>

                                         {/* 分頁導航按鈕 - 暫時隱藏，讓用戶可以滾動查看完整內容 */}
                     {false && totalPages > 1 && (
                       <Box sx={{
                         display: 'flex',
                         justifyContent: 'center',
                         alignItems: 'center',
                         gap: 2,
                         p: 3,
                         borderTop: '1px solid #eee',
                         backgroundColor: '#f8f9fa',
                         borderRadius: '0 0 4px 4px'
                       }}>
                                                 <Button
                           variant="outlined"
                           size="small"
                           disabled={currentPage === 1}
                           onClick={() => {
                             console.log('Previous clicked, current page:', currentPage);
                             setCurrentPage(Math.max(1, currentPage - 1));
                           }}
                           startIcon={<ArrowForwardIcon sx={{ transform: 'rotate(180deg)' }} />}
                           sx={{
                             borderRadius: '20px',
                             px: 3,
                             py: 1,
                             fontWeight: 600,
                             borderColor: '#667eea',
                             color: '#667eea',
                             '&:hover': {
                               borderColor: '#5c6bc0',
                               backgroundColor: 'rgba(102, 126, 234, 0.04)'
                             },
                             '&:disabled': { 
                               opacity: 0.5,
                               borderColor: '#ccc',
                               color: '#ccc'
                             }
                           }}
                         >
                           Previous
                         </Button>

                        <Box sx={{
                          display: 'flex',
                          gap: 1,
                          alignItems: 'center'
                        }}>
                                                     {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                             <Button
                               key={page}
                               variant={currentPage === page ? "contained" : "outlined"}
                               size="small"
                               onClick={() => {
                                 console.log('Page clicked:', page, 'current page:', currentPage);
                                 setCurrentPage(page);
                               }}
                               sx={{
                                 minWidth: '36px',
                                 height: '36px',
                                 borderRadius: '18px',
                                 fontSize: '13px',
                                 fontWeight: currentPage === page ? 'bold' : 'normal',
                                 backgroundColor: currentPage === page ? '#667eea' : 'transparent',
                                 borderColor: currentPage === page ? '#667eea' : '#ddd',
                                 color: currentPage === page ? 'white' : '#666',
                                 '&:hover': {
                                   backgroundColor: currentPage === page ? '#5c6bc0' : 'rgba(102, 126, 234, 0.04)',
                                   borderColor: currentPage === page ? '#5c6bc0' : '#667eea'
                                 }
                               }}
                             >
                               {page}
                             </Button>
                           ))}
                        </Box>

                                                 <Button
                           variant="outlined"
                           size="small"
                           disabled={currentPage === totalPages}
                           onClick={() => {
                             console.log('Next clicked, current page:', currentPage, 'total pages:', totalPages);
                             setCurrentPage(Math.min(totalPages, currentPage + 1));
                           }}
                           endIcon={<ArrowForwardIcon />}
                           sx={{
                             borderRadius: '20px',
                             px: 3,
                             py: 1,
                             fontWeight: 600,
                             borderColor: '#667eea',
                             color: '#667eea',
                             '&:hover': {
                               borderColor: '#5c6bc0',
                               backgroundColor: 'rgba(102, 126, 234, 0.04)'
                             },
                             '&:disabled': { 
                               opacity: 0.5,
                               borderColor: '#ccc',
                               color: '#ccc'
                             }
                           }}
                         >
                           Next
                         </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}
          {/* 操作按钮 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', bgcolor: 'grey.50' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2d3748', mb: 2, textAlign: 'center' }}>
                Report Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} sx={{ minWidth: '200px' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handlePreview}
                    disabled={dataLoading}
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
                    onClick={handleExport}
                    disabled={isExporting || dataLoading}
                    startIcon={<DownloadIcon />}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      borderRadius: 1.5,
                      backgroundColor: '#667eea',
                      '&:hover': {
                        backgroundColor: '#5c6bc0'
                      }
                    }}
                  >
                    {isExporting ? 'Exporting...' : 'Export PDF'}
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