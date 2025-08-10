import React, { useState, useEffect, useRef } from 'react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTheme } from '../../hooks/usePageTheme';

import {
  Box, Tabs, Tab, Typography, Paper, TextField, Button, Avatar, Switch, FormControlLabel, Snackbar, Alert,
  IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';
import { useTheme } from '@mui/material/styles';

function ProfileTab({ profile, profileLoading, profileError, profileSuccess, onChange, onSave, onCloseSuccess, onAvatarUpload, onAvatarRemove, avatarLoading, onDeleteAccount, deleteAccountLoading }) {
  const theme = useTheme();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onAvatarUpload(file);
    }
  };

  const getAvatarDisplay = () => {
    if (profile.profileImage) {
      return `http://localhost:8081/uploads/${profile.profileImage}`;
    }
    return null;
  };

  const handleDeleteAccountClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation === 'DELETE') {
      onDeleteAccount();
      setDeleteDialogOpen(false);
      setDeleteConfirmation('');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteConfirmation('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t('settings.profile')}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              cursor: 'pointer',
              border: '2px solid',
              borderColor: theme.palette.primary.main
            }}
            src={getAvatarDisplay()}
            onClick={handleAvatarClick}
          >
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
          </Avatar>
          {avatarLoading && (
            <CircularProgress 
              size={20} 
              sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                marginTop: '-10px', 
                marginLeft: '-10px' 
              }} 
            />
          )}
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: theme.palette.error.main,
              color: 'white',
              '&:hover': { backgroundColor: theme.palette.error.dark }
            }}
            onClick={onAvatarRemove}
            disabled={avatarLoading || !profile.profileImage}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<PhotoCamera />}
            onClick={handleAvatarClick}
            disabled={avatarLoading}
            sx={{ mb: 1 }}
          >
            {profile.profileImage ? t('settings.changeAvatar') : t('settings.uploadAvatar')}
          </Button>
          <Typography variant="caption" display="block" color="text.secondary">
            {t('settings.clickAvatarToUpload')}
          </Typography>
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Box>
      <TextField label={t('settings.name')} name="name" value={profile.name} onChange={onChange} fullWidth margin="normal" disabled={profileLoading} required />
      <TextField label={t('settings.email')} name="email" value={profile.email} onChange={onChange} fullWidth margin="normal" disabled={profileLoading} required />
      <TextField label={t('settings.phone')} name="phone" value={profile.phone} onChange={onChange} fullWidth margin="normal" disabled={profileLoading} />
      <Button variant="contained" sx={{ mt: 2, backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontWeight: 600, borderRadius: 3, px: 3, py: 1.2, boxShadow: theme.shadows[2], '&:hover': { backgroundColor: theme.palette.primary.dark, boxShadow: theme.shadows[4] } }} onClick={onSave} disabled={profileLoading}>{t('settings.save')}</Button>
      
      {/* Delete Account Section */}
      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {t('settings.dangerZone')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('settings.deleteAccountWarning')}
        </Typography>
        <Button 
          variant="outlined"
          color="error"
          onClick={handleDeleteAccountClick}
          disabled={deleteAccountLoading}
          sx={{ 
            borderColor: 'error.main',
            color: 'error.main',
            '&:hover': { 
              borderColor: 'error.dark',
              backgroundColor: 'error.light',
              color: 'error.dark'
            }
          }}
        >
          {t('settings.deleteAccount')}
        </Button>
      </Box>

      {profileError && <Alert severity="error" sx={{ mt: 2 }}>{profileError}</Alert>}
      <Snackbar open={profileSuccess} autoHideDuration={2000} onClose={onCloseSuccess} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={onCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {t('settings.profileSaved')}
        </Alert>
      </Snackbar>

      {/* Delete Account Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: 'error.light', 
          color: 'error.contrastText',
          borderBottom: '1px solid',
          borderColor: 'error.main'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete color="inherit" />
            <Typography variant="h6">{t('settings.deleteAccount')}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
            {t('settings.confirmDelete')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('settings.deleteAccountDescription')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            {t('settings.typeDeleteToConfirm')}
          </Typography>
          <TextField
            fullWidth
            label={t('settings.typeDeletePlaceholder')}
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            error={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE'}
            helperText={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE' ? t('settings.passwordsDoNotMatch') : ''}
            disabled={deleteAccountLoading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={handleDeleteCancel}
            variant="outlined"
            disabled={deleteAccountLoading}
            sx={{ 
              color: theme.palette.primary.main, 
              borderColor: theme.palette.primary.main 
            }}
          >
            {t('settings.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleteConfirmation !== 'DELETE' || deleteAccountLoading}
            sx={{ 
              backgroundColor: 'error.main',
              '&:hover': { backgroundColor: 'error.dark' },
              '&:disabled': { backgroundColor: 'grey.400' }
            }}
          >
            {deleteAccountLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                {t('settings.deleting')}
              </Box>
            ) : (
              t('settings.deleteAccount')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ChangePasswordTab({ changePwd, pwdLoading, pwdError, pwdSuccess, onChange, onSubmit, onCloseSuccess }) {
  const theme = useTheme();
  const { t } = useLanguage();
  const [passwordValidation, setPasswordValidation] = useState({});

  const validatePassword = (password) => {
    if (!password) return {};
    
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const validateConfirmPassword = (confirm, password) => {
    return confirm === password;
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    onChange(e);
    
    if (name === 'next') {
      setPasswordValidation(validatePassword(value));
    }
  };

  const getPasswordStrength = () => {
    const validations = Object.values(passwordValidation);
    const validCount = validations.filter(Boolean).length;
    
    if (validCount <= 2) return { level: 1, label: t('settings.weak'), color: 'error' };
    if (validCount <= 3) return { level: 2, label: t('settings.fair'), color: 'warning' };
    if (validCount <= 4) return { level: 3, label: t('settings.good'), color: 'info' };
    return { level: 4, label: t('settings.strong'), color: 'success' };
  };

  const strength = getPasswordStrength();
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const isConfirmValid = validateConfirmPassword(changePwd.confirm, changePwd.next);
  const isFormValid = changePwd.current && isPasswordValid && isConfirmValid;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t('settings.changePassword')}</Typography>
      <TextField 
        label={t('settings.currentPassword')} 
        name="current" 
        type="password" 
        value={changePwd.current} 
        onChange={onChange} 
        fullWidth 
        margin="normal" 
        disabled={pwdLoading} 
        required 
      />
      <TextField 
        label={t('settings.newPassword')} 
        name="next" 
        type="password" 
        value={changePwd.next} 
        onChange={handlePasswordChange} 
        fullWidth 
        margin="normal" 
        disabled={pwdLoading} 
        required 
      />
      <TextField 
        label={t('settings.confirmNewPassword')} 
        name="confirm" 
        type="password" 
        value={changePwd.confirm} 
        onChange={onChange} 
        fullWidth 
        margin="normal" 
        disabled={pwdLoading} 
        required 
        error={changePwd.confirm !== '' && !isConfirmValid}
        helperText={changePwd.confirm !== '' && !isConfirmValid ? t('settings.passwordsDoNotMatch') : ''}
      />
      
      {/* Password Strength Indicator */}
      {changePwd.next && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {t('settings.passwordStrength')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ 
              width: '100%', 
              height: 8, 
              bgcolor: 'grey.300', 
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                width: `${(strength.level / 4) * 100}%`, 
                height: '100%', 
                bgcolor: `${strength.color}.main`,
                transition: 'all 0.3s ease'
              }} />
            </Box>
            <Typography variant="caption" color={`${strength.color}.main`} sx={{ fontWeight: 'bold' }}>
              {strength.label}
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {t('settings.passwordRequirements')}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <Box component="li" sx={{ 
              color: passwordValidation.length ? 'success.main' : 'text.secondary',
              fontWeight: passwordValidation.length ? 'bold' : 'normal'
            }}>
              {t('settings.min8Characters')}
            </Box>
            <Box component="li" sx={{ 
              color: passwordValidation.uppercase ? 'success.main' : 'text.secondary',
              fontWeight: passwordValidation.uppercase ? 'bold' : 'normal'
            }}>
              {t('settings.uppercaseLetter')}
            </Box>
            <Box component="li" sx={{ 
              color: passwordValidation.lowercase ? 'success.main' : 'text.secondary',
              fontWeight: passwordValidation.lowercase ? 'bold' : 'normal'
            }}>
              {t('settings.lowercaseLetter')}
            </Box>
            <Box component="li" sx={{ 
              color: passwordValidation.number ? 'success.main' : 'text.secondary',
              fontWeight: passwordValidation.number ? 'bold' : 'normal'
            }}>
              {t('settings.number')}
            </Box>
            <Box component="li" sx={{ 
              color: passwordValidation.special ? 'success.main' : 'text.secondary',
              fontWeight: passwordValidation.special ? 'bold' : 'normal'
            }}>
              {t('settings.specialCharacter')}
            </Box>
          </Box>
        </Box>
      )}
      
      <Button 
        variant="contained" 
        sx={{ 
          mt: 2, 
          backgroundColor: theme.palette.primary.main, 
          color: theme.palette.primary.contrastText, 
          fontWeight: 600, 
          borderRadius: 3, 
          px: 3, 
          py: 1.2, 
          boxShadow: theme.shadows[2], 
          '&:hover': { 
            backgroundColor: theme.palette.primary.dark, 
            boxShadow: theme.shadows[4] 
          },
          '&:disabled': {
            backgroundColor: 'grey.400',
            color: 'grey.600'
          }
        }} 
        onClick={onSubmit} 
        disabled={pwdLoading || !isFormValid}
      >
        {t('settings.changePassword')}
      </Button>
      
      {pwdError && <Alert severity="error" sx={{ mt: 2 }}>{pwdError}</Alert>}
      <Snackbar open={pwdSuccess} autoHideDuration={2000} onClose={onCloseSuccess} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={onCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {t('settings.passwordChanged')}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function ThemeTab() {
  const { theme, setTheme } = useAppTheme();
  const { t } = useLanguage();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t('settings.theme')}</Typography>
      <FormControlLabel
        control={
          <Switch
            checked={theme === 'dark'}
            onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            name="themeSwitch"
            color="primary"
          />
        }
        label={theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('settings.themeDescription')}
      </Typography>
    </Box>
  );
}

