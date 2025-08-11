import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip, Snackbar, Alert,
  CircularProgress, Grid, Chip, MenuItem, FormControl, InputLabel, Select,
  TablePagination, TableSortLabel, TextField, Divider,
  Card, CardContent, Avatar, List, ListItem, ListItemText, TableFooter, useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  CalendarToday as DateIcon,
  Person as PersonIcon,
  SportsTennis as CourtIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  FileDownload as ExportIcon,
  CheckCircle as CheckCircleIcon,
  NotInterested as NotInterestedIcon
} from '@mui/icons-material';
import BookingService from '../../service/BookingService';
import ModernBookingDetailsDialog from './ModernBookingDetailsDialog';
import { getStatusChip } from './statusConfig';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLanguage } from '../../context/LanguageContext';

const AdminManageBookings = () => {
  const { t } = useLanguage();
  const theme = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 分页和排序状态
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBookings, setTotalBookings] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('bookingDate');

  // 过滤状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // 对话框状态
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [adminRemark, setAdminRemark] = useState('');
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processAction, setProcessAction] = useState('approve'); // 'approve' 或 'reject'

  // 统计数据状态
  const [pendingCount, setPendingCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [cancellationRequestedCount, setCancellationRequestedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);


  // 状态选项
  const statusOptions = [
    { value: 'PENDING', label: 'Pending', color: '#ff9800' },
    { value: 'CONFIRMED', label: 'Confirmed', color: '#4caf50' },
    { value: 'CANCELLED', label: 'Cancelled', color: '#f44336' },
    { value: 'COMPLETED', label: 'Completed', color: '#2196f3' },
    { value: 'CANCELLATION_REQUESTED', label: 'Cancel Requested', color: '#9c27b0' },
    { value: 'CANCELLED_DUE_TO_COURT_DELETION', label: 'Court Deleted', color: '#ff5722' }
  ];

  useEffect(() => {
    fetchBookings();
    fetchStatistics();
  }, [page, rowsPerPage, order, orderBy, searchTerm, statusFilter, dateRange]);

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      const params = {
        search: searchTerm,
        status: statusFilter,
        startDate: dateRange.start,
        endDate: dateRange.end
      };
      
      const data = await BookingService.getAllAdminBookings({ ...params, page: 0, size: 1000 });
      let allBookings = [];
      
      if (data && Array.isArray(data.content)) {
        allBookings = data.content;
      } else if (Array.isArray(data)) {
        allBookings = data;
      }
      
      setPendingCount(allBookings.filter(b => b.status === 'PENDING').length);
      setConfirmedCount(allBookings.filter(b => b.status === 'CONFIRMED').length);
      setCancellationRequestedCount(allBookings.filter(b => b.status === 'CANCELLATION_REQUESTED').length);
      setCancelledCount(allBookings.filter(b => b.status === 'CANCELLED' || b.status === 'CANCELLED_DUE_TO_COURT_DELETION').length);
      
      // 更新totalBookings为所有预订的总数
      setTotalBookings(allBookings.length);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: rowsPerPage,
        sort: orderBy,
        direction: order,
        search: searchTerm,
        status: statusFilter,
        startDate: dateRange.start,
        endDate: dateRange.end
      };

      const data = await BookingService.getAllAdminBookings(params);
      console.log('Admin bookings API response:', data);
      if (data && Array.isArray(data.content)) {
        setBookings(data.content);
        setTotalBookings(data.totalElements || data.content.length || 0);
      } else if (Array.isArray(data)) {
        setBookings(data);
        setTotalBookings(data.length);
      } else {
        setBookings([]);
        setTotalBookings(0);
      }
      setError('');
    } catch (err) {
      setError(err.message || t('admin.failedToFetchBookings'));
      setSnackbar({
        open: true,
        message: err.message || t('admin.failedToFetchBookings'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleStartDateChange = (e) => {
    setDateRange({ ...dateRange, start: e.target.value });
    setPage(0);
  };

  const handleEndDateChange = (e) => {
    setDateRange({ ...dateRange, end: e.target.value });
    setPage(0);
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleOpenCancelDialog = (booking) => {
    setSelectedBooking(booking);
    setAdminRemark('');
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    if (!adminRemark.trim()) {
      setSnackbar({
        open: true,
        message: t('admin.pleaseProvideRemarkForCancellation'),
        severity: 'warning'
      });
      return;
    }
    try {
      setLoading(true);
      await BookingService.cancelBooking(selectedBooking.id, adminRemark);
      setSnackbar({
        open: true,
        message: t('admin.bookingCancelledSuccessfully').replace('#{id}', selectedBooking.id),
        severity: 'success'
      });
      fetchBookings();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || t('admin.failedToCancelBooking'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
      handleCloseCancelDialog();
    }
  };

  const handleOpenProcessDialog = (booking, action) => {
    setSelectedBooking(booking);
    setProcessAction(action);
    setAdminRemark('');
    setProcessDialogOpen(true);
  };

  // 处理取消请求（批准或拒绝）
  const handleProcessRequest = async () => {
    console.log('Selected booking:', selectedBooking);
    console.log('Cancellation request:', selectedBooking?.cancellationRequest);
    console.log('Process action:', processAction);
    console.log('Admin remark:', adminRemark);
    
    if (!selectedBooking || !selectedBooking.cancellationRequest?.id) {
      console.error('Missing booking or cancellation request ID');
      setSnackbar({
        open: true,
        message: 'Missing cancellation request information',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      await BookingService.processCancelRequest(
        selectedBooking.cancellationRequest.id,
        processAction,
        adminRemark
      );

      setSnackbar({
        open: true,
        message: `Cancel request ${processAction === 'approve' ? 'approved' : 'rejected'} successfully`,
        severity: 'success'
      });
      fetchBookings();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to process request',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setProcessDialogOpen(false);
    }
  };



  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleExportBookings = () => {
    if (!bookings || bookings.length === 0) {
      alert('No bookings to export!');
      return;
    }

    // CSV Header you want
    const header = ['Booking ID', 'Court Date & Time', 'Member', 'Court', 'Status', 'Amount (RM)'];

    // Generate CSV rows
    const rows = bookings.map(b => {
      // Use slot date and time instead of booking date
      let formattedDateTime = 'No slot info';
      
      if (b.bookingSlots && b.bookingSlots.length > 0) {
        // 多 slot 预订：显示时间范围
        const slots = b.bookingSlots.sort((a, b) => 
          new Date(a.slot.startTime) - new Date(b.slot.startTime)
        );
        const firstSlot = slots[0].slot;
        const lastSlot = slots[slots.length - 1].slot;
        formattedDateTime = `${formatSlotDateForExport(firstSlot.date)} ${formatTimeForExport(firstSlot.startTime)} - ${formatTimeForExport(lastSlot.endTime)} (${slots.length} slots)`;
      } else if (b.slotDate && b.startTime && b.endTime) {
        formattedDateTime = `${formatSlotDateForExport(b.slotDate)} ${formatTimeForExport(b.startTime)} - ${formatTimeForExport(b.endTime)}`;
      }
      
      return [
        b.id,
        `"${formattedDateTime}"`,         // Quote in case of comma
        `"${b.memberName || 'Unknown'}"`,
        `"${b.courtName || 'N/A'}"`,
        b.status,
        b.totalAmount?.toFixed(2) ?? '0.00'
      ].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bookings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTimeForExport = (bookingDate) => {
    const date = new Date(bookingDate);
    if (isNaN(date.getTime())) return 'Invalid Date';

    // Example: 25-Jun-2025 08:00 AM
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  const formatSlotDateForExport = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const formatTimeForExport = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  };



  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatSlotDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {t('admin.bookingManagement')}
        </Typography>
      </Box>

      {/* Statistics Dashboard */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, 
        gap: 2, 
        mb: 3 
      }}>
        {/* Total Bookings */}
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
            {totalBookings}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.totalBookings')}
          </Typography>
        </Paper>

        {/* Pending Bookings */}
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
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#ff9800' }}>
            {pendingCount}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.pending')}
          </Typography>
        </Paper>

        {/* Confirmed Bookings */}
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
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#4caf50' }}>
            {confirmedCount}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.confirmed')}
          </Typography>
        </Paper>

        {/* Cancellation Requested */}
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
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#9c27b0' }}>
            {cancellationRequestedCount}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.cancelRequests')}
          </Typography>
        </Paper>

        {/* Cancelled Bookings */}
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
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#f44336' }}>
            {cancelledCount}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.cancelled')}
          </Typography>
        </Paper>


      </Box>

      {/* Search and Actions Bar */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title={t('admin.searchByBookingIdUserOrCourt')} arrow>
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
                    onClick={() => handleSearchChange({ target: { value: '' } })}
                    sx={{ mr: 1 }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>✕</Typography>
                  </IconButton>
                )
              }}
              sx={{ minWidth: 200 }}
            />
          </Tooltip>

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('admin.status')}</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label={t('admin.status')}
            >
              <MenuItem value="">{t('admin.allStatuses')}</MenuItem>
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: option.color,
                      mr: 1.5
                    }} />
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Range Filters */}
          <TextField
            type="date"
            size="small"
            label={t('admin.fromDate')}
            value={dateRange.start}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <TextField
            type="date"
            size="small"
            label={t('admin.toDate')}
            value={dateRange.end}
            onChange={handleEndDateChange}
            disabled={!dateRange.start}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchBookings}
            disabled={loading}
            sx={{
              borderRadius: '8px',
              px: 2,
              py: 1,
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }
            }}
                      >
            {t('admin.refresh')}
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => {
              setDateRange({ start: '', end: '' });
              setStatusFilter('');
              setSearchTerm('');
            }}
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
        </Box>
      </Paper>



      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: '16px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={40} sx={{ color: theme.palette.primary.main }} />
          </Box>
        )}

        {!loading && bookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 6 }}>
            <FilterIcon sx={{ fontSize: 60, color: theme.palette.grey[300], mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, color: theme.palette.text.primary }}>
              {t('admin.noBookingsFound')}
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              {t('admin.tryAdjustingSearchOrFilterCriteria')}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setDateRange({ start: '', end: '' });
              }}
              sx={{
                borderRadius: '8px',
                px: 3,
                py: 1.5,
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }
              }}
                          >
              {t('admin.clearFilters')}
            </Button>
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, minWidth: '80px', maxWidth: '100px' }}>
                  <TableSortLabel
                    active={orderBy === 'id'}
                    direction={orderBy === 'id' ? order : 'desc'}
                    onClick={() => handleSort('id')}
                  >
                    {t('admin.bookingId')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, minWidth: '220px' }}>
                  <TableSortLabel
                    active={orderBy === 'bookingDate'}
                    direction={orderBy === 'bookingDate' ? order : 'desc'}
                    onClick={() => handleSort('bookingDate')}
                  >
                    {t('admin.courtDateAndTime')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.member')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.court')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, minWidth: '120px' }}>{t('admin.status')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, minWidth: '120px' }} align="right">{t('admin.amount')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.actions')}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(bookings ?? []).length > 0 ? (
                (bookings ?? []).map((booking) => {
                  return (
                    <TableRow
                      hover
                      key={booking.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(25, 118, 210, 0.08)'
                            : 'rgba(25, 118, 210, 0.04)'
                        }
                      }}
                    >
                      <TableCell sx={{ px: 1, maxWidth: '100px' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>#{booking.id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                          {booking.bookingSlots && booking.bookingSlots.length > 0 
                            ? (() => {
                                // 多 slot 预订：显示时间范围
                                const slots = booking.bookingSlots.sort((a, b) => 
                                  new Date(a.slot.startTime) - new Date(b.slot.startTime)
                                );
                                const firstSlot = slots[0].slot;
                                const lastSlot = slots[slots.length - 1].slot;
                                return `${formatSlotDate(firstSlot.date)} ${formatTime(firstSlot.startTime)} - ${formatTime(lastSlot.endTime)} (${slots.length} slot${slots.length > 1 ? 's' : ''})`;
                              })()
                            : booking.slotDate && booking.startTime && booking.endTime 
                            ? `${formatSlotDate(booking.slotDate)} ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`
                            : t('admin.noSlotInfo')
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                          {booking.memberName || t('admin.unknownUser')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                          {booking.courtName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: '120px' }}>
                        {getStatusChip(booking.status)}
                      </TableCell>
                      <TableCell align="right" sx={{ px: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                          RM {booking.totalAmount?.toFixed(2) ?? '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title={t('admin.viewDetails')}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewBooking(booking)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          {/* 显示处理按钮当状态为取消请求时 */}
                          {booking.status === 'CANCELLATION_REQUESTED' && (
                            <>
                              <Tooltip title={t('admin.approveCancellation')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenProcessDialog(booking, 'approve')}
                                  sx={{ color: theme.palette.success.main }}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('admin.rejectCancellation')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenProcessDialog(booking, 'reject')}
                                  sx={{ color: theme.palette.error.main }}
                                >
                                  <NotInterestedIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          {/* 取消按钮仅对未完成的预订显示 */}
                          {booking.status !== 'CANCELLED' &&
                            booking.status !== 'COMPLETED' &&
                            booking.status !== 'CANCELLATION_REQUESTED' && (
                              <Tooltip title={t('admin.cancelBooking')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenCancelDialog(booking)}
                                  sx={{
                                    color: theme.palette.error.main,
                                    '&:hover': { backgroundColor: theme.palette.error.main + '10' }
                                  }}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {t('admin.noBookingsFound')}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  colSpan={8}
                  count={totalBookings}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </TableContainer>

      {/* Booking Detail Dialog */}
      <ModernBookingDetailsDialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        booking={selectedBooking}
        cancellationRequest={selectedBooking?.cancellationRequest}
        adminRemark={adminRemark}
        onAdminRemarkChange={setAdminRemark}
        loading={loading}
        isAdmin={true}
      />

      {/* Cancel Booking Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancelDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#fff8e1', borderBottom: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1.5, color: '#ff9800' }} />
            <Typography variant="h6">{t('admin.cancelBookingTitle')}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedBooking && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {t('admin.cancelBookingConfirmation').replace('#{id}', selectedBooking.id)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {t('admin.cancelBookingWarning')}
              </Typography>
              <TextField
                label={t('admin.adminRemark')}
                value={adminRemark}
                onChange={e => setAdminRemark(e.target.value)}
                fullWidth
                required
                multiline
                minRows={2}
                autoFocus
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
          <Button
            onClick={handleCloseCancelDialog}
            variant="outlined"
            sx={{ color: '#5d3587', borderColor: '#5d3587' }}
          >
            {t('admin.keepBooking')}
          </Button>
          <Button
            onClick={handleCancelBooking}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#f44336',
              '&:hover': { backgroundColor: '#d32f2f' },
              ml: 1
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('admin.confirmCancellation')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Process Cancellation Request Dialog */}
      <Dialog
        open={processDialogOpen}
        onClose={() => setProcessDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: processAction === 'approve' ? '#e8f5e9' : '#ffebee',
          borderBottom: '1px solid #eee' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {processAction === 'approve' 
              ? <CheckCircleIcon sx={{ mr: 1.5, color: '#4caf50' }} />
              : <NotInterestedIcon sx={{ mr: 1.5, color: '#f44336' }} />
            }
            <Typography variant="h6">
              {processAction === 'approve' ? t('admin.approveCancellationTitle') : t('admin.rejectCancellationTitle')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedBooking && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {processAction === 'approve'
                  ? t('admin.approveCancellationConfirmation').replace('#{id}', selectedBooking.id)
                  : t('admin.rejectCancellationConfirmation').replace('#{id}', selectedBooking.id)
                }
              </Typography>
              
              <TextField
                label={t('admin.adminRemark')}
                value={adminRemark}
                onChange={e => setAdminRemark(e.target.value)}
                fullWidth
                required
                multiline
                minRows={2}
                autoFocus
                sx={{ mt: 2 }}
                placeholder={processAction === 'approve' 
                  ? t('admin.reasonForApproval')
                  : t('admin.reasonForRejection')
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
          <Button
            onClick={() => setProcessDialogOpen(false)}
            variant="outlined"
            sx={{ color: '#5d3587', borderColor: '#5d3587' }}
          >
            {t('admin.cancel')}
          </Button>
          <Button
            onClick={handleProcessRequest}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: processAction === 'approve' ? '#4caf50' : '#f44336',
              '&:hover': { 
                backgroundColor: processAction === 'approve' ? '#388e3c' : '#d32f2f' 
              },
              ml: 1
            }}
          >
            {loading 
              ? <CircularProgress size={24} color="inherit" /> 
              : processAction === 'approve' ? t('admin.approve') : t('admin.reject')
            }
          </Button>
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

export default AdminManageBookings;