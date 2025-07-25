import React, { useState, useEffect } from 'react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

import {
  Box, Tabs, Tab, Typography, Paper, TextField, Button, Avatar, Switch, FormControlLabel, Snackbar, Alert
} from '@mui/material';
import axios from 'axios';
import UserService from '../../service/UserService';

function ProfileTab({ profile, profileLoading, profileError, profileSuccess, onChange, onSave, onCloseSuccess }) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Profile</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar sx={{ width: 64, height: 64 }}>{profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}</Avatar>
        <Button variant="outlined" disabled>Upload Avatar (TODO)</Button>
      </Box>
      <TextField label="Name" name="name" value={profile.name} onChange={onChange} fullWidth margin="normal" disabled={profileLoading} required />
      <TextField label="Email" name="email" value={profile.email} onChange={onChange} fullWidth margin="normal" disabled={profileLoading} required />
      <TextField label="Phone" name="phone" value={profile.phone} onChange={onChange} fullWidth margin="normal" disabled={profileLoading} />
      <Button variant="contained" sx={{ mt: 2 }} onClick={onSave} disabled={profileLoading}>Save</Button>
      {profileError && <Alert severity="error" sx={{ mt: 2 }}>{profileError}</Alert>}
      <Snackbar open={profileSuccess} autoHideDuration={2000} onClose={onCloseSuccess} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={onCloseSuccess} severity="success" sx={{ width: '100%' }}>
          Profile saved!
        </Alert>
      </Snackbar>
    </Box>
  );
}

function ChangePasswordTab({ changePwd, pwdLoading, pwdError, pwdSuccess, onChange, onSubmit, onCloseSuccess }) {
  return (
    <Box sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>Change Password</Typography>
      <TextField label="Current Password" name="current" type="password" value={changePwd.current} onChange={onChange} fullWidth margin="normal" disabled={pwdLoading} />
      <TextField label="New Password" name="next" type="password" value={changePwd.next} onChange={onChange} fullWidth margin="normal" disabled={pwdLoading} />
      <TextField label="Confirm New Password" name="confirm" type="password" value={changePwd.confirm} onChange={onChange} fullWidth margin="normal" disabled={pwdLoading} />
      <Button variant="contained" sx={{ mt: 2 }} onClick={onSubmit} disabled={pwdLoading}>Change Password</Button>
      {pwdError && <Alert severity="error" sx={{ mt: 2 }}>{pwdError}</Alert>}
      <Snackbar open={pwdSuccess} autoHideDuration={2000} onClose={onCloseSuccess} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={onCloseSuccess} severity="success" sx={{ width: '100%' }}>
          Password changed!
        </Alert>
      </Snackbar>
    </Box>
  );
}

function ThemeTab() {
  const { theme, setTheme } = useAppTheme();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Theme</Typography>
      <FormControlLabel
        control={
          <Switch
            checked={theme === 'dark'}
            onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            name="themeSwitch"
            color="primary"
          />
        }
        label={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Theme switching is instant and will be remembered.
      </Typography>
    </Box>
  );
}

const AdminSettings = () => {
  const [tab, setTab] = useState(0);
  const theme = useMuiTheme();
  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', avatar: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Change Password state
  const [changePwd, setChangePwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    setProfileLoading(true);
    axios.get('http://localhost:8081/api/admin/profile', {
      headers: { Authorization: `Bearer ${UserService.getAdminToken()}` }
    })
      .then(res => {
        setProfile(res.data);
        setProfileLoading(false);
      })
      .catch(() => {
        setProfileLoading(false);
        setProfileError('Failed to load profile');
      });
  }, []);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = () => {
    setProfileLoading(true);
    setProfileError('');
    axios.post('http://localhost:8081/api/admin/profile', profile, {
      headers: { Authorization: `Bearer ${UserService.getAdminToken()}` }
    })
      .then(res => {
        setProfile(res.data);
        setProfileSuccess(true);
        setProfileLoading(false);
      })
      .catch(() => {
        setProfileError('Failed to save profile');
        setProfileLoading(false);
      });
  };

  const handleProfileSuccessClose = () => setProfileSuccess(false);
  const handlePwdSuccessClose = () => setPwdSuccess(false);

  const handlePwdChange = (e) => {
    const { name, value } = e.target;
    setChangePwd(prev => ({ ...prev, [name]: value }));
  };

  const handlePwdSubmit = async () => {
    setPwdLoading(true);
    setPwdError('');
    if (!changePwd.next || changePwd.next !== changePwd.confirm) {
      setPwdError('New passwords do not match');
      setPwdLoading(false);
      return;
    }
    try {
      await axios.post('http://localhost:8081/api/admin/change-password', {
        currentPassword: changePwd.current,
        newPassword: changePwd.next
      }, {
        headers: { Authorization: `Bearer ${UserService.getAdminToken()}` }
      });
      setPwdSuccess(true);
      setChangePwd({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    }
    setPwdLoading(false);
  };

  return (
    <Paper sx={{ maxWidth: 600, mx: 'auto', mt: 4, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: theme.shadows[2] }}>
      <Tabs value={tab} onChange={handleTabChange} centered>
        <Tab label="Profile" />
        <Tab label="Change Password" />
        <Tab label="Theme" />
      </Tabs>
      {tab === 0 && (
        <ProfileTab
          profile={profile}
          profileLoading={profileLoading}
          profileError={profileError}
          profileSuccess={profileSuccess}
          onChange={handleProfileChange}
          onSave={handleProfileSave}
          onCloseSuccess={handleProfileSuccessClose}
        />
      )}
      {tab === 1 && (
        <ChangePasswordTab
          changePwd={changePwd}
          pwdLoading={pwdLoading}
          pwdError={pwdError}
          pwdSuccess={pwdSuccess}
          onChange={handlePwdChange}
          onSubmit={handlePwdSubmit}
          onCloseSuccess={handlePwdSuccessClose}
        />
      )}
      {tab === 2 && <ThemeTab />}
    </Paper>
  );
};

export default AdminSettings; 