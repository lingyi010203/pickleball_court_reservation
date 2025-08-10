import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Avatar,
  Container,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Checkbox,
  TablePagination,
  TableSortLabel,
  TableFooter
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserService from '../../service/UserService';
import AdminUserForm from './AdminUserForm';
import ConfirmationDialog from './ConfirmationDialog';
import AdminInviteForm from './AdminInviteForm';
import { useTheme, alpha } from '@mui/material/styles';
import { getStatusChip } from './statusConfig';
import { usePageTheme } from '../../hooks/usePageTheme';

const AdminManageUsers = () => {
  const navigate = useNavigate();
  usePageTheme('admin'); // 设置页面类型为admin
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            User Management
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
            Manage users and review type change requests
          </Typography>
        </Box>
      </Box>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3, '& .MuiTab-root.Mui-selected': { color: theme.palette.primary.main } }}>
        <Tab label="Pending Requests" />
        <Tab label="User Management" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 ? (
        <PendingRequestsTab />
      ) : (
        <UserManagementTab inviteOpen={inviteOpen} setInviteOpen={setInviteOpen} />
      )}
    </Container>
  );
};

// Pending Requests Tab Component
const PendingRequestsTab = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [filter, setFilter] = useState('all');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      const response = await axios.get('http://localhost:8081/api/admin/pending-type-changes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPendingRequests(response.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        UserService.logout();
        window.location.href = '/login';
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this page');
      } else {
        setError('Failed to load pending requests. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, requestedType) => {
    try {
      const token = UserService.getAdminToken();
      await axios.put(
        `http://localhost:8081/api/admin/approve-user-type/${userId}`,
        null,
        {
          params: { newType: requestedType },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state 
      setPendingRequests(prev =>
        prev.filter(request => request.userId !== userId)
      );

      setSnackbar({
        open: true,
        message: `Request approved! User type changed to ${requestedType}.`,
        severity: 'success'
      });
    } catch (err) {
      let errorMsg = 'Failed to approve request.';
      if (err.response?.data) {
        errorMsg = err.response.data;
      }
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error'
      });
    }
  };

  const handleReject = async (userId) => {
    setRejectingUserId(userId);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide a reason for rejection.',
        severity: 'error'
      });
      return;
    }

    try {
      const token = UserService.getAdminToken();
      await axios.put(
        `http://localhost:8081/api/admin/reject-user-type/${rejectingUserId}`,
        null,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: { reason: rejectReason }
        }
      );

      // Update local state 
      setPendingRequests(prev =>
        prev.filter(request => request.userId !== rejectingUserId)
      );

      setSnackbar({
        open: true,
        message: 'Request rejected successfully.',
        severity: 'info'
      });
      setRejectDialogOpen(false);
      setRejectReason('');
      setRejectingUserId(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to reject request. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCancelReject = () => {
    setRejectDialogOpen(false);
    setRejectReason('');
    setRejectingUserId(null);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const filteredRequests = filter === 'all'
    ? pendingRequests
    : pendingRequests.filter(req => req.requestedType === filter);

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh'
      }}>
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          sx={{ backgroundColor: theme.palette.primary.main, '&:hover': { backgroundColor: alpha(theme.palette.primary.dark, 0.85) } }}
          onClick={fetchPendingRequests}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <>
      {/* Controls Section */}
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
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={filter}
              onChange={handleFilterChange}
              label="Filter by Type"
            >
              <MenuItem value="all">All Requests</MenuItem>
              <MenuItem value="Coach">Coach Requests</MenuItem>
              <MenuItem value="EventOrganizer">Event Organizer Requests</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchPendingRequests}
            sx={{
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': { borderColor: alpha(theme.palette.primary.dark, 0.85) }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Content Section */}
      {filteredRequests.length === 0 ? (
        <Box sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '16px',
          boxShadow: theme.shadows[2],
          p: 6,
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            No Pending Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filter === 'all'
              ? "All user type change requests have been processed."
              : `No pending ${filter} requests.`}
          </Typography>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <Table sx={{ minWidth: 650 }} aria-label="pending requests table">
            <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Current Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Requested Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.userId} hover>
                  <TableCell>{request.userId}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{request.userName}</TableCell>
                  <TableCell>
                    {getStatusChip(request.currentType?.toUpperCase() || 'USER')}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(request.requestedType?.toUpperCase() || 'USER')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Approve request">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          sx={{
                            backgroundColor: theme.palette.success.main,
                            color: theme.palette.getContrastText(theme.palette.success.main),
                            fontWeight: 'bold',
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 2,
                            py: 0.5,
                            boxShadow: theme.shadows[1],
                            '&:hover': {
                              backgroundColor: theme.palette.success.dark,
                              boxShadow: theme.shadows[3]
                            },
                            minWidth: 110
                          }}
                          onClick={() => handleApprove(request.userId, request.requestedType)}
                        >
                          Approve
                        </Button>
                      </Tooltip>
                      <Tooltip title="Reject request">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CancelIcon />}
                          sx={{
                            backgroundColor: theme.palette.error.main,
                            color: theme.palette.getContrastText(theme.palette.error.main),
                            fontWeight: 'bold',
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 2,
                            py: 0.5,
                            boxShadow: theme.shadows[1],
                            '&:hover': {
                              backgroundColor: theme.palette.error.dark,
                              boxShadow: theme.shadows[3]
                            },
                            minWidth: 110
                          }}
                          onClick={() => handleReject(request.userId)}
                        >
                          Reject
                        </Button>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Reject Reason Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={handleCancelReject}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[10],
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1.2rem',
            pb: 1,
            mb: 1,
            color: theme.palette.error.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <CancelIcon color="error" />
          Reject User Type Change Request
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this user type change request:
          </Typography>
          <TextField
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            required
            multiline
            minRows={3}
            maxRows={5}
            placeholder="Enter the reason for rejection..."
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleCancelReject}
            variant="outlined"
            sx={{ 
              color: theme.palette.text.secondary,
              borderColor: theme.palette.text.secondary
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReject}
            variant="contained"
            color="error"
            disabled={!rejectReason.trim()}
            startIcon={<CancelIcon />}
          >
            Reject Request
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
          sx={{
            backgroundColor: snackbar.severity === 'success' ? '#4caf50' :
              snackbar.severity === 'info' ? '#2196f3' : '#f44336',
            color: 'white',
            fontWeight: '500'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

// User Management Tab Component - FIXED VERSION
const UserManagementTab = ({ inviteOpen, setInviteOpen }) => {
  const [users, setUsers] = useState([]);
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
  const [totalUsers, setTotalUsers] = useState(0);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');

  // 过滤状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // 对话框状态
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const theme = useTheme();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();

      // 修改参数结构以匹配后端控制器
      const params = {
        page,
        size: rowsPerPage,
        sort: orderBy,  // 只传字段名
        direction: order.toLowerCase(), // 方向参数小写
        search: searchTerm,
        status: statusFilter,
        userType: roleFilter
      };

      const response = await axios.get('http://localhost:8081/api/admin/users', {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      if (data.content) {
        setUsers(data.content);
        setTotalUsers(data.totalElements);
      } else {
        setUsers([]);
        setTotalUsers(0);
      }

      setError('');
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);

      if (err.response?.status === 401) {
        UserService.logout();
        window.location.href = '/login';
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this page');
      } else {
        setError('Failed to load users. Please try again later.');
      }

      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Request failed',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Component mounted or dependencies changed");
    fetchUsers();
  }, [page, rowsPerPage, order, orderBy, searchTerm, statusFilter, roleFilter]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    console.log(`Sorting by ${property} ${newOrder}`);

    setOrder(newOrder);
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    console.log("Changing page to:", newPage);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newSize = parseInt(event.target.value, 10);
    console.log("Changing rows per page to:", newSize);
    setRowsPerPage(newSize);
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(0);
  };

  const handleOpenDialog = (user = null) => {
    setCurrentUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
  };

  const handleUserCreated = (newUser) => {
    setSnackbar({
      open: true,
      message: `User ${newUser.name} created successfully!`,
      severity: 'success'
    });
    fetchUsers();
  };

  const handleUserUpdated = (updatedUser) => {
    setSnackbar({
      open: true,
      message: `User ${updatedUser.name} updated successfully!`,
      severity: 'success'
    });
    fetchUsers();
  };

  const handleOpenDeleteDialog = (user) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    try {
      const token = UserService.getAdminToken();
      await axios.delete(`http://localhost:8081/api/admin/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({
        open: true,
        message: `User ${userToDelete.name} deleted successfully!`,
        severity: 'success'
      });

      fetchUsers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.message || 'Deletion failed'}`,
        severity: 'error'
      });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleToggleSelectUser = (userId) => {
    const selectedIndex = selectedUsers.indexOf(userId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedUsers, userId];
    } else {
      newSelected = selectedUsers.filter(id => id !== userId);
    }

    setSelectedUsers(newSelected);
  };

  const handleBatchStatusChange = async (status) => {
    try {
      const token = UserService.getAdminToken();
      await axios.put('http://localhost:8081/api/admin/users/batch-status', {
        userIds: selectedUsers,
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({
        open: true,
        message: `Updated status for ${selectedUsers.length} users`,
        severity: 'success'
      });

      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.message || 'Batch update failed'}`,
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'DELETED', label: 'Deleted' }
  ];

  const roleOptions = [
    { value: 'User', label: 'User' },
    { value: 'Coach', label: 'Coach' },
    { value: 'EventOrganizer', label: 'Event Organizer' },
    { value: 'Admin', label: 'Admin' }
  ];

  if (loading && !users.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ backgroundColor: theme.palette.primary.main, '&:hover': { backgroundColor: alpha(theme.palette.primary.dark, 0.85) } }}
        >
          Add New User
        </Button>
        <Button
          variant="outlined"
          onClick={() => setInviteOpen(true)}
          sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main, '&:hover': { borderColor: alpha(theme.palette.primary.dark, 0.85) } }}
        >
          Send Invitation
        </Button>
      </Box>
      <AdminInviteForm open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2
        }}>
          <TextField
            sx={{ minWidth: 220 }}
            variant="outlined"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              displayEmpty
              renderValue={(selected) => selected || "All Statuses"}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel shrink>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              displayEmpty
              renderValue={(selected) => selected || "All Roles"}
            >
              <MenuItem value="">All Roles</MenuItem>
              {roleOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            sx={{
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              minWidth: 120,
              '&:hover': { borderColor: alpha(theme.palette.primary.dark, 0.85) }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Batch Operation Bar */}
      {selectedUsers.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1">
              {selectedUsers.length} user(s) selected
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Set Status</InputLabel>
              <Select
                value=""
                onChange={(e) => handleBatchStatusChange(e.target.value)}
                label="Set Status"
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="SUSPENDED">Suspend</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleBatchStatusChange('DELETED')}
            >
              Delete Selected
            </Button>
          </Box>
        </Paper>
      )}

      {/* User Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative' }}>
        {/* Loading overlay */}
        {loading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1
          }}>
            <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
          </Box>
        )}

        <Table>
          <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100] }}>
            <TableRow>
              <TableCell padding="checkbox" sx={{ color: theme.palette.text.primary }}>
                <Checkbox
                  indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                  checked={users.length > 0 && selectedUsers.length === users.length}
                  onChange={handleToggleSelectAll}
                  disabled={loading}
                />
              </TableCell>
              <TableCell sx={{ color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleSort('name')}
                  disabled={loading}
                >
                  <Typography sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Name</Typography>
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Join Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!loading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                      No users found
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={fetchUsers}
                    >
                      Refresh Data
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUsers.indexOf(user.id) !== -1}
                      onChange={() => handleToggleSelectUser(user.id)}
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={user.profileImage || ''}
                        sx={{ width: 40, height: 40 }}
                        alt={user.name || 'User'}
                      >
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                      <Box>
                        <Typography fontWeight="500">
                          {user.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{user.username || 'no-username'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email || 'No email'}</TableCell>
                  <TableCell>
                    {getStatusChip(user.userType?.toUpperCase() || 'USER')}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(user.status?.toUpperCase() || 'UNKNOWN')}
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {user.status === 'DELETED' ? (
                        <Tooltip title="View user details (read-only)">
                          <IconButton
                            onClick={() => handleOpenDialog(user)}
                            disabled={loading}
                          >
                            <ViewIcon color="info" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Edit user">
                          <IconButton
                            onClick={() => handleOpenDialog(user)}
                            disabled={loading}
                          >
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete user">
                        <IconButton
                          onClick={() => handleOpenDeleteDialog(user)}
                          disabled={loading}
                        >
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                colSpan={7}
                count={totalUsers}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                disabled={loading}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* User Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[10],
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1.4rem',
            pb: 1,
            mb: 1,
            color: theme.palette.text.primary,
          }}
        >
          {currentUser ? `Edit User: ${currentUser.name}` : 'Create New User'}
        </DialogTitle>
        <DialogContent dividers>
          <AdminUserForm
            user={currentUser}
            onClose={handleCloseDialog}
            onUserCreated={handleUserCreated}
            onUserUpdated={handleUserUpdated}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteUser}
        title="Confirm Deletion"
        content={`Are you sure you want to delete user "${userToDelete?.name}"? This action cannot be undone.`}
      />

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
    </>
  );
};

export default AdminManageUsers;