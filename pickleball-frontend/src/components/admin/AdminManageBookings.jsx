import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip, Snackbar, Alert,
  CircularProgress, Grid, Chip, MenuItem, FormControl, InputLabel, Select,
  TablePagination, TableSortLabel, TextField, Divider, Checkbox,
  Card, CardContent, Avatar, List, ListItem, ListItemText, TableFooter
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
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  FileDownload as ExportIcon,
  CheckCircle as CheckCircleIcon,
  NotInterested as NotInterestedIcon
} from '@mui/icons-material';
import BookingService from '../../service/BookingService';
import ModernBookingDetailsDialog from './ModernBookingDetailsDialog';
import { getStatusChip } from './statusConfig';

const AdminManageBookings = () => {
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
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [adminRemark, setAdminRemark] = useState('');
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processAction, setProcessAction] = useState('approve'); // 'approve' 或 'reject'


  // 状态选项
  const statusOptions = [
    { value: 'PENDING', label: 'Pending', color: '#ff9800' },
    { value: 'CONFIRMED', label: 'Confirmed', color: '#4caf50' },
    { value: 'CANCELLED', label: 'Cancelled', color: '#f44336' },
    { value: 'COMPLETED', label: 'Completed', color: '#2196f3' },
    { value: 'CANCELLATION_REQUESTED', label: 'Cancel Requested', color: '#9c27b0' }
  ];

  useEffect(() => {
    fetchBookings();
  }, [page, rowsPerPage, order, orderBy, searchTerm, statusFilter, dateRange]);

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
      setError(err.message || 'Failed to fetch bookings');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to fetch bookings',
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
        message: 'Please provide a remark for this cancellation.',
        severity: 'warning'
      });
      return;
    }
    try {
      setLoading(true);
      await BookingService.cancelBooking(selectedBooking.id, adminRemark);
      setSnackbar({
        open: true,
        message: `Booking #${selectedBooking.id} cancelled successfully`,
        severity: 'success'
      });
      fetchBookings();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to cancel booking',
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
    if (!selectedBooking || !selectedBooking.cancellationRequest?.id) return;

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

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = bookings.map((b) => b.id);
      setSelectedBookings(newSelecteds);
      return;
    }
    setSelectedBookings([]);
  };

  const handleSelectBooking = (event, id) => {
    const selectedIndex = selectedBookings.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedBookings, id];
    } else {
      newSelected = selectedBookings.filter((b) => b !== id);
    }

    setSelectedBookings(newSelected);
  };

  const handleBatchCancel = async () => {
    if (selectedBookings.length === 0) return;

    try {
      setLoading(true);
      await Promise.all(selectedBookings.map(id => BookingService.cancelBooking(id)));
      setSnackbar({
        open: true,
        message: `${selectedBookings.length} bookings cancelled successfully`,
        severity: 'success'
      });
      setSelectedBookings([]);
      fetchBookings();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to cancel some bookings',
        severity: 'error'
      });
    } finally {
      setLoading(false);
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
    const header = ['Booking ID', 'Date & Time', 'Member', 'Court', 'Status', 'Amount (RM)'];

    // Generate CSV rows
    const rows = bookings.map(b => {
      // You can use your own date formatter
      const formattedDateTime = formatDateTimeForExport(b.bookingDate);
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

  const isSelected = (id) => selectedBookings.indexOf(id) !== -1;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#5d3587' }}>
            Booking Management
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            Manage and track all court bookings
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchBookings}
          sx={{ borderColor: '#8e44ad', color: '#8e44ad' }}
        >
          Refresh
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel shrink>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                displayEmpty
                renderValue={(selected) => selected || "All Statuses"}
              >
                <MenuItem value="">All Statuses</MenuItem>
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
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={dateRange.start}
              onChange={handleStartDateChange}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={dateRange.end}
              onChange={handleEndDateChange}
              disabled={!dateRange.start}
            />
          </Grid>

          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => {
                setDateRange({ start: '', end: '' });
                setStatusFilter('');
                setSearchTerm('');
              }}
              sx={{ height: '100%' }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Batch Operation Bar */}
      {selectedBookings.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="subtitle1">
              {selectedBookings.length} booking(s) selected
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* 添加更多批量操作 */}
              <Button
                variant="outlined"
                startIcon={<ReceiptIcon />}
                onClick={() => handleExportBookings(selectedBookings)}
              >
                Export Selected
              </Button>

              <Button
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleBatchCancel}
                disabled={loading}
              >
                Cancel Selected
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={40} sx={{ color: '#8e44ad' }} />
          </Box>
        )}

        {!loading && bookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 6 }}>
            <FilterIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No bookings found
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Try adjusting your search or filter criteria
            </Typography>
            <Button variant="outlined" onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setDateRange({ start: '', end: '' });
            }}>
              Clear Filters
            </Button>
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      (selectedBookings?.length ?? 0) > 0 &&
                      (selectedBookings?.length ?? 0) < (bookings?.length ?? 0)
                    }
                    checked={
                      (bookings?.length ?? 0) > 0 &&
                      (selectedBookings?.length ?? 0) === (bookings?.length ?? 0)
                    }
                    onChange={handleSelectAllClick}
                    disabled={loading}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={orderBy === 'id'}
                    direction={orderBy === 'id' ? order : 'desc'}
                    onClick={() => handleSort('id')}
                  >
                    Booking ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={orderBy === 'bookingDate'}
                    direction={orderBy === 'bookingDate' ? order : 'desc'}
                    onClick={() => handleSort('bookingDate')}
                  >
                    Date & Time
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Court</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount (RM)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(bookings ?? []).length > 0 ? (
                (bookings ?? []).map((booking) => {
                  const isItemSelected = isSelected(booking.id);
                  return (
                    <TableRow
                      key={booking.id}
                      hover
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onChange={(event) => handleSelectBooking(event, booking.id)}
                          disabled={booking.status === 'CANCELLED' || loading}
                        />
                      </TableCell>
                      <TableCell>#{booking.id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DateIcon sx={{ color: '#9e9e9e', fontSize: 18, mr: 1 }} />
                          <Typography variant="body2">
                            {formatDate(booking.bookingDate)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#8e44ad' }}>
                            {booking.memberName?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography>{booking.memberName || 'Unknown User'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CourtIcon sx={{ color: '#4caf50', mr: 1 }} />
                          <Typography>{booking.courtName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(booking.status)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="500">
                          {booking.totalAmount?.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewBooking(booking)}
                              sx={{ color: '#5d3587' }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          {/* 显示处理按钮当状态为取消请求时 */}
                          {booking.status === 'CANCELLATION_REQUESTED' && (
                            <>
                              <Tooltip title="Approve cancellation">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenProcessDialog(booking, 'approve')}
                                  sx={{ color: '#4caf50' }}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject cancellation">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenProcessDialog(booking, 'reject')}
                                  sx={{ color: '#f44336' }}
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
                              <Tooltip title="Cancel booking">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenCancelDialog(booking)}
                                  sx={{
                                    color: '#f44336',
                                    '&:hover': { backgroundColor: '#f4433610' }
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
                    No bookings found.
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
            <Typography variant="h6">Cancel Booking</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedBooking && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to cancel booking <b>#{selectedBooking.id}</b>?
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                This action cannot be undone. A cancellation notice will be sent to the member.
              </Typography>
              <TextField
                label="Admin Remark"
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
            Keep Booking
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Cancellation'}
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
              {processAction === 'approve' ? 'Approve' : 'Reject'} Cancellation
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedBooking && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {processAction === 'approve'
                  ? `Approve cancellation for booking #${selectedBooking.id}?`
                  : `Reject cancellation request for booking #${selectedBooking.id}?`
                }
              </Typography>
              
              <TextField
                label="Admin Remark"
                value={adminRemark}
                onChange={e => setAdminRemark(e.target.value)}
                fullWidth
                required
                multiline
                minRows={2}
                autoFocus
                sx={{ mt: 2 }}
                placeholder={processAction === 'approve' 
                  ? "Reason for approval (optional)"
                  : "Reason for rejection"
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
            Cancel
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
              : processAction === 'approve' ? 'Approve' : 'Reject'
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