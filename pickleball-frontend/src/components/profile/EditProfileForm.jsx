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
  Alert
} from '@mui/material';
import { CameraAlt, Delete } from '@mui/icons-material';

const EditProfileForm = ({ profile, onSave, onCancel, onPhotoUpdate, onRemovePhoto }) => {
  const [editedProfile, setEditedProfile] = useState({
    ...profile,
    requestedUserType: profile.requestedUserType || profile.userType
  });

  const [userTypeError, setUserTypeError] = useState('');
  const [usernameChanged, setUsernameChanged] = useState(false);
  const fileInputRef = useRef(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [previewImage, setPreviewImage] = useState(
    profile.profileImage ? `http://localhost:8081/uploads/${profile.profileImage}` : null
  );

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (profile.profileImage) {
      // Add cache-busting parameter
      setPreviewImage(
        `http://localhost:8081/uploads/${profile.profileImage}?ts=${Date.now()}`
      );
    } else {
      setPreviewImage(null);
    }
  }, [profile.profileImage]);


  const statusColor = profile.status === 'ACTIVE' ? 'success' :
    profile.status === 'PENDING' ? 'warning' :
      profile.status === 'LOCKED' ? 'error' : 'default';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'requestedUserType') {
      if (value === profile.userType) {
        setUserTypeError('Cannot select current user type');
      }
      else if (value !== 'User' && value !== 'Coach' && value !== 'EventOrganizer') {
        setUserTypeError('Only User, Coach or EventOrganizer allowed');
      } else {
        setUserTypeError('');
      }
    }

    if (name === 'username' && value !== profile.username) {
      setUsernameChanged(true);
    } else if (name === 'username' && value === profile.username) {
      setUsernameChanged(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userTypeError) return;
    onSave(editedProfile);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('Selected file:', file);

    e.target.value = '';

    if (!file) {
      console.log('No file selected');
      return;
    }

    // Validate file type
    if (!file.type.match('image.*')) {
      setSnackbar({
        open: true,
        message: 'Only image files are allowed (JPG, PNG, GIF)',
        severity: 'error'
      });
      return;
    }

    // Validate file size (800KB limit)
    if (file.size > 800000) {
      setSnackbar({
        open: true,
        message: 'File size exceeds 800KB limit',
        severity: 'error'
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload the file
    onPhotoUpdate(file);
  };

  const handleRemovePhoto = () => {
    console.log('Removing profile photo');
    onRemovePhoto();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      p: 2,
      mb: 2,
      maxWidth: '900px',
       position: 'relative'
    }}>
      <Box sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Chip
          label={profile.status}
          color={statusColor}
          size="small"
          sx={{
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '0.7rem'
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Avatar
          src={previewImage}
          sx={{
            width: 100,
            height: 100,
            bgcolor: previewImage ? 'transparent' : '#8e44ad',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            mr: 3
          }}
        >
          {!previewImage && profile?.username?.split(' ').map(n => n[0]).join('')}
        </Avatar>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            onClick={() => fileInputRef.current.click()}
            sx={{
              borderColor: '#8e44ad',
              color: '#8e44ad',
              textTransform: 'none',
              fontWeight: 500,
              mb: 1
            }}
          >
            Edit Photo
          </Button>

          {previewImage && (
            <Button
              variant="outlined"
              startIcon={<Delete />}
              onClick={handleRemovePhoto}
              sx={{
                borderColor: '#f44336',
                color: '#f44336',
                textTransform: 'none',
                fontWeight: 500,
                mb: 1
              }}
            >
              Remove
            </Button>
          )}

          <Typography variant="body2" color="text.secondary">
            JPG, PNG or GIF. Max size of 800KB
          </Typography>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { md: '1fr 1fr' },
        gap: 4,
        rowGap: 3
      }}>
        <Box>
          <Typography variant="subtitle2" sx={{
            fontWeight: 'bold',
            mb: 2,
            color: '#8e44ad',
            fontSize: '1.1rem'
          }}>
            CONTACT
          </Typography>

          <TextField
            fullWidth
            label="Username"
            name="username"
            value={editedProfile.username}
            onChange={handleChange}
            sx={{ mb: 3 }}
            helperText={usernameChanged ? "You'll need to log in again with your new username" : ""}
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            value={editedProfile.email}
            onChange={handleChange}
            type="email"
            sx={{ mb: 3 }}
            helperText="We will be sending your booking confirmation to this email."
          />

          <TextField
            fullWidth
            label="Mobile number"
            name="phone"
            value={editedProfile.phone}
            onChange={handleChange}
            sx={{ mb: 3 }}
            helperText="Enter your mobile number for booking updates. This will stay private and not be visible on your profile."
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{
            fontWeight: 'bold',
            mb: 2,
            color: '#8e44ad',
            fontSize: '1.1rem'
          }}>
            PERSONAL
          </Typography>

          <TextField
            fullWidth
            label="Name"
            name="name"
            value={editedProfile.name}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />

          <TextField
            select
            fullWidth
            label="Gender"
            name="gender"
            value={editedProfile.gender}
            onChange={handleChange}
            sx={{ mb: 6 }}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            name="dob"
            value={editedProfile.dob ? editedProfile.dob.substring(0, 10) : ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 3 }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 2, mb: 1 }}>
        <FormControl fullWidth error={!!userTypeError} sx={{ mb: 2 }}>
          <InputLabel>User Type</InputLabel>
          <Select
            name="requestedUserType"
            value={editedProfile.requestedUserType}
            onChange={handleChange}
            label="Request User Type Change"
          >
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="Coach">Coach</MenuItem>
            <MenuItem value="EventOrganizer">Event Organizer</MenuItem>
          </Select>
          {userTypeError && <FormHelperText>{userTypeError}</FormHelperText>}
        </FormControl>

        {profile.requestedUserType && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Current request: Change to {profile.requestedUserType} (pending admin approval)
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        mt: 2
      }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{
            color: 'text.secondary',
            borderColor: 'text.secondary',
            minWidth: '100px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            py: 0.5,
            px: 2,
            fontSize: '0.8rem'
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!!userTypeError}
          sx={{
            backgroundColor: '#8e44ad',
            '&:hover': { backgroundColor: '#732d91' },
            minWidth: '180px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            py: 0.5,
            px: 2,
            fontSize: '0.8 rem'
          }}
        >
          Save Changes
        </Button>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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
    </Box>
  );
};

export default EditProfileForm;