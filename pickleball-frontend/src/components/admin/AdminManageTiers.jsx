// AdminManageTiers.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip, Snackbar, Alert,
  CircularProgress, Grid, Chip, Switch, FormControlLabel, MenuItem, 
  FormControl, InputLabel, Select, TableSortLabel, DialogContentText
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  ArrowBack as BackIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';

const AdminManageTiers = () => {
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
  //const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = UserService.getAdminToken();
      const response = await axios.get('http://localhost:8081/api/admin/tiers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(response.data)) {
        setTiers(response.data);
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
      const token = UserService.getAdminToken();

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
      const token = UserService.getAdminToken();
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

  //const handleSearchChange = (e) => {
  //  setSearchTerm(e.target.value);
  //};

  // 保证 sortedAndFilteredTiers 始终为数组，直接用 tiers 排序，不用 searchTerm
  const sortedAndFilteredTiers = React.useMemo(() => {
    let filtered = tiers;
    // 搜索相关逻辑已注释
    // if (searchTerm) {
    //   const term = searchTerm.toLowerCase();
    //   filtered = tiers.filter(tier => 
    //     tier.tierName.toLowerCase().includes(term) || 
    //     tier.benefits.toLowerCase().includes(term)
    //   );
    // }
    return [...filtered].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [tiers, sortConfig]);

  const getStatusIcon = (active) => {
    return active ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />;
  };

  if (loading && !tiers.length) {
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
          onClick={fetchTiers}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#5d3587', mb: { xs: 2, sm: 0 } }}>
          Membership Tier Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            backgroundColor: '#8e44ad', 
            '&:hover': { backgroundColor: '#732d91' },
            boxShadow: '0 4px 6px rgba(142, 68, 173, 0.3)'
          }}
        >
          Add New Tier
        </Button>
      </Box>

      {/* 搜索栏 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          {/* <TextField
            fullWidth
            variant="outlined"
            label="Search tiers by name or benefits"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <InfoIcon sx={{ color: 'action.active', mr: 1 }} />
            }}
          /> */}
        </Grid>
      </Grid>

      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: '16px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          maxHeight: 'calc(100vh - 250px)',
          overflowY: 'auto'
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <TableSortLabel
                  active={sortConfig.key === 'tierName'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('tierName')}
                >
                  Tier Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <TableSortLabel
                  active={sortConfig.key === 'minPoints'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('minPoints')}
                >
                  Min Points
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <TableSortLabel
                  active={sortConfig.key === 'maxPoints'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('maxPoints')}
                >
                  Max Points
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Benefits</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAndFilteredTiers.length > 0 ? (
              sortedAndFilteredTiers.map((tier) => (
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
                      <Typography sx={{ fontWeight: 600 }}>{tier.tierName}</Typography>
                      {!tier.active && (
                        <Chip 
                          label="Inactive" 
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
                    <Chip
                      icon={getStatusIcon(tier.active)}
                      label={tier.active ? 'Active' : 'Inactive'}
                      sx={{
                        backgroundColor: tier.active ? '#d5f5e3' : '#f5f5f5',
                        color: tier.active ? '#27ae60' : '#757575',
                        fontWeight: 'bold',
                        border: tier.active ? 'none' : '1px solid #e0e0e0'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Tooltip title="Edit">
                      <IconButton 
                        onClick={() => handleOpenDialog(tier)}
                        sx={{ color: '#5d3587' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        onClick={() => handleDelete(tier.id)}
                        sx={{ color: '#e74c3c' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={tier.active ? "Deactivate tier" : "Activate tier"}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={tier.active}
                            onChange={(e) => handleStatusChange(tier.id, e.target.checked)}
                            name="active"
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="textSecondary">
                    No tiers found
                  </Typography>
                  <Typography color="textSecondary" sx={{ mt: 1 }}>
                    Try adjusting your search or create a new tier
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 添加/编辑等级对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ 
          backgroundColor: '#f5f5f5', 
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          padding: '16px 24px'
        }}>
          {currentTier ? (
            <>
              <EditIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Edit {currentTier.tierName} Tier
              </Typography>
            </>
          ) : (
            <>
              <AddIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Create New Tier
              </Typography>
            </>
          )}
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={2}>
            {/* Tier Name 字段 - 改为自由输入 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tier Name *"
                name="tierName"
                value={formData.tierName}
                onChange={handleChange}
                error={!!formErrors.tierName}
                helperText={formErrors.tierName}
                required
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                Example: Silver, Gold, Platinum
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Benefits *"
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Describe the benefits for this tier..."
                error={!!formErrors.benefits}
                helperText={formErrors.benefits}
                required
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                Example: 10% discount on all bookings, 2 free bookings per month
              </Typography>
            </Grid>

            {/* 积分范围 - 添加重叠验证 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Points *"
                name="minPoints"
                value={formData.minPoints}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 0 } }}
                error={!!formErrors.minPoints}
                helperText={formErrors.minPoints}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Points *"
                name="maxPoints"
                value={formData.maxPoints}
                onChange={handleChange}
                InputProps={{ inputProps: { min: formData.minPoints + 1 } }}
                error={!!formErrors.maxPoints}
                helperText={formErrors.maxPoints}
                required
              />
            </Grid>
            
            {/* 范围错误提示 */}
            {formErrors.range && (
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: '#fff8e1', 
                  padding: '8px 12px', 
                  borderRadius: '4px',
                  borderLeft: '4px solid #ffc107'
                }}>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="error">
                    {formErrors.range}
                  </Typography>
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleSwitchChange}
                    name="active"
                    color="primary"
                  />
                }
                label="Active Tier"
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
                {formData.active 
                  ? "Active tiers are available for members to achieve" 
                  : "Inactive tiers are not available for new members"}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ color: '#5d3587', borderColor: '#5d3587' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ 
              backgroundColor: '#8e44ad', 
              '&:hover': { backgroundColor: '#732d91' },
              ml: 1
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : currentTier ? 'Update Tier' : 'Create Tier'}
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
            sx={{ color: '#5d3587', borderColor: '#5d3587' }}
          >
            Cancel
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
            {loading ? <CircularProgress size={24} color="inherit" /> : confirmDialog.action === 'delete' ? 'Delete' : confirmDialog.action === 'activate' ? 'Activate' : 'Deactivate'}
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

export default AdminManageTiers;