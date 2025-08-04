import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import MyClassSessions from './MyClassSessions';

const MyClassSessionsPage = () => {
  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: '16px' }}>
        <MyClassSessions />
      </Paper>
    </Box>
  );
};

export default MyClassSessionsPage; 