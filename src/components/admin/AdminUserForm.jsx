import React, { useState, useEffect } from 'react';
import { 
  Grid, TextField, FormControl, InputLabel, 
  Select, MenuItem, Button, CircularProgress,
  Alert, Box, Typography, FormControlLabel,
  Checkbox
} from '@mui/material';
import axios from 'axios';
import UserService from '../../service/UserService';

const AdminUserForm = ({ user, onClose, onUserCreated, onUserUpdated }) => {
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
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This user has been deleted. You can view their details but cannot make changes.
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            margin="normal"
            disabled={isReadOnly}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            margin="normal"
            disabled={isReadOnly}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            margin="normal"
            disabled={isReadOnly}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Date of Birth"
            name="dob"
            type="date"
            value={formData.dob}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            margin="normal"
            disabled={isReadOnly}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
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
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              label="Role"
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
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required={!user}
            disabled={!!user || isReadOnly}
            margin="normal"
          />
        </Grid>
        
        {!user && !isReadOnly && (
          <>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.generatePassword}
                    onChange={handleChange}
                    name="generatePassword"
                    disabled={isReadOnly}
                  />
                }
                label="Generate random password"
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
                  margin="normal"
                  disabled={isReadOnly}
                />
              </Grid>
            )}
          </>
        )}
        
        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
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
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Grid>
        )}
        
        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#732d91' } }}
            >
              {loading ? <CircularProgress size={24} /> : user ? 'Update User' : 'Create User'}
            </Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminUserForm;