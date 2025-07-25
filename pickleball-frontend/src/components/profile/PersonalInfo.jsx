import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';

const PersonalInfo = (props) => {
  const theme = useTheme();
  return (
    <Box sx={{ 
      backgroundColor: theme.palette.background.paper, 
      borderRadius: '16px',
      boxShadow: theme.shadows[4],
      p: 3
    }}>
      <Typography variant="subtitle1" sx={{ 
        fontWeight: 'bold', 
        mb: 1,
        color: theme.palette.primary.main
      }}>
        PERSONAL
      </Typography>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          Name
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {props.profile.name}
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
          {props.profile.gender || 'Not provided'}
        </Typography>
      </Box>
    </Box>
  );
};

export default PersonalInfo;