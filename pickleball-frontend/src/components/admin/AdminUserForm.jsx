import React, { useState, useEffect } from 'react';
import {
  Grid, TextField, FormControl, InputLabel,
  Select, MenuItem, Button, CircularProgress,
  Alert, Box, Typography, FormControlLabel,
  Checkbox, useTheme, alpha, Divider, Card, CardContent
} from '@mui/material';
import axios from 'axios';
import UserService from '../../service/UserService';

const AdminUserForm = ({ user, onClose, onUserCreated, onUserUpdated }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    userType: 'User',
    username: '',
    password: '',
    status: 'ACTIVE',
    generatePassword: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is deleted for read-only mode
  const isReadOnly = user && user.status === 'DELETED';

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: user.dob || '',
        gender: user.gender || '',
        userType: user.userType || 'User',
        username: user.username || '',
        password: '',
        status: user.status || 'ACTIVE',
        generatePassword: false
      });
    }
  }, [user]);

  const handleChange = (e) => {
    // Don't allow changes if in read-only mode
    if (isReadOnly) return;

    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Don't submit if in read-only mode
    if (isReadOnly) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = UserService.getAdminToken();

      if (user) {
        // 更新用户
        const { username, password, generatePassword, ...updateData } = formData;
        const response = await axios.put(
          `http://localhost:8081/api/admin/users/${user.id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onUserUpdated(response.data);
      } else {
        // 创建新用户
        const response = await axios.post(
          'http://localhost:8081/api/admin/users',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onUserCreated(response.data);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Please try again.');
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pt: 2 }}>
      {isReadOnly && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 1
          }}
        >
          This user has been deleted. You can view their details but cannot make changes.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2.5}>
          {/* Personal Information */}
          <Box sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2.5,
            mb: 3,
            backgroundColor: theme.palette.background.default
          }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Personal Information
            </Typography>
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  mb: 1.5,
                  color: theme.palette.text.primary,
                  fontSize: '1rem'
                }}
              >
                Personal Information
              </Typography>
            </Grid>
          </Box>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isReadOnly}
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isReadOnly}
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isReadOnly}
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              disabled={isReadOnly}
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                label="Gender"
                disabled={isReadOnly}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
                <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Account Settings */}
          <Grid item xs={12} sx={{ mt: 1.5 }}>
            <Box sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 2.5,
              backgroundColor: theme.palette.background.default
            }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Account Settings
              </Typography>
            </Box>
          </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>User Role</InputLabel>
          <Select
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            label="User Role"
            required
            disabled={isReadOnly}
          >
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="Coach">Coach</MenuItem>
            <MenuItem value="EventOrganizer">Event Organizer</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required={!user}
          disabled={!!user || isReadOnly}
          size="medium"
        />
      </Grid>

      {!user && !isReadOnly && (
        <>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.generatePassword}
                  onChange={handleChange}
                  name="generatePassword"
                  disabled={isReadOnly}
                />
              }
              label="Generate random password automatically"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.95rem'
                }
              }}
            />
          </Grid>

          {!formData.generatePassword && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isReadOnly}
              />
            </Grid>
          )}
        </>
      )}

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Account Status</InputLabel>
          <Select
            name="status"
            value={formData.status}
            onChange={handleChange}
            label="Account Status"
            disabled={isReadOnly}
          >
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
            {user && <MenuItem value="DELETED">Deleted</MenuItem>}
          </Select>
        </FormControl>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error" sx={{ borderRadius: 1 }}>
            {error}
          </Alert>
        </Grid>
      )}

      {/* Action Buttons */}
      <Grid item xs={12} sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        mt: 2,
        pt: 2,
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            '&:hover': { borderColor: theme.palette.primary.dark },
            borderRadius: 2,
            fontWeight: 600,
            px: 3,
            py: 1.2,
            minWidth: 120,
            textTransform: 'none'
          }}
        >
          {isReadOnly ? 'Close' : 'Cancel'}
        </Button>
        {!isReadOnly && (
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              py: 1.2,
              minWidth: 160,
              boxShadow: theme.shadows[2],
              textTransform: 'none',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                boxShadow: theme.shadows[4]
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : user ? 'Update User' : 'Create User'}
          </Button>
        )}
      </Grid>
    </Grid>
        </Box >
    </Box >
  );
};

export default AdminUserForm;