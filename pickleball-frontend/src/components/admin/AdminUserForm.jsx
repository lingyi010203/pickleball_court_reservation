import React, { useState, useEffect } from 'react';
import {
  Grid, TextField, FormControl, InputLabel,
  Select, MenuItem, Button, CircularProgress,
  Alert, Box, Typography, FormControlLabel,
  Checkbox, useTheme, alpha, Divider, Card, CardContent
} from '@mui/material';
import axios from 'axios';
import UserService from '../../service/UserService';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLanguage } from '../../context/LanguageContext';

const AdminUserForm = ({ user, onClose, onUserCreated, onUserUpdated }) => {
  usePageTheme('admin'); // 设置页面类型为admin
  const theme = useTheme();
  const { t } = useLanguage();
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
    generatePassword: true,
    position: ''
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
        generatePassword: false,
        position: user.position || ''
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

    // 验证密码
    if (!formData.generatePassword && (!formData.password || formData.password.length < 6)) {
      setError(t('admin.passwordMustBeAtLeast6Characters'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = UserService.getAdminToken() || UserService.getToken();

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
        let submitData = { ...formData };
        
        // 如果选择自动生成密码，移除password字段，让后端生成
        if (formData.generatePassword) {
          delete submitData.password;
        }
        
        const response = await axios.post(
          'http://localhost:8081/api/admin/users',
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onUserCreated(response.data);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('admin.operationFailed'));
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
          {t('admin.thisUserHasBeenDeleted')}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Mandatory Fields Note */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ 
            color: theme.palette.text.secondary,
            fontWeight: 600,
            display: 'block',
            mb: 2
          }}>
            * {t('admin.indicatesMandatoryFields')}
          </Typography>
        </Box>

        {/* Personal Information Section */}
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
            {t('admin.personalInformation')}
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
                  {t('admin.fullName')} *
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('admin.enterFullName')}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isReadOnly}
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
                  {t('admin.emailAddress')} *
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('admin.enterEmailAddress')}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isReadOnly}
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
            
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography component="label" sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '0.95rem',
                  mb: 1,
                  display: 'block'
                }}>
                  {t('admin.phoneNumber')}
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('admin.enterPhoneNumber')}
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isReadOnly}
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
            
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography component="label" sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '0.95rem',
                  mb: 1,
                  display: 'block'
                }}>
                  {t('admin.dateOfBirth')}
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  disabled={isReadOnly}
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
            
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography component="label" sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '0.95rem',
                  mb: 1,
                  display: 'block'
                }}>
                  {t('admin.gender')}
                </Typography>
                <FormControl fullWidth>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    sx={{ 
                      borderRadius: '12px',
                      backgroundColor: '#f9fafb',
                      '&:focus-within': {
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                      }
                    }}
                  >
                    <MenuItem value="Male">{t('admin.male')}</MenuItem>
                    <MenuItem value="Female">{t('admin.female')}</MenuItem>
                    <MenuItem value="Other">{t('admin.other')}</MenuItem>
                    <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Account Settings Section */}
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
            {t('admin.accountInformation')}
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
                  {t('admin.userType')} *
                </Typography>
                <FormControl fullWidth>
                  <Select
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    required
                    disabled={isReadOnly}
                    sx={{ 
                      borderRadius: '12px',
                      backgroundColor: '#f9fafb',
                      '&:focus-within': {
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                      }
                    }}
                  >
                    <MenuItem value="User">{t('admin.user')}</MenuItem>
                    <MenuItem value="Coach">{t('admin.coach')}</MenuItem>
                    <MenuItem value="EventOrganizer">{t('admin.eventOrganizer')}</MenuItem>
                    <MenuItem value="Admin">{t('admin.admin')}</MenuItem>
                  </Select>
                </FormControl>
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
                  {t('admin.username')} {!user && '*'}
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('admin.enterUsername')}
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required={!user}
                  disabled={!!user || isReadOnly}
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
                  {t('admin.status')}
                </Typography>
                <FormControl fullWidth>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    sx={{ 
                      borderRadius: '12px',
                      backgroundColor: '#f9fafb',
                      '&:focus-within': {
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                      }
                    }}
                  >
                    <MenuItem value="ACTIVE">{t('admin.active')}</MenuItem>
                    <MenuItem value="INACTIVE">{t('admin.inactive')}</MenuItem>
                    <MenuItem value="SUSPENDED">{t('admin.suspended')}</MenuItem>
                    {user && <MenuItem value="DELETED">Deleted</MenuItem>}
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            {/* Admin Position Field - Only show when userType is Admin */}
            {formData.userType === 'Admin' && (
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.adminPosition')}
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={t('admin.enterAdminPosition')}
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    disabled={isReadOnly}
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
            )}

            {!user && !isReadOnly && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 2, 
                    border: '1px solid #e9ecef',
                    mb: 2
                  }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.generatePassword}
                          onChange={handleChange}
                          name="generatePassword"
                          disabled={isReadOnly}
                        />
                      }
                      label={t('admin.generateRandomPasswordAutomatically')}
                      sx={{
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.95rem',
                          fontWeight: 500
                        }
                      }}
                    />
                  </Box>
                </Grid>

                {!formData.generatePassword && (
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography component="label" sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        fontSize: '0.95rem',
                        mb: 1,
                        display: 'block'
                      }}>
                        {t('admin.password')} *
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                                                  placeholder={t('admin.enterPassword')}
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!formData.generatePassword}
                        disabled={isReadOnly}
                        error={!formData.generatePassword && formData.password && formData.password.length < 6}
                        helperText={!formData.generatePassword && formData.password && formData.password.length < 6 ? t('admin.passwordMustBeAtLeast6Characters') : ""}
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
                )}
              </>
            )}
          </Grid>
        </Box>

        {error && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 3,
          pt: 3,
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
            {isReadOnly ? t('admin.close') : t('admin.cancel')}
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
              {loading ? <CircularProgress size={24} /> : user ? t('admin.updateAdmin') : t('admin.createAdmin')}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminUserForm;