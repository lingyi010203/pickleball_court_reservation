import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import axios from 'axios';
import UserService from '../../service/UserService';
import { usePageTheme } from '../../hooks/usePageTheme';

const roleOptions = [
  { value: 'User', label: 'User' },
  { value: 'Coach', label: 'Coach' },
  { value: 'EventOrganizer', label: 'Event Organizer' },
  { value: 'Admin', label: 'Admin' }
];

const AdminInviteForm = ({ open, onClose, onSuccess }) => {
  usePageTheme('admin'); // 设置页面类型为admin
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!open) {
      setSuccess('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = UserService.getAdminToken();
      await axios.post('http://localhost:8081/api/admin/invitations', {
        email,
        role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Invitation sent successfully!');
      setEmail('');
      setRole('User');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 6,
          minWidth: 400
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', pb: 1 }}>Send Registration Invitation</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Recipient Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            margin="normal"
            sx={{ borderRadius: 2 }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              onChange={e => setRole(e.target.value)}
              label="Role"
              required
              sx={{ borderRadius: 2 }}
            >
              {roleOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            px: 3,
            py: 1.2,
            minWidth: 120
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            py: 1.2,
            minWidth: 160,
            boxShadow: 2,
            '&:hover': { backgroundColor: 'primary.dark', boxShadow: 4 }
          }}
        >
          {loading ? 'Sending...' : 'Send Invitation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminInviteForm;