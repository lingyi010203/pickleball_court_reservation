import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem, TextField,
  FormControlLabel, Checkbox, Button, Box, CircularProgress, IconButton, Divider
} from '@mui/material';
import {
  BarChart as BarChartIcon, EventNote as EventNoteIcon, People as PeopleIcon,
  AttachMoney as AttachMoneyIcon, Analytics as AnalyticsIcon, ArrowForward as ArrowForwardIcon,
  PictureAsPdf as PictureAsPdfIcon, TableChart as TableChartIcon, GridOn as GridOnIcon,
  FileDownload as FileDownloadIcon, Close as CloseIcon, Business as BusinessIcon,
  PieChart as PieChartIcon, Visibility as VisibilityIcon, InsertChart as InsertChartIcon
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
      setError('Please select a valid date range');
      return;
    }
    if (new Date(dateRange.start) > new Date(dateRange.end)) {
      setError('End date must be after start date');
      return;
    }
    setShowPreview(true);
  };

  // 渲染
  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
        <BusinessIcon sx={{ color: '#667eea', fontSize: 28, mr: 1.5 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
          Advanced Report Generator
        </Typography>
      </Box>
      <Divider sx={{ my: 2 }} />

      <Grid container spacing={3}>
        {/* 标题 */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Report Title"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder={`${companyInfo?.name || 'Company'} - ${new Date().getFullYear()} Report`}
          />
        </Grid>
        {/* 类型/格式/可视化 */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              label="Report Type"
            >
              {REPORT_CONFIG.types.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2 }}>{type.icon}</Box>
                    <Typography>{type.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="Export Format"
            >
              {REPORT_CONFIG.formats.map((fmt) => (
                <MenuItem key={fmt.value} value={fmt.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2 }}>{fmt.icon}</Box>
                    <Typography>{fmt.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Visualization Style</InputLabel>
            <Select
              value={visualizationType}
              onChange={(e) => setVisualizationType(e.target.value)}
              label="Visualization Style"
            >
              {REPORT_CONFIG.visualizationOptions.map((vis) => (
                <MenuItem key={vis.value} value={vis.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2 }}>{vis.icon}</Box>
                    <Typography>{vis.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* 日期范围 */}
        <Grid item xs={12}>
          <Grid container spacing={1.5}>
            <Grid item xs={5}>
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
            <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dataLoading ? (
                <CircularProgress size={20} />
              ) : (
                <ArrowForwardIcon sx={{ color: '#a0aec0' }} />
              )}
            </Grid>
            <Grid item xs={5}>
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
          {dataLoading && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Loading report data...
            </Typography>
          )}
          {error && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {error}
            </Typography>
          )}
        </Grid>
        {/* 报表部分 */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Report Sections
          </Typography>
          <Paper sx={{ p: 2 }}>
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
          <Typography variant="subtitle1" gutterBottom>
            Formatting Options
          </Typography>
          <Paper sx={{ p: 2 }}>
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
                        <Typography>{option.label}</Typography>
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
            <Paper sx={{ p: 3, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Report Preview</Typography>
                <IconButton onClick={() => setShowPreview(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Typography variant="h5" gutterBottom>
                {reportTitle || `${REPORT_CONFIG.types.find(t => t.value === reportType).label}`}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                {companyInfo?.name || 'Company'} | {dateRange.start && dateRange.end ? `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}` : ''}
              </Typography>
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
                          <Box sx={{ height: 300, position: 'relative' }}>
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
                          <Box sx={{ height: 300, position: 'relative' }}>
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
                          <Box sx={{ height: 300, position: 'relative' }}>
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
                          <Box sx={{ height: 300, position: 'relative' }}>
                            <ReportChart
                              type="pie"
                              data={reportData.trends.bookingsByStatus}
                              title="Booking Distribution by Status"
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
                          <Box sx={{ height: 300, position: 'relative' }}>
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
                          <Box sx={{ height: 300, position: 'relative' }}>
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
                          <Box sx={{ height: 300, position: 'relative' }}>
                            <ReportChart
                              type="bar"
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
            </Paper>
          </Grid>
        )}
        {/* 操作按钮 */}
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handlePreview}
            disabled={dataLoading || !reportData}
            startIcon={<VisibilityIcon />}
          >
            Preview Report
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleGenerate}
            disabled={isGenerating || dataLoading || !reportData}
            startIcon={isGenerating ? <CircularProgress size={24} /> : <FileDownloadIcon />}
            sx={{
              py: 2,
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
    </Paper>
  );
};

export default ReportGenerator;