import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Divider,
  Avatar,
  Chip,
  Snackbar,
  Alert,
  useTheme,
  Grid,
  Paper,
  InputAdornment,
  IconButton,
  Stack,
  LinearProgress,
  Card,
  CardContent,
  Tooltip,
  CircularProgress,
  Container
} from '@mui/material';
import {
  CameraAlt,
  Delete,
  Person,
  Email,
  Phone,
  Badge,
  CalendarToday,
  Save,
  Cancel,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  CloudUpload,
  Edit,
  Visibility,
  VisibilityOff,
  Info,
  Star,
  PhotoCamera,
  DeleteForever
} from '@mui/icons-material';

const EditProfileForm = React.memo(({ 
  profile = {
    username: 'johndoe',
    email: 'john@example.com',
    phone: '+60123456789',
    name: 'John Doe',
    gender: 'Male',
    dob: '1990-01-01',
    userType: 'User',
    requestedUserType: '',
    status: 'ACTIVE',
    profileImage: null
  }, 
  onSave = () => {}, 
  onCancel = () => {}, 
  onPhotoUpdate = () => {}, 
  onRemovePhoto = () => {} 
}) => {
  const theme = useTheme();
 
  // Memoize the initial profile state to prevent unnecessary re-renders
  const initialProfile = useMemo(() => ({
    ...profile,
    requestedUserType: profile.requestedUserType || profile.userType || "User"
  }), [profile.userType, profile.requestedUserType]);
 
  const [editedProfile, setEditedProfile] = useState({
    ...initialProfile
  });

  const [errors, setErrors] = useState({});
  const [usernameChanged, setUsernameChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const validationTimeoutRef = useRef(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Memoize preview image to prevent unnecessary re-renders
  const previewImage = useMemo(() => 
    profile.profileImage ? `http://localhost:8081/uploads/${profile.profileImage}` : null,
    [profile.profileImage]
  );

  const [uploadProgress, setUploadProgress] = useState(0);

  // Cleanup validation timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (profile.profileImage) {
      // setPreviewImage(
      //   `http://localhost:8081/uploads/${profile.profileImage}?ts=${Date.now()}`
      // );
    } else {
      // setPreviewImage(null);
    }
  }, [profile.profileImage]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { 
          color: 'success', 
          icon: <CheckCircle sx={{ fontSize: 16 }} />, 
          label: 'Active',
          bgColor: theme.palette.success.light,
          textColor: theme.palette.success.contrastText
        };
      case 'PENDING':
        return { 
          color: 'warning', 
          icon: <Warning sx={{ fontSize: 16 }} />, 
          label: 'Pending',
          bgColor: theme.palette.warning.light,
          textColor: theme.palette.warning.contrastText
        };
      case 'LOCKED':
        return { 
          color: 'error', 
          icon: <ErrorIcon sx={{ fontSize: 16 }} />, 
          label: 'Locked',
          bgColor: theme.palette.error.light,
          textColor: theme.palette.error.contrastText
        };
      default:
        return { 
          color: 'default', 
          icon: null, 
          label: status,
          bgColor: theme.palette.grey[200],
          textColor: theme.palette.text.primary
        };
    }
  };

  const statusConfig = getStatusConfig(profile.status);

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'username':
        if (!value.trim()) error = 'Username is required';
        else if (value.length < 3) error = 'Username must be at least 3 characters';
        else if (!/^[a-zA-Z0-9_]+$/.test(value)) error = 'Username can only contain letters, numbers, and underscores';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Please enter a valid email address';
        break;
      case 'phone':
        if (value && !/^[+]?[\d\s-()]+$/.test(value)) error = 'Please enter a valid phone number';
        break;
      case 'name':
        if (!value.trim()) error = 'Name is required';
        else if (value.length < 2) error = 'Name must be at least 2 characters';
        break;
      case 'requestedUserType':
        if (!['User', 'Coach', 'EventOrganizer'].includes(value)) error = 'Invalid user type selection';
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for requestedUserType
    let finalValue = value;
    if (name === 'requestedUserType') {
      // If user selects current user type, set to empty string (no change requested)
      if (value === profile.userType) {
        finalValue = '';
      }
    }
    
    setEditedProfile(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Clear previous validation timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Only validate immediately for critical fields like username and email
    if (name === 'username' || name === 'email') {
      validationTimeoutRef.current = setTimeout(() => {
        const error = validateField(name, finalValue);
        setErrors(prev => ({
          ...prev,
          [name]: error
        }));
      }, 300); // 300ms delay
    }

    if (name === 'username' && value !== profile.username) {
      setUsernameChanged(true);
    } else if (name === 'username' && value === profile.username) {
      setUsernameChanged(false);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Special handling for requestedUserType
    let finalValue = value;
    if (name === 'requestedUserType') {
      // If user selects current user type, set to empty string (no change requested)
      if (value === profile.userType) {
        finalValue = '';
      }
    }
    
    // Validate field on blur for all fields
    const error = validateField(name, finalValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate all fields
    const newErrors = {};
    Object.keys(editedProfile).forEach(key => {
      const error = validateField(key, editedProfile[key]);
      if (error) newErrors[key] = error;
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setIsSubmitting(false);
      setSnackbar({
        open: true,
        message: 'Please fix the errors before submitting',
        severity: 'error'
      });
      return;
    }

    try {
      await onSave(editedProfile);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || err?.response?.data || 'Failed to save changes.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;

    if (!file.type.match('image.*')) {
      setSnackbar({
        open: true,
        message: 'Only image files are allowed (JPG, PNG, GIF)',
        severity: 'error'
      });
      return;
    }

    if (file.size > 800000) {
      setSnackbar({
        open: true,
        message: 'File size exceeds 800KB limit',
        severity: 'error'
      });
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setUploadProgress(0), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    const reader = new FileReader();
    reader.onloadend = () => {
      // setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    onPhotoUpdate(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemovePhoto = () => {
    onRemovePhoto();
    // setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const ProfilePhotoSection = () => (
    <Card sx={{ 
      mb: 3, 
      borderRadius: 3, 
      boxShadow: theme.shadows[2]
    }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ 
          p: 3, 
          pb: 2,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CameraAlt color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Profile Photo
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={previewImage}
                    sx={{
                      width: 120,
                      height: 120,
                      border: `3px solid ${theme.palette.primary.main}`,
                      boxShadow: theme.shadows[4]
                    }}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PhotoCamera />
                  </IconButton>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                <Typography variant="body1" color="text.secondary">
                  Upload a profile photo to personalize your account
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ borderRadius: 2 }}
                  >
                    Upload Photo
                  </Button>
                  
                  {previewImage && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteForever />}
                      onClick={handleRemovePhoto}
                      sx={{ borderRadius: 2 }}
                    >
                      Remove Photo
                    </Button>
                  )}
                </Box>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress}
                      sx={{ borderRadius: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Uploading... {uploadProgress}%
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );

  const FormSection = ({ title, icon: IconComponent, children }) => (
    <Card sx={{ 
      mb: 3, 
      borderRadius: 3, 
      boxShadow: theme.shadows[2],
      overflow: 'visible'
    }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ 
          p: 3, 
          pb: 2,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconComponent color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ p: 3 }}>
            {children}
          </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Header Card */}
        <Card sx={{ 
          mb: 4, 
          borderRadius: 3, 
          boxShadow: theme.shadows[2],
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.light}10 100%)`
        }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              color: theme.palette.primary.main,
              mb: 1
            }}>
              Edit Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Update your personal information and account settings
            </Typography>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <ProfilePhotoSection />
          
          {/* Contact Information */}
          <FormSection title="Contact Information" icon={Email}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={editedProfile.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!errors.username}
                  helperText={errors.username || (usernameChanged ? "You'll need to log in again with your new username" : "")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={editedProfile.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={editedProfile.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!errors.phone}
                  helperText={errors.phone || "Enter your mobile number for booking updates"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </FormSection>

          {/* Personal Information */}
          <FormSection title="Personal Information" icon={Person}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={editedProfile.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!errors.name}
                  helperText={errors.name}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  name="gender"
                  value={editedProfile.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  name="dob"
                  value={editedProfile.dob ? editedProfile.dob.substring(0, 10) : ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </FormSection>

          {/* User Type */}
          <FormSection title="Account Type" icon={Badge}>
            <FormControl fullWidth error={!!errors.requestedUserType}>
              <InputLabel>Request User Type Change</InputLabel>
              <Select
                name="requestedUserType"
                value={editedProfile.requestedUserType || profile.userType}
                onChange={handleChange}
                onBlur={handleBlur}
                label="Request User Type Change"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Coach">Coach</MenuItem>
                <MenuItem value="EventOrganizer">Event Organizer</MenuItem>
              </Select>
              {errors.requestedUserType && (
                <FormHelperText>{errors.requestedUserType}</FormHelperText>
              )}
            </FormControl>
            
            {profile.requestedUserType && (
              <Alert 
                severity="info" 
                icon={<Info />}
                sx={{ 
                  mt: 2, 
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontWeight: 500
                  }
                }}
              >
                Current request: Change to {profile.requestedUserType} (pending admin approval)
              </Alert>
            )}
          </FormSection>

          {/* Action Buttons */}
          <Card sx={{ 
            mt: 4, 
            borderRadius: 3, 
            boxShadow: theme.shadows[2],
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  startIcon={<Cancel />}
                  sx={{ 
                    borderRadius: 2,
                    borderColor: theme.palette.text.secondary,
                    color: theme.palette.text.secondary
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
                  sx={{ 
                    borderRadius: 2,
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark
                    }
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </form>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
});

export default EditProfileForm;