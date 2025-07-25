import React, { useState, useRef, useEffect } from 'react';
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
  Fade,
  Slide,
  Stack,
  LinearProgress,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  Zoom,
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

const EditProfileForm = ({ 
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
  const [editedProfile, setEditedProfile] = useState({
    ...profile,
    requestedUserType: profile.requestedUserType || profile.userType || "User"
  });

  const [errors, setErrors] = useState({});
  const [usernameChanged, setUsernameChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [previewImage, setPreviewImage] = useState(
    profile.profileImage ? `http://localhost:8081/uploads/${profile.profileImage}` : null
  );

  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    contact: true,
    personal: true,
    userType: true
  });

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (profile.profileImage) {
      setPreviewImage(
        `http://localhost:8081/uploads/${profile.profileImage}?ts=${Date.now()}`
      );
    } else {
      setPreviewImage(null);
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
        if (value === profile.userType) error = 'Cannot select current user type';
        else if (!['User', 'Coach', 'EventOrganizer'].includes(value)) error = 'Invalid user type selection';
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    if (name === 'username' && value !== profile.username) {
      setUsernameChanged(true);
    } else if (name === 'username' && value === profile.username) {
      setUsernameChanged(false);
    }
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
      setPreviewImage(reader.result);
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
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const ProfilePhotoSection = () => (
    <Card elevation={0} sx={{ mb: 4, border: `2px dashed ${theme.palette.divider}`, borderRadius: 3 }}>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
          <Avatar
            src={previewImage}
            sx={{
              width: 120,
              height: 120,
              bgcolor: theme.palette.primary.main,
              fontSize: '2.5rem',
              fontWeight: 'bold',
              border: `4px solid ${theme.palette.background.paper}`,
              boxShadow: theme.shadows[8],
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            {!previewImage && (
              <Person sx={{ fontSize: '3rem' }} />
            )}
          </Avatar>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: '50%',
              color: 'white'
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  size={40} 
                  sx={{ color: 'white', mb: 1 }}
                />
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {uploadProgress}%
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            border: `2px dashed ${isDragOver ? theme.palette.primary.main : theme.palette.grey[300]}`,
            borderRadius: 2,
            p: 3,
            backgroundColor: isDragOver ? theme.palette.primary.light + '20' : 'transparent',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.light + '10'
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUpload sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 1 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
            Drop your photo here, or click to browse
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            JPG, PNG, GIF • Maximum 800KB
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              sx={{ borderRadius: 2 }}
            >
              Choose Photo
            </Button>
            {previewImage && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForever />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePhoto();
                }}
                sx={{ borderRadius: 2 }}
              >
                Remove
              </Button>
            )}
          </Stack>
        </Box>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </CardContent>
    </Card>
  );

  const FormSection = ({ title, icon: IconComponent, children, section, step }) => (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.light}10 100%)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            cursor: 'pointer'
          }}
          onClick={() => toggleSection(section)}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: theme.palette.primary.main,
                color: 'white'
              }}>
                <IconComponent />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            </Stack>
            <IconButton size="small">
              <Edit />
            </IconButton>
          </Stack>
        </Box>
        
        <Collapse in={expandedSections[section]}>
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="md">
      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <Box sx={{ py: 4 }}>
          {/* Header Card */}
          <Card 
            elevation={4} 
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Edit Profile
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                Update your personal information and preferences
              </Typography>
              
              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                sx={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.textColor,
                  fontWeight: 'bold',
                  boxShadow: theme.shadows[2]
                }}
              />
            </CardContent>
          </Card>

          <Box component="form" onSubmit={handleSubmit}>
            {/* Photo Upload */}
            <ProfilePhotoSection />

            {/* Contact Information */}
            <FormSection title="Contact Information" icon={Email} section="contact">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={editedProfile.username}
                    onChange={handleChange}
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
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email || "We'll send booking confirmations to this email"}
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    name="phone"
                    value={editedProfile.phone}
                    onChange={handleChange}
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
            <FormSection title="Personal Information" icon={Person} section="personal">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={editedProfile.name}
                    onChange={handleChange}
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
            <FormSection title="Account Type" icon={Badge} section="userType">
              <FormControl fullWidth error={!!errors.requestedUserType}>
                <InputLabel>Request User Type Change</InputLabel>
                <Select
                  name="requestedUserType"
                  value={editedProfile.requestedUserType}
                  onChange={handleChange}
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
            <Card elevation={2} sx={{ borderRadius: 3, mt: 4 }}>
              <CardContent>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  justifyContent="flex-end"
                  alignItems="center"
                >
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    startIcon={<Cancel />}
                    disabled={isSubmitting}
                    size="large"
                    sx={{
                      minWidth: 140,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    disabled={isSubmitting}
                    size="large"
                    sx={{
                      minWidth: 180,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      }
                    }}
                  >
                    {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Slide>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            '& .MuiAlert-message': {
              fontWeight: 500
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditProfileForm;