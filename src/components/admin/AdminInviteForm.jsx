import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import axios from 'axios';
import UserService from '../../service/UserService';

const roleOptions = [
  { value: 'User', label: 'User' },
  { value: 'Coach', label: 'Coach' },
  { value: 'EventOrganizer', label: 'Event Organizer' },
  { value: 'Admin', label: 'Admin' }
];

const AdminInviteForm = ({ open, onClose, onSuccess }) => {
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
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Send Registration Invitation</DialogTitle>
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
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              onChange={e => setRole(e.target.value)}
              label="Role"
              required
            >
              {roleOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Sending...' : 'Send Invitation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminInviteForm;