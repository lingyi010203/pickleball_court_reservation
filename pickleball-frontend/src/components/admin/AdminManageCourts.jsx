import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip, Snackbar, Alert,
  CircularProgress, Grid, Chip, MenuItem, FormControl, InputLabel, Select, 
  InputAdornment, Checkbox, Divider, TablePagination, TableSortLabel,
  FormGroup, FormControlLabel, TableFooter, useTheme, alpha
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import UserService from '../../service/UserService';
import { uploadCourtImage, getCourtImages } from '../../service/CourtService';
import { getStatusChip } from './statusConfig';
import api from '../../service/api';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLanguage } from '../../context/LanguageContext';


const AdminManageCourts = () => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCourt, setCurrentCourt] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'ACTIVE',
    courtType: 'STANDARD',
    openingTime: '10:00',
    closingTime: '00:00',
    operatingDays: '',
    peakHourlyPrice: 0,
    offPeakHourlyPrice: 0,
    dailyPrice: 0,
    peakStartTime: '18:00',
    peakEndTime: '00:00'
  });
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, courtId: null });
  const [deletePreviewDialog, setDeletePreviewDialog] = useState({ open: false, courtId: null, courtName: '', affectedData: null });
  const [deleting, setDeleting] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [restoreDialog, setRestoreDialog] = useState({ open: false, courtId: null, courtName: '' });
  
  // 分页和排序状态
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCourts, setTotalCourts] = useState(0);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  
  // 过滤状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courtTypeFilter, setCourtTypeFilter] = useState('');


  // 统计数据
  const [stats, setStats] = useState({
    totalCourts: 0,
    activeCourts: 0,
    deletedCourts: 0,
    averagePrice: 0
  });

  // 应用filter逻辑
  const filteredCourts = courts.filter(court => {
    // 搜索filter
    const matchesSearch = !searchTerm || 
      court.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      court.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      court.venue?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 状态filter - 直接显示所有状态的球场
    const matchesStatus = !statusFilter || court.status?.toUpperCase() === statusFilter;
    
    // Court type filter
    const matchesCourtType = !courtTypeFilter || court.courtType === courtTypeFilter;
    
    // 调试信息
    if (statusFilter && !matchesStatus) {
      console.log(`Court ${court.id} (${court.name}) status: "${court.status}" doesn't match filter: "${statusFilter}"`);
    }
    
    return matchesSearch && matchesStatus && matchesCourtType;
  });

  // 调试：显示所有court的status
  useEffect(() => {
    if (courts.length > 0) {
      console.log('All court statuses:', courts.map(c => ({ id: c.id, name: c.name, status: c.status })));
    }
  }, [courts]);

  // 1. 新增 useState
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [newVenue, setNewVenue] = useState({ name: '', address: '' });
  const [courtImages, setCourtImages] = useState([]);

  const daysOptions = [
    'Mon', 'Tue', 'Wed',
    'Thu', 'Fri', 'Sat', 'Sun'
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'DELETED', label: 'Deleted' }
  ];

  // 2. 获取场馆列表
  useEffect(() => {
    api.get('/admin/venues').then(res => setVenues(res.data));
  }, []);

  // 3. 新建场馆提交
  const handleAddVenue = async () => {
    const res = await api.post('/admin/venues', newVenue);
    const newVenueObj = { id: res.data, ...newVenue };
    setVenues([...venues, newVenueObj]);
    setSelectedVenueId(res.data);
    setShowAddVenue(false);
    setNewVenue({ name: '', address: '' });
  };

  // 4. 新建场地表单
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field changes
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDayChange = (e) => {
    const selected = e.target.value;
    setDaysOfWeek(selected);
    setFormData(prev => ({
      ...prev,
      operatingDays: selected.join(',')
    }));
    
    if (formErrors.operatingDays) {
      setFormErrors(prev => ({ ...prev, operatingDays: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Court name is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!formData.courtType) errors.courtType = 'Court type is required';
    if (!daysOfWeek.length) errors.operatingDays = 'Select at least one day';
    if (!formData.openingTime) errors.openingTime = 'Opening time required';
    if (!formData.closingTime) errors.closingTime = 'Closing time required';
    if (formData.openingTime && formData.closingTime && formData.openingTime >= formData.closingTime) {
      errors.closingTime = 'Closing time must be after opening time';
    }
    ['peakHourlyPrice', 'offPeakHourlyPrice', 'dailyPrice'].forEach(key => {
      if (formData[key] < 0) errors[key] = 'Price must be >= 0';
    });
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (!selectedVenueId) errors.venueId = '请选择场馆';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    // 检查是否是恢复DELETED状态的球场
    if (currentCourt && currentCourt.status === 'DELETED' && formData.status !== 'DELETED') {
      setRestoreDialog({
        open: true,
        courtId: currentCourt.id,
        courtName: currentCourt.name
      });
      return;
    }
    
    try {
      setLoading(true);
      const uniqueDays = Array.from(new Set(daysOfWeek));
      const payload = {
        ...formData,
        venueId: selectedVenueId,
        operatingDays: uniqueDays.map(d => d.toUpperCase()).join(','),
        peakHourlyPrice: parseFloat(formData.peakHourlyPrice) || 0,
        offPeakHourlyPrice: parseFloat(formData.offPeakHourlyPrice) || 0,
        dailyPrice: parseFloat(formData.dailyPrice) || 0,
      };
      
      if (payload.operatingDays === '') payload.operatingDays = null;

      if (currentCourt) {
        console.log('Updating court with payload:', payload);
        console.log('Operating days in payload:', payload.operatingDays);
        await api.put(`/admin/courts/${currentCourt.id}`, payload);
        setSnackbar({
          open: true,
          message: 'Court updated successfully!',
          severity: 'success'
        });
      } else {
        await api.post('/admin/courts', payload);
        setSnackbar({
          open: true,
          message: 'Court created successfully!',
          severity: 'success'
        });
      }

      fetchCourts();
      handleCloseDialog();
    } catch (err) {
      let errorMsg = 'Operation failed';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courtId) => {
    try {
      setLoading(true);
      await api.delete(`/admin/courts/${courtId}`);
      setSnackbar({
        open: true,
        message: 'Court deleted successfully!',
        severity: 'success'
      });
      fetchCourts();
    } catch (err) {
      let errorMsg = 'Deletion failed';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleDeleteClick = async (courtId) => {
    try {
      setLoadingPreview(true);
      // 获取删除预览数据
      const response = await api.get(`/admin/courts/${courtId}/delete-preview`);
      const court = courts.find(c => c.id === courtId);
      
      setDeletePreviewDialog({
        open: true,
        courtId,
        courtName: court?.name || 'Unknown Court',
        affectedData: response.data
      });
    } catch (err) {
      console.error('Error fetching delete preview:', err);
      
      // 显示更详细的错误信息
      let errorMessage = 'Error fetching delete preview. Please try again.';
      if (err.response) {
        // 服务器返回了错误响应
        if (err.response.status === 404) {
          errorMessage = 'Court not found.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.response.data) {
          errorMessage = err.response.data;
        }
      } else if (err.request) {
        // 请求发送了但没有收到响应
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoadingPreview(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    await handleDelete(deletePreviewDialog.courtId);
    setDeleting(false);
    setDeletePreviewDialog({ open: false, courtId: null, courtName: '', affectedData: null });
  };
  
  const handleDeleteCancel = () => {
    setDeletePreviewDialog({ open: false, courtId: null, courtName: '', affectedData: null });
  };

  const handleRestoreConfirm = async () => {
    try {
      setLoading(true);
      const uniqueDays = Array.from(new Set(daysOfWeek));
      const payload = {
        ...formData,
        status: 'ACTIVE', // 强制设置为ACTIVE状态进行恢复
        venueId: selectedVenueId,
        operatingDays: uniqueDays.map(d => d.toUpperCase()).join(','),
        peakHourlyPrice: parseFloat(formData.peakHourlyPrice) || 0,
        offPeakHourlyPrice: parseFloat(formData.offPeakHourlyPrice) || 0,
        dailyPrice: parseFloat(formData.dailyPrice) || 0,
      };
      
      if (payload.operatingDays === '') payload.operatingDays = null;

      console.log('Restoring court with payload:', payload);
      await api.put(`/admin/courts/${currentCourt.id}`, payload);
      setSnackbar({
        open: true,
        message: `Court "${currentCourt.name}" has been restored successfully!`,
        severity: 'success'
      });

      fetchCourts();
      handleCloseDialog();
      setRestoreDialog({ open: false, courtId: null, courtName: '' });
    } catch (err) {
      let errorMsg = 'Restore failed';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCancel = () => {
    setRestoreDialog({ open: false, courtId: null, courtName: '' });
  };



  // Missing functions
  const fetchCourts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/courts');
      setCourts(response.data);
      setTotalCourts(response.data.length);
      
      // 计算统计数据
      const totalCourts = response.data.length;
      const activeCourts = response.data.filter(court => court.status !== 'DELETED').length;
      const deletedCourts = response.data.filter(court => court.status === 'DELETED').length;
      const averagePrice = response.data.length > 0 
        ? (response.data.reduce((sum, court) => sum + (court.peakHourlyPrice || 0), 0) / response.data.length).toFixed(0)
        : 0;

      setStats({
        totalCourts,
        activeCourts,
        deletedCourts,
        averagePrice
      });
    } catch (err) {
      setError('Failed to fetch courts');
      setSnackbar({
        open: true,
        message: 'Failed to fetch courts',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (court = null) => {
    if (court) {
      setCurrentCourt(court);
      setFormData({
        name: court.name || '',
        location: court.location || '',
        status: court.status || 'ACTIVE',
        courtType: court.courtType || 'STANDARD',
        openingTime: court.openingTime || '10:00',
        closingTime: court.closingTime || '00:00',
        operatingDays: court.operatingDays || '',
        peakHourlyPrice: court.peakHourlyPrice || 0,
        offPeakHourlyPrice: court.offPeakHourlyPrice || 0,
        dailyPrice: court.dailyPrice || 0,
        peakStartTime: court.peakStartTime || '18:00',
        peakEndTime: court.peakEndTime || '00:00'
      });
      setSelectedVenueId(court.venue?.id || '');
      setDaysOfWeek(court.operatingDays ? court.operatingDays.split(',').map(d => {
        const trimmed = d.trim();
        // 将后端格式 (MON, TUE) 转换为前端格式 (Mon, Tue)
        return trimmed.charAt(0) + trimmed.slice(1).toLowerCase();
      }) : []);
    } else {
      setCurrentCourt(null);
      setFormData({
        name: '',
        location: '',
        status: 'ACTIVE',
        courtType: 'STANDARD',
        openingTime: '10:00',
        closingTime: '00:00',
        operatingDays: '',
        peakHourlyPrice: 0,
        offPeakHourlyPrice: 0,
        dailyPrice: 0,
        peakStartTime: '18:00',
        peakEndTime: '00:00'
      });
      setSelectedVenueId('');
      setDaysOfWeek([]);
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCourt(null);
    setFormData({
      name: '',
      location: '',
      status: 'ACTIVE',
      courtType: 'STANDARD',
      openingTime: '10:00',
      closingTime: '00:00',
      operatingDays: '',
      peakHourlyPrice: 0,
      offPeakHourlyPrice: 0,
      dailyPrice: 0,
      peakStartTime: '18:00',
      peakEndTime: '00:00'
    });
    setDaysOfWeek([]);
    setFormErrors({});
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    console.log('Status filter changed to:', e.target.value);
    setStatusFilter(e.target.value);
  };

  const handleCourtTypeFilterChange = (e) => {
    setCourtTypeFilter(e.target.value);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCourtTypeFilter('');
    setPage(0);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Load courts on component mount
  useEffect(() => {
    fetchCourts();
  }, []);

  // 打开新建场馆弹窗时自动带入当前venue name
  const handleVenueSelect = (e) => {
    if (e.target.value === 'add_new_venue') {
      // 自动带入当前下拉已选venue的名字
      const selectedVenue = venues.find(v => v.id === selectedVenueId);
      setNewVenue({
        name: selectedVenue ? selectedVenue.name : '',
        address: ''
      });
      setShowAddVenue(true);
    } else {
      setSelectedVenueId(e.target.value);
      if (formErrors.venueId) setFormErrors(prev => ({ ...prev, venueId: '' }));
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    console.log('Selected files:', files);
    console.log('Current court:', currentCourt);
    
    if (!currentCourt || !currentCourt.id) {
      alert('Please save court basic information first, then upload image');
      return;
    }
    
    console.log('Uploading images for court ID:', currentCourt.id);
    
    for (let file of files) {
      try {
        console.log('Uploading file:', file.name, 'Size:', file.size);
        const result = await uploadCourtImage(currentCourt.id, file);
        console.log('Upload result:', result);
      } catch (err) {
        console.error('Upload error:', err);
        alert('Image upload failed: ' + err.message);
      }
    }
    
    // 上传后刷新图片
    console.log('Refreshing images for court ID:', currentCourt.id);
    fetchCourtImages(currentCourt.id);
  };

  const fetchCourtImages = async (courtId) => {
    try {
      console.log('Fetching images for court ID:', courtId);
      const images = await getCourtImages(courtId);
      console.log('Fetched images:', images);
      setCourtImages(images);
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };

  if (loading && !courts.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {t('admin.courtManagement')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: '8px',
            px: 3,
            py: 1.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': { 
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          {t('admin.addNewCourt')}
        </Button>
      </Box>

      {/* Statistics Dashboard */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, 
        gap: 2, 
        mb: 3 
      }}>
        {/* Total Courts */}
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
            {stats.totalCourts}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.totalCourts')}
          </Typography>
        </Paper>

        {/* Active Courts */}
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
            {stats.activeCourts}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.activeCourts')}
          </Typography>
        </Paper>

        {/* Deleted Courts */}
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
            {stats.deletedCourts}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.deletedCourts')}
          </Typography>
        </Paper>

        {/* Average Price */}
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
            RM {stats.averagePrice}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.averagePrice')}
          </Typography>
        </Paper>
      </Box>

      {/* Search and Actions Bar */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title={t('admin.searchByCourtInfo')} arrow>
            <TextField
              placeholder={t('admin.search')}
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: searchTerm && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    sx={{ mr: 1 }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>✕</Typography>
                  </IconButton>
                )
              }}
              sx={{ minWidth: 200 }}
            />
          </Tooltip>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('admin.status')}</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label={t('admin.status')}
              >
              <MenuItem value="">{t('admin.allStatuses')}</MenuItem>
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('admin.courtType')}</InputLabel>
              <Select
                value={courtTypeFilter}
                onChange={handleCourtTypeFilterChange}
                label={t('admin.courtType')}
              >
              <MenuItem value="">{t('admin.allTypes')}</MenuItem>
              <MenuItem value="STANDARD">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: '#1976d2', borderRadius: '50%' }} />
                  {t('admin.standardCourt')}
                </Box>
              </MenuItem>
              <MenuItem value="VIP">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: '#ff9800', borderRadius: '50%' }} />
                  {t('admin.vipCourt')}
                </Box>
              </MenuItem>
              <MenuItem value="OTHER">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: '#9c27b0', borderRadius: '50%' }} />
                  {t('admin.otherCourt')}
                </Box>
              </MenuItem>
            </Select>
          </FormControl>


          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={clearAllFilters}
            sx={{
              borderRadius: '8px',
              px: 2,
              py: 1,
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }
            }}
          >
            {t('admin.clear')}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchCourts}
            disabled={loading}
            sx={{ 
              ml: 'auto',
              borderColor: theme.palette.primary.main, 
              color: theme.palette.primary.main, 
              minWidth: 120,
              '&:hover': { borderColor: theme.palette.primary.dark }
            }}
          >
            {loading ? t('admin.refreshing') : t('admin.refresh')}
          </Button>
        </Box>
      </Paper>



      {/* Courts Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  {t('admin.courtName')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.venue')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'courtType'}
                  direction={orderBy === 'courtType' ? order : 'asc'}
                  onClick={() => handleSort('courtType')}
                >
                  {t('admin.courtType')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  {t('admin.status')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.operatingDays')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.peakHourlyPrice')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.offPeakHourlyPrice')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourts.length > 0 ? filteredCourts.map((court) => (
                <TableRow key={court.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>
                      {court.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{court.venue ? `${court.venue.name} (${court.venue.location})` : t('admin.noVenue')}</TableCell>
                  <TableCell>
                    <Chip
                      label={court.courtType || 'STANDARD'}
                      size="small"
                      sx={{
                        backgroundColor: 
                          court.courtType === 'VIP' ? '#ff9800' :
                          court.courtType === 'OTHER' ? '#9c27b0' : '#1976d2',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {getStatusChip(court.status?.toUpperCase() || 'UNKNOWN')}
                  </TableCell>
                  <TableCell>
                    {court.operatingDays
                      ? Array.from(new Set(
                          court.operatingDays.split(',')
                            .map(day => day.trim().toUpperCase())
                        ))
                          .map(day => {
                            const map = { 
                              MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', 
                              THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', 
                              SUNDAY: 'Sun', MON: 'Mon', TUE: 'Tue', WED: 'Wed', 
                              THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' 
                            };
                            return map[day] || (day.charAt(0) + day.slice(1).toLowerCase());
                          })
                          .join(', ')
                      : t('admin.noVenue')}
                  </TableCell>
                  <TableCell>
                    {court.peakHourlyPrice ? `RM ${court.peakHourlyPrice.toFixed(2)}` : t('admin.noVenue')}
                  </TableCell>
                  <TableCell>
                    {court.offPeakHourlyPrice ? `RM ${court.offPeakHourlyPrice.toFixed(2)}` : t('admin.noVenue')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title={court.status === 'DELETED' ? t('admin.restore') : t('admin.edit')}>
                        <IconButton onClick={() => handleOpenDialog(court)}>
                          <EditIcon color={court.status === 'DELETED' ? 'success' : 'primary'} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('admin.delete')}>
                        <IconButton onClick={() => handleDeleteClick(court.id)} disabled={deleting}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    {t('admin.noCourtsFound')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                colSpan={8}
                count={filteredCourts.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* Add/Edit Court Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }
        }}
      >
        {/* Background Mascot with Low Opacity */}
        <Box
          component="img"
          src={`${process.env.PUBLIC_URL}/mascot_lowopacity1.png`}
          alt="Background Mascot"
          sx={{
            position: 'absolute',
            top: '60%',
            right: '-5px',
            transform: 'translateY(-50%)',
            width: '400px',
            height: 'auto',
            opacity: 0.15,
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />

        <DialogTitle sx={{ 
          textAlign: 'center', 
          pb: 1,
          position: 'relative',
          zIndex: 1
        }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: currentCourt?.status === 'DELETED' ? theme.palette.success.main : theme.palette.primary.main,
              mb: 1
            }}>
              {currentCourt ? (currentCourt.status === 'DELETED' ? t('admin.restoreCourt') : t('admin.editCourt')) : t('admin.addNewCourt')}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 500
            }}>
              {currentCourt ? (currentCourt.status === 'DELETED' ? t('admin.restoreCourtDescription') : t('admin.updateCourtDescription')) : t('admin.addNewCourtDescription')}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 600,
              display: 'block',
              mb: 2
            }}>
              * {t('admin.required')}
            </Typography>
          </Box>

          {/* Basic Information Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: theme.palette.primary.main,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ 
                width: 8, 
                height: 8, 
                backgroundColor: theme.palette.primary.main, 
                borderRadius: '50%' 
              }} />
              {t('admin.basicInformation')}
            </Typography>
            
            <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.courtName')} *
                  </Typography>
              <TextField
                fullWidth
                    variant="outlined"
                    placeholder={t('admin.enterCourtName')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
            </Grid>
              
            <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.courtType')} *
                  </Typography>
                  <FormControl fullWidth error={!!formErrors.courtType}>
                    <Select
                      name="courtType"
                      value={formData.courtType}
                      onChange={handleChange}
                      sx={{ 
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }}
                    >
                      <MenuItem value="STANDARD">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            backgroundColor: '#1976d2', 
                            borderRadius: '50%' 
                          }} />
                          {t('admin.standardCourt')}
                        </Box>
                      </MenuItem>
                      <MenuItem value="VIP">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            backgroundColor: '#ff9800', 
                            borderRadius: '50%' 
                          }} />
                          {t('admin.vipCourt')}
                        </Box>
                      </MenuItem>
                      <MenuItem value="OTHER">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            backgroundColor: '#9c27b0', 
                            borderRadius: '50%' 
                          }} />
                          {t('admin.otherCourt')}
                        </Box>
                      </MenuItem>
                    </Select>
                    {formErrors.courtType && (
                      <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {formErrors.courtType}
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.venue')} *
                  </Typography>
              <TextField
                fullWidth
                    variant="outlined"
                    placeholder={t('admin.selectVenue')}
                name="location"
                value={formData.location}
                onChange={handleChange}
                error={!!formErrors.location}
                helperText={formErrors.location}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
            </Grid>
              
            <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.status')}
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      sx={{ 
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }}
                    >
                      <MenuItem value="ACTIVE">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            backgroundColor: '#4caf50', 
                            borderRadius: '50%' 
                          }} />
                          {t('admin.active')}
                        </Box>
                      </MenuItem>
                      <MenuItem value="INACTIVE">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            backgroundColor: '#f44336', 
                            borderRadius: '50%' 
                          }} />
                          {t('admin.inactive')}
                        </Box>
                      </MenuItem>
                      <MenuItem value="MAINTENANCE">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            backgroundColor: '#ff9800', 
                            borderRadius: '50%' 
                          }} />
                          {t('admin.maintenance')}
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Venue Selection Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: theme.palette.primary.main,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ 
                width: 8, 
                height: 8, 
                backgroundColor: theme.palette.primary.main, 
                borderRadius: '50%' 
              }} />
              {t('admin.venue')} {t('admin.selection')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.selectVenue')} *
                  </Typography>
                  <FormControl fullWidth error={!selectedVenueId && !!formErrors.venueId}>
                <Select
                  value={selectedVenueId}
                  onChange={handleVenueSelect}
                  displayEmpty
                      sx={{ 
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }}
                    >
                      <MenuItem value="" disabled>{t('admin.selectVenue')}</MenuItem>
                  {venues.map(v => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.name} ({v.address || v.location})
                        </MenuItem>
                      ))}
                      <MenuItem value="add_new_venue" sx={{ 
                        color: theme.palette.primary.main, 
                        fontWeight: 'bold' 
                      }}>
                        + {t('admin.addNewVenue')}
                      </MenuItem>
                </Select>
                    {formErrors.venueId && (
                      <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {formErrors.venueId}
                      </Typography>
                    )}

              </FormControl>
                </Box>
            </Grid>
            </Grid>
          </Box>

          {/* Operating Schedule Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: theme.palette.primary.main,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ 
                width: 8, 
                height: 8, 
                backgroundColor: theme.palette.primary.main, 
                borderRadius: '50%' 
              }} />
              {t('admin.operatingSchedule')}
            </Typography>
            
            <Grid container spacing={3}>
            <Grid item xs={12}>
                <Box sx={{ mb: 3 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 2,
                    display: 'block'
                  }}>
                    {t('admin.operatingDays')} *
                  </Typography>
                  <FormGroup row sx={{ gap: 1 }}>
                  {daysOptions.map((day) => (
                    <FormControlLabel
                      key={day}
                      control={
                        <Checkbox
                          checked={daysOfWeek.indexOf(day) > -1}
                          onChange={e => {
                            let newDays;
                            if (e.target.checked) {
                              newDays = Array.from(new Set([...daysOfWeek, day]));
                            } else {
                              newDays = daysOfWeek.filter(d => d !== day);
                            }
                            setDaysOfWeek(newDays);
                            setFormData(prev => ({
                              ...prev,
                              operatingDays: newDays.map(d => d.toUpperCase()).join(',')
                            }));
                          }}
                          name={day}
                          color="primary"
                            sx={{
                              '&.Mui-checked': {
                                color: theme.palette.primary.main,
                              }
                            }}
                        />
                      }
                      label={day}
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontWeight: 500,
                            fontSize: '0.9rem'
                          }
                        }}
                    />
                  ))}
                </FormGroup>
                  {formErrors.operatingDays && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                      {formErrors.operatingDays}
                    </Typography>
                  )}
                </Box>
            </Grid>
              
            <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.openingTime')} *
                  </Typography>
                <TextField
                  fullWidth
                  type="time"
                    name="openingTime"
                  value={formData.openingTime}
                  onChange={handleChange}
                  error={!!formErrors.openingTime}
                  helperText={formErrors.openingTime}
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
            </Grid>
              
            <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.closingTime')} *
                  </Typography>
                <TextField
                  fullWidth
                  type="time"
                    name="closingTime"
                  value={formData.closingTime}
                  onChange={handleChange}
                  error={!!formErrors.closingTime}
                  helperText={formErrors.closingTime}
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
            </Grid>
            </Grid>
          </Box>

          {/* Peak Hours Configuration Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: theme.palette.primary.main,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ 
                width: 8, 
                height: 8, 
                backgroundColor: theme.palette.primary.main, 
                borderRadius: '50%' 
              }} />
              {t('admin.peakHoursConfiguration')}
            </Typography>
            
            <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.peakStartTime')}
                  </Typography>
                <TextField
                  fullWidth
                  type="time"
                    name="peakStartTime"
                  value={formData.peakStartTime}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
            </Grid>
              
            <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.peakEndTime')}
                  </Typography>
                <TextField
                  fullWidth
                  type="time"
                    name="peakEndTime"
                  value={formData.peakEndTime}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
            </Grid>
            </Grid>
          </Box>

          {/* Pricing Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: theme.palette.primary.main,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ 
                width: 8, 
                height: 8, 
                backgroundColor: theme.palette.primary.main, 
                borderRadius: '50%' 
              }} />
              {t('admin.pricingConfiguration')} (RM)
            </Typography>
            
            <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.peakHourlyPrice')}
                  </Typography>
              <TextField
                fullWidth
                type="number"
                    placeholder="e.g. 50.00"
                name="peakHourlyPrice"
                value={formData.peakHourlyPrice}
                onChange={handleChange}
                    error={!!formErrors.peakHourlyPrice}
                    helperText={formErrors.peakHourlyPrice}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">RM</InputAdornment>
                }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
            </Grid>
              
            <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.offPeakHourlyPrice')}
                  </Typography>
              <TextField
                fullWidth
                type="number"
                    placeholder="e.g. 30.00"
                name="offPeakHourlyPrice"
                value={formData.offPeakHourlyPrice}
                onChange={handleChange}
                    error={!!formErrors.offPeakHourlyPrice}
                    helperText={formErrors.offPeakHourlyPrice}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">RM</InputAdornment>
                }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
            </Grid>
              
            <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.dailyPrice')}
                  </Typography>
              <TextField
                fullWidth
                type="number"
                    placeholder="e.g. 200.00"
                name="dailyPrice"
                value={formData.dailyPrice}
                onChange={handleChange}
                    error={!!formErrors.dailyPrice}
                    helperText={formErrors.dailyPrice}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">RM</InputAdornment>
                }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
            </Grid>
            </Grid>
          </Box>

          {/* Court Images Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: theme.palette.primary.main,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ 
                width: 8, 
                height: 8, 
                backgroundColor: theme.palette.primary.main, 
                borderRadius: '50%' 
              }} />
              {t('admin.courtImages')}
            </Typography>
            
            <Grid container spacing={3}>
            <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.uploadImages')}
                  </Typography>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                    style={{ 
                      marginBottom: 8,
                      padding: '12px',
                      border: '2px dashed #e0e0e0',
                      borderRadius: '12px',
                      width: '100%',
                      backgroundColor: '#f9fafb',
                      cursor: 'pointer'
                    }}
                  />
                  {courtImages && courtImages.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                      {courtImages.map(img => (
                  <img
                    key={img.id || img.imagePath}
                    src={img.imagePath}
                    alt="court"
                          style={{ 
                            width: 80, 
                            height: 60, 
                            objectFit: 'cover', 
                            borderRadius: 8, 
                            border: '1px solid #e0e0e0',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                  />
                ))}
                    </Box>
                  )}
              </Box>
            </Grid>
          </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 0,
          position: 'relative',
          zIndex: 1
        }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={loading}
            sx={{
              px: 3,
              py: 1.2,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              border: `2px solid ${theme.palette.grey[300]}`,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.grey[400],
                backgroundColor: theme.palette.grey[50]
              }
            }}
          >
            {t('admin.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              px: 3,
              py: 1.2,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '12px',
              textTransform: 'none',
              backgroundColor: currentCourt?.status === 'DELETED' ? theme.palette.success.main : theme.palette.primary.main,
              color: 'white',
              boxShadow: currentCourt?.status === 'DELETED' 
                ? `0 4px 14px ${theme.palette.success.main}40`
                : `0 4px 14px ${theme.palette.primary.main}40`,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: currentCourt?.status === 'DELETED' ? theme.palette.success.dark : theme.palette.primary.dark,
                boxShadow: currentCourt?.status === 'DELETED'
                  ? `0 6px 20px ${theme.palette.success.main}60`
                  : `0 6px 20px ${theme.palette.primary.main}60`,
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                backgroundColor: theme.palette.action.disabledBackground,
                transform: 'none'
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              currentCourt ? (currentCourt.status === 'DELETED' ? t('admin.restoreCourt') : t('admin.update')) : t('admin.create')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Preview Dialog */}
      <Dialog 
        open={deletePreviewDialog.open} 
        onClose={handleDeleteCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'white',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden'
          }
        }}
      >
        {/* Header */}
        <Box sx={{ 
          backgroundColor: theme.palette.error.main,
          color: 'white',
          p: 4,
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            mb: 1,
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}>
            {t('admin.delete')} {t('admin.courtName')}
          </Typography>
          <Typography variant="body1" sx={{ 
            opacity: 0.9,
            fontWeight: 500,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            {deletePreviewDialog.courtName}
          </Typography>
        </Box>

        {/* Content */}
        <DialogContent sx={{ p: 0 }}>
          {loadingPreview ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 8,
              px: 4
            }}>
              <CircularProgress size={60} sx={{ color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                {t('admin.loadingPreviewData')}
              </Typography>
            </Box>
          ) : deletePreviewDialog.affectedData ? (
            <Box sx={{ p: 4 }}>
              {/* Impact Summary */}
              <Box sx={{ 
                backgroundColor: theme.palette.grey[50],
                borderRadius: '12px', 
                p: 3, 
                mb: 4,
                border: `1px solid ${theme.palette.grey[200]}`
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  color: theme.palette.text.primary
                }}>
                  {t('admin.impactSummary')}
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 3,
                  flexWrap: 'wrap'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    border: `1px solid ${theme.palette.grey[300]}`
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.error.main 
                    }}>
                      {deletePreviewDialog.affectedData.activeBookings?.length || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 500,
                      color: theme.palette.text.secondary
                    }}>
                      {t('admin.activeBookings')}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    border: `1px solid ${theme.palette.grey[300]}`
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.warning.main 
                    }}>
                      {deletePreviewDialog.affectedData.friendlyMatches?.length || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 500,
                      color: theme.palette.text.secondary
                    }}>
                      {t('admin.friendlyMatches')}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* No Affected Items */}
              {(!deletePreviewDialog.affectedData.activeBookings || deletePreviewDialog.affectedData.activeBookings.length === 0) &&
               (!deletePreviewDialog.affectedData.friendlyMatches || deletePreviewDialog.affectedData.friendlyMatches.length === 0) && (
                <Box sx={{ 
                  backgroundColor: theme.palette.success[50],
                  p: 3, 
                  borderRadius: '12px', 
                  mb: 4,
                  textAlign: 'center',
                  border: `1px solid ${theme.palette.success[200]}`
                }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.success.main,
                    mb: 1
                  }}>
                    {t('admin.noImpact')}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500,
                    color: theme.palette.text.secondary
                  }}>
                    {t('admin.noActiveBookingsOrFriendlyMatchesWillBeAffected')}
                  </Typography>
                </Box>
              )}

              {/* Affected Items Lists */}
              {deletePreviewDialog.affectedData.activeBookings && deletePreviewDialog.affectedData.activeBookings.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    mb: 3,
                    color: theme.palette.text.primary
                  }}>
                    {t('admin.activeBookings')}
                  </Typography>
                  <Box sx={{ 
                    maxHeight: 200, 
                    overflow: 'auto',
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.grey[200]}`
                  }}>
                    {deletePreviewDialog.affectedData.activeBookings.map((booking, index) => (
                      <Box key={index} sx={{ 
                        p: 3, 
                        borderBottom: index < deletePreviewDialog.affectedData.activeBookings.length - 1 ? `1px solid ${theme.palette.grey[200]}` : 'none',
                        backgroundColor: index % 2 === 0 ? theme.palette.grey[50] : 'white',
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          color: theme.palette.text.primary
                        }}>
                          {booking.memberName}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 2,
                          flexWrap: 'wrap',
                          alignItems: 'center'
                        }}>
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.text.secondary
                          }}>
                            {booking.slotDate}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.text.secondary
                          }}>
                            {booking.slotTime}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 600
                          }}>
                            RM {booking.totalAmount}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {deletePreviewDialog.affectedData.friendlyMatches && deletePreviewDialog.affectedData.friendlyMatches.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    mb: 3,
                    color: theme.palette.text.primary
                  }}>
                    {t('admin.friendlyMatches')}
                  </Typography>
                  <Box sx={{ 
                    maxHeight: 200, 
                    overflow: 'auto',
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.grey[200]}`
                  }}>
                    {deletePreviewDialog.affectedData.friendlyMatches.map((match, index) => (
                      <Box key={index} sx={{ 
                        p: 3, 
                        borderBottom: index < deletePreviewDialog.affectedData.friendlyMatches.length - 1 ? `1px solid ${theme.palette.grey[200]}` : 'none',
                        backgroundColor: index % 2 === 0 ? theme.palette.grey[50] : 'white',
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          color: theme.palette.text.primary
                        }}>
                          {match.title}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 2,
                          flexWrap: 'wrap',
                          alignItems: 'center'
                        }}>
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.text.secondary
                          }}>
                            {match.date}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.warning.main,
                            fontWeight: 600
                          }}>
                            {match.participantCount} {t('admin.participants')}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Actions That Will Be Taken */}
              <Box sx={{ 
                backgroundColor: theme.palette.warning[50],
                p: 3, 
                borderRadius: '12px',
                border: `1px solid ${theme.palette.warning[200]}`
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  color: theme.palette.text.primary
                }}>
                  {t('admin.actionsThatWillBeTaken')}
                </Typography>
                <Box component="ul" sx={{ 
                  margin: 0, 
                  paddingLeft: 3,
                  '& li': { 
                    fontSize: '0.95rem', 
                    mb: 1,
                    color: theme.palette.text.secondary,
                    fontWeight: 500
                  }
                }}>
                  <li>{t('admin.allAffectedBookingsWillBeAutomaticallyCancelled')}</li>
                  <li>{t('admin.fullRefundsWillBeProcessedForCancelledBookings')}</li>
                  <li>{t('admin.compensationPointsWillBeAddedToAffectedUsers')}</li>
                  <li>{t('admin.emailNotificationsWillBeSentToAffectedUsers')}</li>
                  <li>{t('admin.courtWillBeSoftDeleted')}</li>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 8,
              px: 4
            }}>
              <Typography variant="h6" sx={{ 
                color: theme.palette.error.main,
                mb: 2
              }}>
                {t('admin.errorLoadingPreviewData')}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: theme.palette.text.secondary,
                textAlign: 'center'
              }}>
                {t('admin.pleaseTryAgainOrContactSupport')}
              </Typography>
            </Box>
          )}
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ 
          p: 4, 
          pt: 0,
          gap: 2,
          justifyContent: 'center'
        }}>
          <Button 
            onClick={handleDeleteCancel} 
            disabled={deleting}
            variant="outlined"
            size="large"
            sx={{ 
              px: 4, 
              py: 1.5, 
              borderRadius: '12px',
              borderColor: theme.palette.grey[400],
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: '1rem',
              minWidth: '120px',
              '&:hover': {
                borderColor: theme.palette.grey[600],
                backgroundColor: theme.palette.grey[50]
              }
            }}
          >
            {t('admin.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            disabled={deleting}
            size="large"
            sx={{ 
              px: 4, 
              py: 1.5, 
              borderRadius: '12px', 
              fontWeight: 700,
              fontSize: '1rem',
              minWidth: '120px',
              '&:hover': {
                backgroundColor: theme.palette.error.dark
              }
            }}
          >
            {deleting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>{t('admin.deleting')}</span>
              </Box>
            ) : (
              t('admin.confirm') + ' ' + t('admin.delete')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Court Confirmation Dialog */}
      <Dialog
        open={restoreDialog.open}
        onClose={handleRestoreCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'white',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden'
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          backgroundColor: theme.palette.success.main,
          color: 'white',
          p: 3,
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{
            fontWeight: 600,
            mb: 1
          }}>
            {t('admin.restoreCourt')}
          </Typography>
          <Typography variant="body1" sx={{
            opacity: 0.9,
            fontWeight: 500
          }}>
            {restoreDialog.courtName}
          </Typography>
        </Box>

        {/* Content */}
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body1" sx={{
            color: theme.palette.text.primary,
            mb: 2,
            textAlign: 'center'
          }}>
            {t('admin.confirmRestoreCourt')}
          </Typography>
          
          <Box sx={{
            backgroundColor: theme.palette.info[50],
            p: 3,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.info[200]}`
          }}>
            <Typography variant="h6" sx={{
              fontWeight: 600,
              mb: 2,
              color: theme.palette.info.main
            }}>
              {t('admin.whatWillHappen')}
            </Typography>
            <Box component="ul" sx={{
              margin: 0,
              paddingLeft: 3,
              '& li': {
                fontSize: '0.95rem',
                mb: 1,
                color: theme.palette.text.secondary,
                fontWeight: 500
              }
            }}>
              <li>{t('admin.courtStatusWillBeChangedTo')} "{formData.status}"</li>
              <li>{t('admin.courtWillBecomeVisibleToUsersAgain')}</li>
              <li>{t('admin.allCourtSettingsWillBeUpdated')}</li>
              <li><strong>{t('admin.newTimeSlotsWillBeAutomaticallyGenerated')}</strong></li>
              <li>{t('admin.courtWillBeAvailableForBookingsImmediately')}</li>
            </Box>
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{
          p: 4,
          pt: 0,
          gap: 2,
          justifyContent: 'center'
        }}>
          <Button
            onClick={handleRestoreCancel}
            disabled={loading}
            variant="outlined"
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              borderColor: theme.palette.grey[400],
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: '1rem',
              minWidth: '120px',
              '&:hover': {
                borderColor: theme.palette.grey[600],
                backgroundColor: theme.palette.grey[50]
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRestoreConfirm}
            color="success"
            variant="contained"
            disabled={loading}
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              minWidth: '120px',
              background: theme.palette.success.main,
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                background: theme.palette.success.dark,
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
              },
              '&:disabled': {
                background: theme.palette.success[200],
                boxShadow: 'none'
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>Restoring...</span>
              </Box>
            ) : (
              'Confirm Restore'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 新建场馆弹窗 */}
      <Dialog open={showAddVenue} onClose={() => setShowAddVenue(false)}>
        <DialogTitle>Add New Venue</DialogTitle>
        <DialogContent>
          <TextField label="Venue Name" value={newVenue.name} onChange={e => setNewVenue({ ...newVenue, name: e.target.value })} fullWidth />
          <TextField label="Address" value={newVenue.address} onChange={e => setNewVenue({ ...newVenue, address: e.target.value })} fullWidth sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddVenue(false)}>Cancel</Button>
          <Button onClick={handleAddVenue} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminManageCourts;