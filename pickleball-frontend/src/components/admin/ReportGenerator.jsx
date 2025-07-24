import React, { useState } from 'react';
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

// 配置
const REPORT_CONFIG = {
  types: [
    { value: 'executive', label: 'Executive Summary', icon: <AnalyticsIcon />, description: 'High-level KPIs and trends for management' },
    { value: 'operational', label: 'Operational Report', icon: <EventNoteIcon />, description: 'Detailed day-to-day operations analysis' },
    { value: 'financial', label: 'Financial Report', icon: <AttachMoneyIcon />, description: 'Revenue, costs, and profitability metrics' }
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
    { name: 'executiveSummary', label: 'Executive Summary', default: true },
    { name: 'financialHighlights', label: 'Financial Highlights', default: true },
    { name: 'departmentBreakdown', label: 'Department Breakdown', default: false },
    { name: 'recommendations', label: 'Recommendations', default: true }
  ],
  formattingOptions: [
    { name: 'includeHeaderFooter', label: 'Header & Footer', description: 'Include company header and page numbers' },
    { name: 'useBrandColors', label: 'Brand Colors', description: 'Use company colors in charts and tables' },
    { name: 'includeAppendix', label: 'Data Appendix', description: 'Include raw data tables in appendix' }
  ],
  dataOptions: [
    { name: 'includeTrends', label: 'Trend Analysis', description: 'Year-over-year and period comparisons' },
    { name: 'includeForecasts', label: 'Forecast Projections', description: 'Predictive models and future estimates' },
    { name: 'includeBenchmarks', label: 'Industry Benchmarks', description: 'Comparison against industry standards' }
  ]
};

const ReportGenerator = ({ onGenerateReport, companyInfo }) => {
  // State
  const [reportType, setReportType] = useState('executive');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [visualizationType, setVisualizationType] = useState('bar');
  const [dataOptions, setDataOptions] = useState({
    includeTrends: true,
    includeForecasts: false,
    includeBenchmarks: false
  });
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

  // 内容生成函数
  const generateExecutiveSummary = () => ({
    keyMetrics: [
      { name: 'Revenue Growth', value: '12%', change: '+3% YoY' },
      { name: 'Customer Acquisition', value: '1,240', change: '+18% MoM' },
      { name: 'Operational Efficiency', value: '84%', change: '+5% QoQ' }
    ],
    highlights: [
      'Record quarterly revenue achieved',
      'New customer acquisition up 18% month-over-month',
      'Operational costs reduced by 7% through automation'
    ]
  });

  const generateFinancialData = () => ({
    incomeStatement: [
      { category: 'Revenue', current: 4200000, previous: 3800000 },
      { category: 'Cost of Goods', current: 2100000, previous: 1900000 },
      { category: 'Operating Expenses', current: 1200000, previous: 1300000 },
      { category: 'Net Income', current: 900000, previous: 600000 }
    ],
    balanceSheet: [
      { category: 'Assets', value: 5000000 },
      { category: 'Liabilities', value: 2000000 },
      { category: 'Equity', value: 3000000 }
    ]
  });

  const generateTrendAnalysis = () => ({
    timePeriods: ['Current', 'Previous', 'YoY Change'],
    metrics: [
      {
        name: 'Revenue',
        values: ['$4.2M', '$3.8M', '+10.5%'],
        chartData: [4200000, 3800000]
      },
      {
        name: 'Active Users',
        values: ['12,450', '10,890', '+14.3%'],
        chartData: [12450, 10890]
      }
    ]
  });

  const generateForecasts = () => ({
    nextQuarter: {
      revenue: { low: 4500000, high: 4800000 },
      expenses: { low: 2200000, high: 2400000 },
      profitMargin: '18-22%'
    },
    nextYear: {
      revenue: { low: 20000000, high: 22000000 },
      expenses: { low: 9000000, high: 10000000 },
      profitMargin: '20-25%'
    }
  });

  const generateBenchmarks = () => ({
    industryAverage: {
      revenueGrowth: '8%',
      profitMargin: '15%',
      customerAcquisitionCost: '$120'
    },
    competitors: [
      { name: 'Competitor A', revenueGrowth: '10%', marketShare: '22%' },
      { name: 'Competitor B', revenueGrowth: '9%', marketShare: '18%' },
      { name: 'Competitor C', revenueGrowth: '7%', marketShare: '15%' }
    ]
  });

  const generateRecommendations = () => [
    'Expand marketing efforts in Q3 to capitalize on seasonal trends',
    'Invest in automation to further reduce operational costs',
    'Consider strategic partnerships to enter new markets'
  ];

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
        format: exportFormat || 'pdf',
        dataOptions
      },
      content: {
        summary: generateExecutiveSummary(),
        financials: generateFinancialData(),
        trends: dataOptions.includeTrends ? generateTrendAnalysis() : null,
        forecasts: dataOptions.includeForecasts ? generateForecasts() : null,
        benchmarks: dataOptions.includeBenchmarks ? generateBenchmarks() : null,
        recommendations: generateRecommendations()
      }
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
              />
            </Grid>
            <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowForwardIcon sx={{ color: '#a0aec0' }} />
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
              />
            </Grid>
          </Grid>
        </Grid>
        {/* 数据选项 */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#4a5568' }}>
            Data Options
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {REPORT_CONFIG.dataOptions.map((option) => (
                <Grid item xs={12} sm={4} key={option.name}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={dataOptions[option.name]}
                        onChange={(e) => setDataOptions({
                          ...dataOptions,
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
              {reportSections.executiveSummary && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>Executive Summary</Typography>
                  <Typography paragraph>
                    This report provides a comprehensive analysis of {companyInfo?.name || 'our company'}'s performance during the specified period.
                  </Typography>
                  <Grid container spacing={2}>
                    {generateExecutiveSummary().keyMetrics.map((metric, index) => (
                      <Grid item xs={12} sm={4} key={index}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="subtitle2">{metric.name}</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{metric.value}</Typography>
                          <Typography variant="caption" color={metric.change.startsWith('+') ? 'success.main' : 'error.main'}>
                            {metric.change}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              {reportSections.financialHighlights && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>Financial Highlights</Typography>
                  <Typography paragraph>
                    Key financial metrics for the reporting period.
                  </Typography>
                  <Box sx={{ height: 300, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography>Chart visualization would appear here ({visualizationType} chart)</Typography>
                  </Box>
                </Box>
              )}
              {dataOptions.includeTrends && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>Trend Analysis</Typography>
                  <Typography paragraph>
                    Performance trends over time.
                  </Typography>
                  <Box sx={{ height: 300, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography>Trend visualization would appear here</Typography>
                  </Box>
                </Box>
              )}
              {reportSections.recommendations && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>Recommendations</Typography>
                  <ul>
                    {generateRecommendations().map((rec, index) => (
                      <li key={index}><Typography>{rec}</Typography></li>
                    ))}
                  </ul>
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
            disabled={isGenerating}
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
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Paper>
  );
};

export default ReportGenerator;