function LanguageTab() {
  const { language, changeLanguage, t } = useLanguage();
  const theme = useTheme();

  const languages = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
    { value: 'zh', label: '简体中文', flag: '🇨🇳' }
  ];

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    changeLanguage(newLanguage);
    
    // 触发语言变更事件，通知其他组件
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: newLanguage } 
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t('settings.language')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('settings.languageDescription')}
      </Typography>
      
      <FormControl fullWidth>
        <InputLabel>{t('settings.selectLanguage')}</InputLabel>
        <Select
          value={language}
          onChange={handleLanguageChange}
          label={t('settings.selectLanguage')}
          sx={{ mb: 2 }}
        >
          {languages.map((lang) => (
            <MenuItem key={lang.value} value={lang.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6">{lang.flag}</Typography>
                <Typography>{lang.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Box sx={{ 
        mt: 3, 
        p: 2, 
        bgcolor: 'grey.50', 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
          {t('settings.currentLanguage')} {languages.find(lang => lang.value === language)?.label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('settings.languageSaved')}
        </Typography>
      </Box>
    </Box>
  );
}

const AdminSettings = () => {
  usePageTheme('admin'); // 设置页面类型为admin
  const [tab, setTab] = useState(0);
  const theme = useMuiTheme();
  const { t } = useLanguage();
  
  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', avatar: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

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
        setProfileError(t('settings.failedToLoadProfile'));
      });
  }, []); // 移除t依赖，只在组件挂载时加载一次

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
    axios.put('http://localhost:8081/api/admin/profile', profile, {
      headers: { Authorization: `Bearer ${UserService.getAdminToken()}` }
    })
      .then(res => {
        setProfile(res.data);
        setProfileSuccess(true);
        setProfileLoading(false);
      })
      .catch(() => {
        setProfileError(t('settings.failedToSaveProfile'));
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
    
    // 前端验证
    if (!changePwd.current) {
      setPwdError(t('settings.currentPasswordRequired'));
      setPwdLoading(false);
      return;
    }
    
    if (!changePwd.next) {
      setPwdError(t('settings.newPasswordRequired'));
      setPwdLoading(false);
      return;
    }
    
    if (!changePwd.confirm) {
      setPwdError(t('settings.confirmPasswordRequired'));
      setPwdLoading(false);
      return;
    }
    
    if (changePwd.next !== changePwd.confirm) {
      setPwdError(t('settings.passwordsDoNotMatch'));
      setPwdLoading(false);
      return;
    }
    
    // 密码复杂度验证
    const passwordValidation = validatePassword(changePwd.next);
    if (passwordValidation) {
      setPwdError(`${t('settings.passwordRequirementsNotMet')} ${passwordValidation.join(', ')}`);
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
      setPwdError(err.response?.data?.message || t('settings.failedToChangePassword'));
    }
    setPwdLoading(false);
  };

  // 添加validatePassword函数到主组件
  const validatePassword = (password) => {
    if (!password) return null;
    
    const validations = [];
    
    // 检查长度
    if (password.length < 8) {
      validations.push(t('settings.minimum8Characters'));
    }
    
    // 检查复杂度
    if (!/[A-Z]/.test(password)) {
      validations.push(t('settings.requiresUppercase'));
    }
    
    if (!/[a-z]/.test(password)) {
      validations.push(t('settings.requiresLowercase'));
    }
    
    if (!/[0-9]/.test(password)) {
      validations.push(t('settings.requiresNumber'));
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      validations.push(t('settings.requiresSpecialCharacter'));
    }
    
    return validations.length > 0 ? validations : null;
  };

  const handleAvatarUpload = async (file) => {
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await axios.post('http://localhost:8081/api/admin/avatar', formData, {
        headers: {
          Authorization: `Bearer ${UserService.getAdminToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setProfile(prev => ({ ...prev, profileImage: res.data }));
      setProfileSuccess(true);
      
      // Trigger avatar update event for AdminDashboard
      window.dispatchEvent(new CustomEvent('adminAvatarUpdated'));
      localStorage.setItem('adminAvatarUpdated', Date.now().toString());
    } catch (err) {
      setProfileError(t('settings.failedToUploadAvatar'));
    }
    setAvatarLoading(false);
  };

  const handleAvatarRemove = async () => {
    setAvatarLoading(true);
    try {
      await axios.delete('http://localhost:8081/api/admin/avatar', {
        headers: { Authorization: `Bearer ${UserService.getAdminToken()}` }
      });
      setProfile(prev => ({ ...prev, profileImage: null }));
      setProfileSuccess(true);
      
      // Trigger avatar update event for AdminDashboard
      window.dispatchEvent(new CustomEvent('adminAvatarUpdated'));
      localStorage.setItem('adminAvatarUpdated', Date.now().toString());
    } catch (err) {
      setProfileError(t('settings.failedToRemoveAvatar'));
    }
    setAvatarLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteAccountLoading(true);
    try {
      await axios.delete('http://localhost:8081/api/admin/delete-account', {
        headers: { Authorization: `Bearer ${UserService.getAdminToken()}` }
      });
      // Optionally, redirect to login page or show a success message
      window.location.href = '/login'; // Example redirect
    } catch (err) {
      setProfileError(err.response?.data?.message || t('settings.failedToDeleteAccount'));
    }
    setDeleteAccountLoading(false);
  };

  return (
    <Paper sx={{ maxWidth: 600, mx: 'auto', mt: 4, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: theme.shadows[2] }}>
      <Tabs value={tab} onChange={handleTabChange} centered>
        <Tab label={t('settings.profile')} />
        <Tab label={t('settings.changePassword')} />
        <Tab label={t('settings.theme')} />
        <Tab label={t('settings.language')} />
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
          onAvatarUpload={handleAvatarUpload}
          onAvatarRemove={handleAvatarRemove}
          avatarLoading={avatarLoading}
          onDeleteAccount={handleDeleteAccount}
          deleteAccountLoading={deleteAccountLoading}
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
      {tab === 3 && <LanguageTab />}
    </Paper>
  );
};

export default AdminSettings; 