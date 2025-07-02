import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const StatCard = ({ title, value, icon }) => {
  return (
    <Box sx={{ 
      background: 'white',
      borderRadius: '14px',
      p: 2.5,
      height: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      border: '1px solid #e0e0e0'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ 
          fontWeight: 500, 
          color: 'rgba(0,0,0,0.7)',
          fontSize: '0.9rem'
        }}>
          {title}
        </Typography>
        <Avatar sx={{ 
          bgcolor: '#f5f5f5', 
          width: 40, 
          height: 40,
        }}>
          {icon}
        </Avatar>
      </Box>
      
      <Typography variant="h5" sx={{ 
        fontWeight: 'bold', 
        mt: 2,
        color: 'rgba(0,0,0,0.85)',
        fontSize: '1.5rem'
      }}>
        {value}
      </Typography>
    </Box>
  );
};

export default StatCard;