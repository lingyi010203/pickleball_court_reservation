// AdminManageTiers.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip, Snackbar, Alert,
  CircularProgress, Grid, Chip, Switch, FormControlLabel, MenuItem,
  FormControl, InputLabel, Select, TableSortLabel, DialogContentText, useTheme, alpha, Tabs, Tab,
  InputAdornment, TablePagination, TableFooter
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';
import { getStatusChip, getTierChip } from './statusConfig';
import { formatDateToDDMMYYYY, formatDateForHTMLInput, formatDateFromHTMLInput } from '../../utils/dateUtils';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLanguage } from '../../context/LanguageContext';

const AdminManageTiers = () => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    action: null,
    tierId: null
  });
  const [currentTier, setCurrentTier] = useState(null);
  const [formData, setFormData] = useState({
    tierName: '',
    benefits: '',
    minPoints: 0,
    maxPoints: 0,
    active: true
  });
  const [formErrors, setFormErrors] = useState({
    tierName: '',
    benefits: '',
    minPoints: '',
    maxPoints: '',
    range: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'minPoints',
    direction: 'asc'
  });

  // 分页状态
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTiers, setTotalTiers] = useState(0);

  // 搜索和过滤状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');



  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = UserService.getAdminToken() || UserService.getToken();
      const response = await axios.get('http://localhost:8081/api/admin/tiers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        setTiers(response.data);
        setTotalTiers(response.data.length);
      } else {
        setError('Received invalid tiers data format');
        setTiers([]);
      }
    } catch (err) {
      setError('Failed to fetch tiers. Please try again.');
      console.error('Error fetching tiers:', err);
      setTiers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tier = null) => {
    if (tier) {
      setCurrentTier(tier);
      setFormData({
        tierName: tier.tierName,
        benefits: tier.benefits,
        minPoints: tier.minPoints,
        maxPoints: tier.maxPoints,
        active: tier.active
      });
    } else {
      setCurrentTier(null);
      setFormData({
        tierName: '',
        benefits: '',
        minPoints: 0,
        maxPoints: 0,
        active: true
      });
    }
    setFormErrors({
      tierName: '',
      benefits: '',
      minPoints: '',
      maxPoints: '',
      range: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTier(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'minPoints' || name === 'maxPoints' ? Number(value) : value
    }));

    // 清除对应字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // 清除范围错误
    if (name === 'minPoints' || name === 'maxPoints') {
      setFormErrors(prev => ({
        ...prev,
        range: ''
      }));
    }
  };

  const handleSwitchChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.checked
    }));
  };

  const validateForm = () => {
    const errors = {
      tierName: '',
      benefits: '',
      minPoints: '',
      maxPoints: '',
      range: ''
    };

    let isValid = true;

    // Tier Name 验证
    if (!formData.tierName.trim()) {
      errors.tierName = 'Tier name is required';
      isValid = false;
    } else if (formData.tierName.length > 30) {
      errors.tierName = 'Tier name is too long (max 30 characters)';
      isValid = false;
    }

    // Benefits 验证
    if (!formData.benefits.trim()) {
      errors.benefits = 'Benefits description is required';
      isValid = false;
    }

    // Min Points 验证
    if (formData.minPoints < 0) {
      errors.minPoints = 'Min points must be 0 or greater';
      isValid = false;
    }

    // Max Points 验证
    if (formData.maxPoints <= 0) {
      errors.maxPoints = 'Max points must be greater than 0';
      isValid = false;
    } else if (formData.maxPoints <= formData.minPoints) {
      errors.range = 'Max points must be greater than min points';
      isValid = false;
    }

    // 积分范围重叠验证
    if (isValid) {
      const overlappingTier = tiers.find(tier => {
        // 排除当前编辑的等级
        if (currentTier && tier.id === currentTier.id) return false;

        // 检查范围重叠
        const newMin = formData.minPoints;
        const newMax = formData.maxPoints;
        const existingMin = tier.minPoints;
        const existingMax = tier.maxPoints;

        return (newMin <= existingMax && newMax >= existingMin);
      });

      if (overlappingTier) {
        errors.range = `Points range overlaps with ${overlappingTier.tierName} tier (${overlappingTier.minPoints}-${overlappingTier.maxPoints})`;
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = UserService.getAdminToken() || UserService.getToken();

      if (currentTier) {
        await axios.put(`http://localhost:8081/api/admin/tiers/${currentTier.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Tier updated successfully!', 'success');
      } else {
        await axios.post('http://localhost:8081/api/admin/tiers', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Tier created successfully!', 'success');
      }

      fetchTiers();
      handleCloseDialog();
    } catch (err) {
      showSnackbar(`Error: ${err.response?.data?.message || 'Operation failed'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleDelete = (tierId) => {
    const tier = tiers.find(t => t.id === tierId);
    setConfirmDialog({
      open: true,
      title: 'Confirm Tier Deletion',
      content: `Are you sure you want to delete the "${tier.tierName}" tier? This action cannot be undone.`,
      action: 'delete',
      tierId
    });
  };

  const handleStatusChange = (tierId, active) => {
    const tier = tiers.find(t => t.id === tierId);
    setConfirmDialog({
      open: true,
      title: active ? 'Activate Tier' : 'Deactivate Tier',
      content: active
        ? `Activate "${tier.tierName}" tier? Members will be able to achieve this tier.`
        : `Deactivate "${tier.tierName}" tier? Existing members will keep this tier but new members won't be assigned.`,
      action: active ? 'activate' : 'deactivate',
      tierId
    });
  };

  const confirmAction = async () => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken() || UserService.getToken();
      const { action, tierId } = confirmDialog;

      if (action === 'delete') {
        await axios.delete(`http://localhost:8081/api/admin/tiers/${tierId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Tier deleted successfully!', 'success');
      } else if (action === 'activate' || action === 'deactivate') {
        const active = action === 'activate';
        await axios.put(`http://localhost:8081/api/admin/tiers/${tierId}/status?active=${active}`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar(`Tier ${active ? 'activated' : 'deactivated'} successfully!`, 'success');
      }

      fetchTiers();
    } catch (err) {
      showSnackbar(`Error: ${err.response?.data?.message || 'Operation failed'}`, 'error');
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 过滤和排序逻辑
  const filteredAndSortedTiers = React.useMemo(() => {
    let filtered = tiers;

    // 状态过滤
    if (statusFilter) {
      filtered = filtered.filter(tier => {
        if (statusFilter === 'active') return tier.active;
        if (statusFilter === 'inactive') return !tier.active;
        return true;
      });
    }

    // 排序
    return [...filtered].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [tiers, statusFilter, sortConfig]);

  // 分页逻辑
  const paginatedTiers = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedTiers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedTiers, page, rowsPerPage]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusIcon = (active) => {
    return active ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />;
  };

  if (loading && !tiers.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} sx={{ color: '#8e44ad' }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h5" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#732d91' } }}
            onClick={fetchTiers}
          >
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {t('admin.membershipManagement')}
        </Typography>
      </Box>



      {/* Tabs Navigation */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3, '& .MuiTab-root.Mui-selected': { color: theme.palette.primary.main } }}>
        <Tab label={t('admin.tierManagement')} />
        <Tab label={t('admin.voucherManagement')} />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 ? (
        <TierManagementTab
          tiers={paginatedTiers}
          totalTiers={filteredAndSortedTiers.length}
          sortConfig={sortConfig}
          handleSort={handleSort}
          getStatusIcon={getStatusIcon}
          handleOpenDialog={handleOpenDialog}
          handleDelete={handleDelete}
          statusFilter={statusFilter}
          handleStatusFilterChange={handleStatusFilterChange}
          page={page}
          rowsPerPage={rowsPerPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          loading={loading}
          fetchTiers={fetchTiers}
          clearAllFilters={clearAllFilters}
        />
      ) : (
        <VoucherManagementTab />
      )}

      {/* 添加/编辑等级对话框 */}
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
            top: '20%',
            right: '-5px',
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
              color: theme.palette.primary.main,
              mb: 1
            }}>
              {currentTier ? t('admin.editTier') : t('admin.addNewTier')}
            </Typography>
            <Typography variant="body2" sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500
            }}>
              {currentTier ? t('admin.updateTierDescription') : t('admin.addNewTierDescription')}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ position: 'relative', zIndex: 1 }}>
          {/* Basic Information Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.primary.main,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: '50%'
                }}
              />
              {t('admin.basicInformation')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography
                  component="label"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}
                >
                  {t('admin.tierName')} *
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('admin.enterTierName')}
                  name="tierName"
                  value={formData.tierName}
                  onChange={handleChange}
                  error={!!formErrors.tierName}
                  helperText={formErrors.tierName}
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
              </Grid>

              <Grid item xs={12} md={8}>
                <Typography
                  component="label"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}
                >
                  {t('admin.benefits')} *
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={3}
                  placeholder={t('admin.enterBenefits')}
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  error={!!formErrors.benefits}
                  helperText={formErrors.benefits}
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
              </Grid>
            </Grid>
          </Box>

          {/* Points Configuration Section */}
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
              {t('admin.pointsRange')}
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
                    {t('admin.minPoints')} *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder={t('admin.enterMinPoints')}
                    name="minPoints"
                    value={formData.minPoints}
                    onChange={handleChange}
                    error={!!formErrors.minPoints}
                    helperText={formErrors.minPoints}
                    InputProps={{ inputProps: { min: 0 } }}
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
                    {t('admin.maxPoints')} *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder={t('admin.enterMaxPoints')}
                    name="maxPoints"
                    value={formData.maxPoints}
                    onChange={handleChange}
                    error={!!formErrors.maxPoints}
                    helperText={formErrors.maxPoints}
                    InputProps={{ inputProps: { min: formData.minPoints + 1 } }}
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

            {/* 范围错误提示 */}
            {formErrors.range && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fff8e1',
                padding: '12px 16px',
                borderRadius: '12px',
                borderLeft: '4px solid #ffc107',
                mt: 2
              }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                  {formErrors.range}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Status Configuration Section */}
          <Box sx={{ mb: 2 }}>
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
              {t('admin.tierStatus')}
            </Typography>

            <Box sx={{
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              p: 3,
              border: '1px solid #e5e7eb'
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleSwitchChange}
                    name="active"
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      {t('admin.active')} {t('admin.tierName')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                      {formData.active
                        ? "Active tiers are available for members to achieve"
                        : "Inactive tiers are not available for new members"}
                    </Typography>
                  </Box>
                }
                sx={{ m: 0 }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 4, pt: 2, gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              borderColor: theme.palette.grey[300],
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.main + '10'
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
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              currentTier ? t('admin.update') : t('admin.create')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 确认对话框 */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle sx={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #eee' }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <DialogContentText>
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            variant="outlined"
            sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}
          >
            {t('admin.cancel')}
          </Button>
          <Button
            onClick={confirmAction}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: confirmDialog.action === 'delete' ? '#e74c3c' : '#8e44ad',
              '&:hover': {
                backgroundColor: confirmDialog.action === 'delete' ? '#c0392b' : '#732d91'
              },
              ml: 1
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : confirmDialog.action === 'delete' ? t('admin.delete') : confirmDialog.action === 'activate' ? t('admin.active') : t('admin.inactive')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Tier Management Tab Component
const TierManagementTab = ({
  tiers,
  totalTiers,
  sortConfig,
  handleSort,
  getStatusIcon,
  handleOpenDialog,
  handleDelete,
  statusFilter,
  handleStatusFilterChange,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  loading,
  fetchTiers,
  clearAllFilters
}) => {
  const theme = useTheme();
  const { t } = useLanguage();

  return (
    <Box>
      {/* Add New Tier Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
          {t('admin.addNewTier')}
        </Button>
      </Box>

      {/* Actions Bar */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('admin.status')}</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label={t('admin.status')}
            >
              <MenuItem value="">{t('admin.allStatuses')}</MenuItem>
              <MenuItem value="active">{t('admin.active')}</MenuItem>
              <MenuItem value="inactive">{t('admin.inactive')}</MenuItem>
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
            onClick={fetchTiers}
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
        </Box>
      </Paper>

      {/* Tiers Table */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Table stickyHeader>
          <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={sortConfig.key === 'tierName'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('tierName')}
                >
                  {t('admin.tierName')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={sortConfig.key === 'minPoints'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('minPoints')}
                >
                  {t('admin.minPoints')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={sortConfig.key === 'maxPoints'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('maxPoints')}
                >
                  {t('admin.maxPoints')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.benefits')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.status')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, textAlign: 'center' }}>{t('admin.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tiers.length > 0 ? (
              tiers.map((tier) => (
                <TableRow
                  key={tier.id}
                  sx={{
                    opacity: tier.active ? 1 : 0.8,
                    backgroundColor: tier.active ? 'inherit' : 'rgba(0,0,0,0.02)',
                    '&:hover': {
                      backgroundColor: tier.active ? 'rgba(142, 68, 173, 0.05)' : 'rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 700 }}>{tier.tierName}</Typography>
                      {!tier.active && (
                        <Chip
                          label={t('admin.inactive')}
                          size="small"
                          sx={{
                            ml: 1,
                            backgroundColor: '#f5f5f5',
                            color: '#757575',
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{tier.minPoints.toLocaleString()}</TableCell>
                  <TableCell>{tier.maxPoints.toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {tier.benefits}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(tier.active ? 'ACTIVE' : 'INACTIVE')}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Tooltip title={t('admin.edit')}>
                      <IconButton
                        onClick={() => handleOpenDialog(tier)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('admin.delete')}>
                      <IconButton
                        onClick={() => handleDelete(tier.id)}
                        sx={{ color: '#e74c3c' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {t('admin.noTiersFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Table Pagination */}
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              colSpan={6}
              count={totalTiers}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Rows per page:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
            />
          </TableRow>
        </TableFooter>
      </TableContainer>
    </Box>
  );
};

// Voucher Management Tab Component
const VoucherManagementTab = () => {
  const { t } = useLanguage();
  const [vouchers, setVouchers] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    action: null,
    voucherId: null
  });
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountValue: 0,
    discountType: 'amount',
    requestPoints: 0,
    expiryDate: '',
    tierName: ''
  });
  const [formErrors, setFormErrors] = useState({
    code: '',
    discountValue: '',
    requestPoints: '',
    tierName: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'code',
    direction: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    tierName: '',
    discountType: '',
    expiryStatus: ''
  });
  const theme = useTheme();

  useEffect(() => {
    fetchVouchers();
    fetchTiers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = UserService.getAdminToken() || UserService.getToken();
      const response = await axios.get('http://localhost:8081/api/admin/vouchers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        setVouchers(response.data);
      } else {
        setError('Received invalid vouchers data format');
        setVouchers([]);
      }
    } catch (err) {
      setError('Failed to fetch vouchers. Please try again.');
      console.error('Error fetching vouchers:', err);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const token = UserService.getAdminToken() || UserService.getToken();
      const response = await axios.get('http://localhost:8081/api/admin/tiers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTiers(response.data);
    } catch (err) {
      console.error('Error fetching tiers:', err);
    }
  };

  const handleOpenDialog = (voucher = null) => {
    if (voucher) {
      setCurrentVoucher(voucher);
      setFormData({
        code: voucher.code,
        discountValue: voucher.discountValue,
        discountType: voucher.discountType || 'amount',
        requestPoints: voucher.requestPoints,
        expiryDate: voucher.expiryDate ? formatDateToDDMMYYYY(voucher.expiryDate) : '',
        tierName: voucher.tierName || ''
      });
    } else {
      setCurrentVoucher(null);
      setFormData({
        code: '',
        discountValue: 0,
        discountType: 'amount',
        requestPoints: 0,
        expiryDate: '',
        tierName: ''
      });
    }
    setFormErrors({
      code: '',
      discountValue: '',
      requestPoints: '',
      tierName: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentVoucher(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discountValue' || name === 'requestPoints' ? Number(value) : value
    }));

    // 清除对应字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {
      code: '',
      discountValue: '',
      requestPoints: '',
      tierName: ''
    };

    let isValid = true;

    // Code 验证
    if (!formData.code.trim()) {
      errors.code = 'Voucher code is required';
      isValid = false;
    } else if (formData.code.length > 20) {
      errors.code = 'Voucher code is too long (max 20 characters)';
      isValid = false;
    }

    // Discount Value 验证
    if (formData.discountValue <= 0) {
      errors.discountValue = 'Discount value must be greater than 0';
      isValid = false;
    }

    // Request Points 验证
    if (formData.requestPoints < 0) {
      errors.requestPoints = 'Request points must be 0 or greater';
      isValid = false;
    }

    // Tier Name 验证 - 移除必填验证，允许创建general voucher
    // if (!currentVoucher && !formData.tierName.trim()) {
    //   errors.tierName = 'Tier name is required';
    //   isValid = false;
    // }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = UserService.getAdminToken() || UserService.getToken();

      // 准备提交的数据，处理expiry date
      const submitData = {
        ...formData,
        expiryDate: formData.expiryDate || null // 如果为空字符串则设为null
      };

      if (currentVoucher) {
        // Update existing voucher
        await axios.put(`http://localhost:8081/api/admin/vouchers/${currentVoucher.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Voucher updated successfully!', 'success');
      } else {
        // Create new voucher
        if (formData.tierName && formData.tierName.trim()) {
          try {
            // Try to create tier-specific voucher first
            await axios.post(`http://localhost:8081/api/admin/${formData.tierName}/vouchers`, submitData, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err) {
            // If tier doesn't exist, create general voucher instead
            if (err.response?.status === 400 && err.response?.data?.message?.includes("Tier not found")) {
              console.log(`Tier ${formData.tierName} not found, creating general voucher instead`);
              await axios.post(`http://localhost:8081/api/admin/vouchers`, submitData, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } else {
              throw err; // Re-throw other errors
            }
          }
        } else {
          // Create general voucher (no tier association)
          await axios.post(`http://localhost:8081/api/admin/vouchers`, submitData, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        showSnackbar('Voucher created successfully!', 'success');
      }

      fetchVouchers();
      handleCloseDialog();
    } catch (err) {
      showSnackbar(`Error: ${err.response?.data?.message || 'Operation failed'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleDelete = (voucherId) => {
    const voucher = vouchers.find(v => v.id === voucherId);
    setConfirmDialog({
      open: true,
      title: 'Confirm Voucher Deletion',
      content: `Are you sure you want to delete the voucher "${voucher.code}"? This action cannot be undone.`,
      action: 'delete',
      voucherId
    });
  };

  const confirmAction = async () => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken() || UserService.getToken();
      const { action, voucherId } = confirmDialog;

      if (action === 'delete') {
        await axios.delete(`http://localhost:8081/api/admin/vouchers/${voucherId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Voucher deleted successfully!', 'success');
      }

      fetchVouchers();
    } catch (err) {
      showSnackbar(`Error: ${err.response?.data?.message || 'Operation failed'}`, 'error');
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      tierName: '',
      discountType: '',
      expiryStatus: ''
    });
  };

  const sortedAndFilteredVouchers = React.useMemo(() => {
    let filtered = vouchers;

    // 搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(voucher =>
        voucher.code.toLowerCase().includes(term) ||
        (voucher.tierName && voucher.tierName.toLowerCase().includes(term))
      );
    }

    // Tier过滤器
    if (filters.tierName) {
      if (filters.tierName === 'no-tier') {
        filtered = filtered.filter(voucher => !voucher.tierName);
      } else {
        filtered = filtered.filter(voucher => voucher.tierName === filters.tierName);
      }
    }

    // Discount Type过滤器
    if (filters.discountType) {
      filtered = filtered.filter(voucher => voucher.discountType === filters.discountType);
    }

    // Expiry Status过滤器
    if (filters.expiryStatus) {
      if (filters.expiryStatus === 'has-expiry') {
        filtered = filtered.filter(voucher => voucher.expiryDate);
      } else if (filters.expiryStatus === 'no-expiry') {
        filtered = filtered.filter(voucher => !voucher.expiryDate);
      }
    }

    // 排序
    return [...filtered].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [vouchers, searchTerm, filters, sortConfig]);

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading && !vouchers.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} sx={{ color: '#8e44ad' }} />
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
          sx={{ backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#732d91' } }}
          onClick={fetchVouchers}
        >
          {t('admin.refresh')}
        </Button>
      </Box>
    );
  }

  return (
    <>
      {/* Add New Voucher Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
          {t('admin.addNewVoucher')}
        </Button>
      </Box>

      {/* Search and Actions Bar */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title={t('admin.search')} arrow>
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

          {/* Tier Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('admin.tierName')}</InputLabel>
            <Select
              value={filters.tierName}
              onChange={(e) => handleFilterChange('tierName', e.target.value)}
              label={t('admin.tierName')}
            >
              <MenuItem value="">{t('admin.allTiers')}</MenuItem>
              <MenuItem value="no-tier">{t('admin.general')}</MenuItem>
              {tiers.map((tier) => (
                <MenuItem key={tier.id} value={tier.tierName}>
                  {tier.tierName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Discount Type Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('admin.discountType')}</InputLabel>
            <Select
              value={filters.discountType}
              onChange={(e) => handleFilterChange('discountType', e.target.value)}
              label={t('admin.discountType')}
            >
              <MenuItem value="">{t('admin.allTypes')}</MenuItem>
              <MenuItem value="amount">{t('admin.amount')}</MenuItem>
              <MenuItem value="percentage">{t('admin.percentage')}</MenuItem>
            </Select>
          </FormControl>

          {/* Expiry Status Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Expiry Status</InputLabel>
            <Select
              value={filters.expiryStatus}
              onChange={(e) => handleFilterChange('expiryStatus', e.target.value)}
              label="Expiry Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="has-expiry">Has Expiry Date</MenuItem>
              <MenuItem value="no-expiry">No Expiry Date</MenuItem>
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
            onClick={fetchVouchers}
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
        </Box>
      </Paper>

      {/* Vouchers Table */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Table stickyHeader>
          <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={sortConfig.key === 'code'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('code')}
                >
                  {t('admin.voucherCode')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={sortConfig.key === 'discountValue'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('discountValue')}
                >
                  {t('admin.discountValue')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={sortConfig.key === 'requestPoints'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('requestPoints')}
                >
                  {t('admin.requestPoints')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.tierName')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.expiryDate')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, textAlign: 'center' }}>{t('admin.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAndFilteredVouchers.length > 0 ? (
              sortedAndFilteredVouchers.map((voucher) => (
                <TableRow
                  key={voucher.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(142, 68, 173, 0.05)'
                    }
                  }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>{voucher.code}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : `RM${voucher.discountValue}`}
                      color={voucher.discountType === 'percentage' ? 'secondary' : 'primary'}
                      size="small"
                      sx={{
                        backgroundColor: voucher.discountType === 'percentage' ? '#9c27b0' : '#1976d2',
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: voucher.discountType === 'percentage' ? '#7b1fa2' : '#1565c0'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{voucher.requestPoints.toLocaleString()}</TableCell>
                  <TableCell>
                    {getTierChip(voucher.tierName)}
                  </TableCell>
                  <TableCell>
                    {voucher.expiryDate ? (
                      <Typography variant="body2">
                        {formatDateToDDMMYYYY(voucher.expiryDate)}
                      </Typography>
                    ) : (
                      <Chip label={t('admin.general')} size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Tooltip title={t('admin.edit')}>
                      <IconButton
                        onClick={() => handleOpenDialog(voucher)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('admin.delete')}>
                      <IconButton
                        onClick={() => handleDelete(voucher.id)}
                        sx={{ color: '#e74c3c' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {t('admin.noVouchersFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Voucher Dialog */}
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
            top: '20%',
            right: '-5px',
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
              color: theme.palette.primary.main,
              mb: 1
            }}>
              {currentVoucher ? t('admin.editVoucher') : t('admin.addNewVoucher')}
            </Typography>
            <Typography variant="body2" sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500
            }}>
              {currentVoucher ? t('admin.updateVoucherDescription') : t('admin.addNewVoucherDescription')}
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
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.voucherCode')} *
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={t('admin.enterVoucherCode')}
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    error={!!formErrors.code}
                    helperText={formErrors.code}
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

          {/* Discount Configuration Section */}
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
              {t('admin.voucherInformation')}
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
                    {t('admin.discountValue')} *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder={t('admin.enterDiscountValue')}
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    error={!!formErrors.discountValue}
                    helperText={formErrors.discountValue}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
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
                    {t('admin.discountType')} *
                  </Typography>
                  <FormControl fullWidth error={!!formErrors.discountType}>
                    <Select
                      name="discountType"
                      value={formData.discountType}
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
                      <MenuItem value="amount">{t('admin.amount')} (RM)</MenuItem>
                      <MenuItem value="percentage">{t('admin.percentage')} (%)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Points and Expiry Section */}
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
              {t('admin.requestPoints')} & {t('admin.expiryDate')}
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
                    {t('admin.requestPoints')} *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder={t('admin.enterRequestPoints')}
                    name="requestPoints"
                    value={formData.requestPoints}
                    onChange={handleChange}
                    error={!!formErrors.requestPoints}
                    helperText={formErrors.requestPoints}
                    InputProps={{ inputProps: { min: 0 } }}
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
                    {t('admin.expiryDate')}
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    name="expiryDate"
                    value={formatDateForHTMLInput(formData.expiryDate)}
                    onChange={(e) => {
                      const { value } = e.target;
                      if (value) {
                        // 将yyyy-MM-dd格式转换为dd-MM-yyyy格式
                        const formattedDate = formatDateFromHTMLInput(value);
                        setFormData(prev => ({
                          ...prev,
                          expiryDate: formattedDate
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          expiryDate: ''
                        }));
                      }
                    }}
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

          {/* Tier Assignment Section */}
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
              {t('admin.tierName')} {t('admin.assignment')}
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
                    Tier Name
                  </Typography>
                  <FormControl fullWidth error={!!formErrors.tierName}>
                    <Select
                      name="tierName"
                      value={formData.tierName}
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
                      <MenuItem value="">
                        <em>No Tier (General Voucher)</em>
                      </MenuItem>
                      {tiers.map((tier) => (
                        <MenuItem key={tier.id} value={tier.tierName}>
                          {tier.tierName}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.tierName && (
                      <Typography variant="caption" color="error">
                        {formErrors.tierName}
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 4, pt: 2, gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              borderColor: theme.palette.grey[300],
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.main + '10'
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
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              currentVoucher ? t('admin.update') : t('admin.create')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle sx={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #eee' }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <DialogContentText>
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            variant="outlined"
            sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}
          >
            {t('admin.cancel')}
          </Button>
          <Button
            onClick={confirmAction}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#e74c3c',
              '&:hover': { backgroundColor: '#c0392b' },
              ml: 1
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('admin.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminManageTiers;