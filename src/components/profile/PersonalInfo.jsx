import React from 'react';
import { Box, Typography } from '@mui/material';

const PersonalInfo = ({ profile }) => {
  return (
    <Box sx={{ 
      backgroundColor: 'white', 
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      p: 3
    }}>
      <Typography variant="subtitle1" sx={{ 
        fontWeight: 'bold', 
        mb: 1,
        color: '#8e44ad'
      }}>
        PERSONAL
      </Typography>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          Name
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {profile.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Changes of name will be reflected across your account
        </Typography>
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          Gender
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {profile.gender || 'Not provided'}
        </Typography>
      </Box>
    </Box>
  );
};

export default PersonalInfo;