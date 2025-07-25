import React from 'react';
import { Box, Typography, Avatar, useTheme, alpha } from '@mui/material';
import ThemedCard from './ThemedCard';

const StatCard = ({ title, value, icon }) => {
  const theme = useTheme();
  return (
    <ThemedCard sx={{ 
      background: theme.palette.background.paper,
      borderRadius: '14px',
      p: 2.5,
      height: 'auto',
      boxShadow: theme.shadows[1],
      border: `1.5px solid ${theme.palette.divider}`
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ 
          fontWeight: 500, 
          color: theme.palette.text.secondary,
          fontSize: '0.9rem'
        }}>
          {title}
        </Typography>
        <Avatar sx={{ 
          bgcolor: theme.palette.action.hover, 
          width: 40, 
          height: 40,
        }}>
          {icon}
        </Avatar>
      </Box>
      
      <Typography variant="h5" sx={{ 
        fontWeight: 'bold', 
        mt: 2,
        color: theme.palette.text.primary,
        fontSize: '1.5rem'
      }}>
        {value}
      </Typography>
    </ThemedCard>
  );
};

export default StatCard;