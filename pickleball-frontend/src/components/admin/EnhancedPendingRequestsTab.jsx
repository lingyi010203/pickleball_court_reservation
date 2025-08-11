import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Button, CircularProgress,
  Snackbar, Alert, Select, MenuItem, FormControl, InputLabel,
  Tooltip, Avatar, Grid, Checkbox, TablePagination, TextField, IconButton, useTheme, alpha,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, FilterList as FilterIcon, Search as SearchIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import UserService from '../../service/UserService';
import UserTypeChangeRequestService from '../../service/UserTypeChangeRequestService';
import { usePageTheme } from '../../hooks/usePageTheme';
import { getStatusChip } from './statusConfig';
import { useLanguage } from '../../context/LanguageContext';

const EnhancedPendingRequestsTab = () => {
  const theme = useTheme();
  const { t } = useLanguage();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);
  const [filters, setFilters] = useState({ status: '', requestedUserType: '', searchTerm: '' });
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [statistics, setStatistics] = useState({
    pendingRequests: 0, approvedRequests: 0, rejectedRequests: 0
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: '',
    request: null,
    title: '',
    content: ''
  });

  useEffect(() => {
    fetchRequests();
    fetchStatistics();
  }, [page, rowsPerPage, filters]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: page.toString(),
        size: rowsPerPage.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.requestedUserType && { requestedUserType: filters.requestedUserType }),
        ...(filters.searchTerm && { searchTerm: filters.searchTerm })
      };

      const response = await UserTypeChangeRequestService.getRequests(params);
      setRequests(response.content);
      setTotalRequests(response.totalElements);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        UserService.logout();
        window.location.href = '/login';
      } else {
        setError(t('admin.failedToLoadRequests'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await UserTypeChangeRequestService.getRequestStatistics();
      setStatistics(response);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleProcessRequest = async (requestId, action) => {
    try {
      await UserTypeChangeRequestService.processRequest(requestId, {
        action,
        adminNotes: `${action}ed by admin`,
        processedBy: 'Admin' // Add processedBy field
      });

      setSnackbar({
        open: true,
        message: action === 'APPROVE' ? t('admin.requestApprovedSuccessfully') : t('admin.requestRejectedSuccessfully'),
        severity: 'success'
      });
      
      fetchRequests();
      fetchStatistics();
    } catch (err) {
      setSnackbar({
        open: true,
        message: action === 'APPROVE' ? t('admin.failedToApproveRequest') : t('admin.failedToRejectRequest'),
        severity: 'error'
      });
    }
  };

  const handleConfirmProcessRequest = (request, action) => {
    const currentType = request.currentUserType || 'User';
    const requestedType = request.requestedUserType || 'User';
    
    if (action === 'APPROVE') {
      setConfirmDialog({
        open: true,
        action: 'APPROVE',
        request: request,
        title: t('admin.confirmApproveRequest'),
        content: t('admin.approveRequestDescription').replace('{currentType}', currentType).replace('{requestedType}', requestedType)
      });
    } else if (action === 'REJECT') {
      setConfirmDialog({
        open: true,
        action: 'REJECT',
        request: request,
        title: t('admin.confirmRejectRequest'),
        content: t('admin.rejectRequestDescription').replace('{currentType}', currentType).replace('{requestedType}', requestedType)
      });
    }
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog({
      open: false,
      action: '',
      request: null,
      title: '',
      content: ''
    });
  };

  const handleConfirmDialogConfirm = async () => {
    if (confirmDialog.request && confirmDialog.action) {
      await handleProcessRequest(confirmDialog.request.id, confirmDialog.action);
      handleConfirmDialogClose();
    }
  };

  const handleBatchProcess = async (action) => {
    if (selectedRequests.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select requests to process.',
        severity: 'warning'
      });
      return;
    }

    try {
      await UserTypeChangeRequestService.batchProcessRequests({
        requestIds: selectedRequests,
        action,
        adminNotes: `Batch ${action.toLowerCase()}d by admin`,
        processedBy: 'Admin' // Add processedBy field
      });

      setSnackbar({
        open: true,
        message: action === 'APPROVE' ? t('admin.batchApproveSuccess') : t('admin.batchRejectSuccess'),
        severity: 'success'
      });
      
      setSelectedRequests([]);
      fetchRequests();
      fetchStatistics();
    } catch (err) {
      setSnackbar({
        open: true,
        message: action === 'APPROVE' ? t('admin.failedToBatchApprove') : t('admin.failedToBatchReject'),
        severity: 'error'
      });
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const clearAllFilters = () => {
    setFilters({ status: '', requestedUserType: '', searchTerm: '' });
    setPage(0);
  };

  const handleToggleSelectAll = () => {
    if (selectedRequests.length === requests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(requests.map(req => req.id));
    }
  };

  const handleToggleSelectRequest = (requestId) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>{error}</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchRequests}>
          {t('admin.tryAgain')}
        </Button>
      </Box>
    );
  }

  return (
    <>
             {/* Statistics Dashboard */}
       <Box sx={{ 
         display: 'grid', 
         gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, 
         gap: 2, 
         mb: 3 
       }}>
         {/* Total Requests */}
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
             {statistics.pendingRequests + statistics.approvedRequests + statistics.rejectedRequests}
           </Typography>
           <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
             {t('admin.totalRequests')}
           </Typography>
         </Paper>

         {/* Pending Requests */}
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
             borderColor: theme.palette.warning.main
           }
         }}>
           <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.warning.main }}>
             {statistics.pendingRequests}
           </Typography>
           <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
             {t('admin.pendingRequests')}
           </Typography>
         </Paper>

         {/* Approved Requests */}
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
             borderColor: theme.palette.success.main
           }
         }}>
           <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.success.main }}>
             {statistics.approvedRequests}
           </Typography>
           <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
             {t('admin.approvedRequests')}
           </Typography>
         </Paper>

         {/* Rejected Requests */}
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
             borderColor: theme.palette.error.main
           }
         }}>
           <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.error.main }}>
             {statistics.rejectedRequests}
           </Typography>
           <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
             {t('admin.rejectedRequests')}
           </Typography>
         </Paper>
       </Box>

      {/* Controls */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        backgroundColor: theme.palette.background.paper,
        borderRadius: '16px',
        boxShadow: theme.shadows[1],
        p: 2
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label={t('admin.search')}
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('admin.status')}</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label={t('admin.status')}
            >
              <MenuItem value="">{t('admin.allStatus')}</MenuItem>
              <MenuItem value="PENDING">{t('admin.pending')}</MenuItem>
              <MenuItem value="APPROVED">{t('admin.approved')}</MenuItem>
              <MenuItem value="REJECTED">{t('admin.rejected')}</MenuItem>
            </Select>
          </FormControl>
          
                                           <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('admin.requestedType')}</InputLabel>
              <Select
                value={filters.requestedUserType}
                onChange={(e) => handleFilterChange('requestedUserType', e.target.value)}
                label={t('admin.requestedType')}
              >
                <MenuItem value="">{t('admin.allTypes')}</MenuItem>
                <MenuItem value="Coach">{t('admin.coach')}</MenuItem>
                <MenuItem value="EventOrganizer">{t('admin.eventOrganizer')}</MenuItem>
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
            onClick={fetchRequests}
            sx={{ 
              borderColor: theme.palette.primary.main, 
              color: theme.palette.primary.main, 
              minWidth: 120,
              borderRadius: '8px',
              px: 2,
              py: 1,
              '&:hover': { 
                borderColor: alpha(theme.palette.primary.dark, 0.85),
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }
            }}
          >
            {t('admin.refresh')}
          </Button>
          
          {selectedRequests.length > 0 && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleBatchProcess('APPROVE')}
              >
                {t('admin.approve')} ({selectedRequests.length})
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleBatchProcess('REJECT')}
              >
                {t('admin.reject')} ({selectedRequests.length})
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100] }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedRequests.length === requests.length && requests.length > 0}
                  indeterminate={selectedRequests.length > 0 && selectedRequests.length < requests.length}
                  onChange={handleToggleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('admin.user')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('admin.currentType')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('admin.requestedType')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('admin.requestDate')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('admin.status')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('admin.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id} hover selected={selectedRequests.includes(request.id)}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedRequests.includes(request.id)}
                    onChange={() => handleToggleSelectRequest(request.id)}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={request.userProfileImage} sx={{ width: 32, height: 32 }}>
                      {request.userName?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{request.userName}</Typography>
                      <Typography variant="caption" color="text.secondary">{request.userEmail}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{getStatusChip(request.currentUserType?.toUpperCase() || 'USER')}</TableCell>
                <TableCell>{getStatusChip(request.requestedUserType?.toUpperCase() || 'USER')}</TableCell>
                <TableCell>{new Date(request.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip 
                    label={request.status} 
                    color={request.status === 'PENDING' ? 'warning' : request.status === 'APPROVED' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                                         {request.status === 'PENDING' && (
                       <>
                         <Tooltip title={t('admin.approveRequest')}>
                           <IconButton
                             size="small"
                             color="success"
                             onClick={() => handleConfirmProcessRequest(request, 'APPROVE')}
                           >
                             <CheckCircleIcon />
                           </IconButton>
                         </Tooltip>
                         <Tooltip title={t('admin.rejectRequest')}>
                           <IconButton
                             size="small"
                             color="error"
                             onClick={() => handleConfirmProcessRequest(request, 'REJECT')}
                           >
                             <CancelIcon />
                           </IconButton>
                         </Tooltip>
                       </>
                     )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <TablePagination
          component="div"
          count={totalRequests}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmDialogClose}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 6,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          color: confirmDialog.action === 'APPROVE' ? 'success.main' : 'error.main',
          pb: 1 
        }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {confirmDialog.content}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            onClick={handleConfirmDialogClose}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              px: 3,
              py: 1.2,
              minWidth: 120
            }}
          >
            {t('admin.cancel')}
          </Button>
          <Button
            onClick={handleConfirmDialogConfirm}
            variant="contained"
            color={confirmDialog.action === 'APPROVE' ? 'success' : 'error'}
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              py: 1.2,
              minWidth: 160,
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}
          >
            {t('admin.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EnhancedPendingRequestsTab;
