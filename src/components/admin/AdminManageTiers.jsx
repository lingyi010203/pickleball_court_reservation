// AdminManageTiers.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip, Snackbar, Alert,
  CircularProgress, Grid, Chip, Switch, FormControlLabel, MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as BackIcon } from '@mui/icons-material';
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
  const [currentTier, setCurrentTier] = useState(null);
  const [formData, setFormData] = useState({
    tierName: '',
    benefits: '',       // 替换 description
    minPoints: 0,      // 新增字段
    maxPoints: 0,      // 新增字段
    active: true
  });

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      const response = await axios.get('http://localhost:8081/api/admin/tiers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTiers(response.data);
    } catch (err) {
      setError('Failed to fetch tiers. Please try again.');
      console.error('Error fetching tiers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tier = null) => {
    if (tier) {
      setCurrentTier(tier);
      setFormData({
        tierName: tier.tierName, // 直接使用字符串值
        benefits: tier.benefits, // 原 description
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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTier(null); // or whatever state you use for the dialog
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthlyFee' || name === 'discountPercentage' || name === 'bookingLimit'
        ? Number(value)
        : value
    }));
  };

  const handleSwitchChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.checked
    }));
  };

  const handleSubmit = async () => {
    if (!formData.tierName) {
      setSnackbar({
        open: true,
        message: "Please select a tier name",
        severity: "error"
      });
      return;
    }
    // 验证积分范围
    if (formData.minPoints >= formData.maxPoints) {
      setSnackbar({
        open: true,
        message: "Min points must be less than max points",
        severity: "error"
      });
      return;
    }

    // 验证权益描述
    if (!formData.benefits.includes("% discount") &&
      !formData.benefits.includes("free booking")) {
      setSnackbar({
        open: true,
        message: "Benefits must include discount or free booking info",
        severity: "error"
      });
      return;
    }

    try {
      setLoading(true);
      const token = UserService.getAdminToken();

      if (currentTier) {
        // Update existing tier
        await axios.put(`http://localhost:8081/api/admin/tiers/${currentTier.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({
          open: true,
          message: 'Tier updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new tier
        await axios.post('http://localhost:8081/api/admin/tiers', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({
          open: true,
          message: 'Tier created successfully!',
          severity: 'success'
        });
      }

      fetchTiers();
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.message || 'Operation failed'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tierId) => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      await axios.delete(`http://localhost:8081/api/admin/tiers/${tierId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({
        open: true,
        message: 'Tier deleted successfully!',
        severity: 'success'
      });
      fetchTiers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.message || 'Deletion failed'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTierStatus = async (tierId, active) => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      await axios.put(`http://localhost:8081/api/admin/tiers/${tierId}/status?active=${active}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({
        open: true,
        message: `Tier ${active ? 'activated' : 'deactivated'} successfully!`,
        severity: 'success'
      });
      fetchTiers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.message || 'Status change failed'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#5d3587' }}>
          Manage Membership Tiers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#732d91' } }}
        >
          Add New Tier
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Tier Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Min Points</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Max Points</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Benefits</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tiers.map((tier) => (
              <TableRow key={tier.id}>
                <TableCell>{tier.tierName}</TableCell>
                <TableCell>{tier.minPoints}</TableCell>  {/* 新增 */}
                <TableCell>{tier.maxPoints}</TableCell>  {/* 新增 */}
                <TableCell>{tier.benefits}</TableCell>
                <TableCell>
                  <Chip
                    label={tier.active ? 'Active' : 'Inactive'}
                    sx={{
                      backgroundColor: tier.active ? '#d5f5e3' : '#f5d5d5',
                      color: tier.active ? '#27ae60' : '#c0392b',
                      fontWeight: 'bold'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpenDialog(tier)}>
                      <EditIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(tier.id)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Tooltip>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={tier.active}
                        onChange={(e) => toggleTierStatus(tier.id, e.target.checked)}
                        name="active"
                        color="primary"
                      />
                    }
                    label=""
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Tier Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {currentTier ? 'Edit Tier' : 'Add New Tier'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* 下拉选择替换文本输入 */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Tier Name"
                name="tierName"
                value={formData.tierName}
                onChange={handleChange}
                margin="normal"
              >
                <MenuItem value="SILVER">Silver</MenuItem>
                <MenuItem value="GOLD">Gold</MenuItem>
                <MenuItem value="PLATINUM">Platinum</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Benefits"
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Points"
                name="minPoints"
                value={formData.minPoints}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Points"
                name="maxPoints"
                value={formData.maxPoints}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#732d91' } }}
          >
            {loading ? <CircularProgress size={24} /> : currentTier ? 'Update' : 'Create'}
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

export default AdminManageTiers;