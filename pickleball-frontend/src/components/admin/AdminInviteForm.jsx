import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import axios from 'axios';
import UserService from '../../service/UserService';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLanguage } from '../../context/LanguageContext';

const AdminInviteForm = ({ open, onClose, onSuccess }) => {
  usePageTheme('admin'); // 设置页面类型为admin
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roleOptions = [
    { value: 'User', label: t('admin.user') },
    { value: 'Coach', label: t('admin.coach') },
    { value: 'EventOrganizer', label: t('admin.eventOrganizer') },
    { value: 'Admin', label: t('admin.admin') }
  ];

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
      const token = UserService.getAdminToken() || UserService.getToken();
      await axios.post('http://localhost:8081/api/admin/invitations', {
        email,
        role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(t('admin.invitationSentSuccessfully'));
      setEmail('');
      setRole('User');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || t('admin.failedToSendInvitation'));
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
      <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', pb: 1 }}>{t('admin.sendRegistrationInvitation')}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label={t('admin.recipientEmail')}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            margin="normal"
            sx={{ borderRadius: 2 }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('admin.role')}</InputLabel>
            <Select
              value={role}
              onChange={e => setRole(e.target.value)}
              label={t('admin.role')}
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
          {t('admin.cancel')}
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
          {loading ? t('admin.sending') : t('admin.sendInvitation')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminInviteForm;