import React from 'react';
import { Box, Typography, Button, Divider, List, ListItem, ListItemText, useTheme, alpha } from '@mui/material';
import { Edit } from '@mui/icons-material';

const ProfileDetails = ({ profile, onEdit }) => {
  const theme = useTheme();
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Personal Details
        </Typography>
        <Button 
          startIcon={<Edit />} 
          variant="outlined"
          onClick={onEdit}
          sx={{ 
            color: theme.palette.primary.main, 
            borderColor: theme.palette.primary.main,
            '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.7) }
          }}
        >
          Edit
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <DetailItem label="Username" value={profile.username} />
        <DetailItem label="Name" value={profile.name} />
        <DetailItem label="Email" value={profile.email} />
        <DetailItem label="Phone" value={profile.phone || 'Not provided'} />
        <DetailItem label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not provided'} />
        <DetailItem label="Gender" value={profile.gender || 'Not provided'} />
        <DetailItem label="User Type" value={profile.userType} />
        
        {profile.requestedUserType && (
          <DetailItem 
            label="Requested Type" 
            value={`${profile.requestedUserType} (pending approval)`} 
          />
        )}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        Account Settings
      </Typography>
    </>
  );
};

const DetailItem = ({ label, value }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
};

export default ProfileDetails;