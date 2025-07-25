// src/pages/MessagingPage.jsx
import React from 'react';
import { Container, Box } from '@mui/material';
import MessagingHub from './MessagingHub';
import { SocketProvider } from '../../context/SocketContext';
import { useTheme, alpha } from '@mui/material/styles';

export default function MessagingPage() {
  const theme = useTheme();
  return (
    <Container maxWidth="md" sx={{ 
      mt: { xs: 2, sm: 4 }, 
      height: { xs: 'calc(100vh - 32px)', md: '85vh' }, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      p: 0
    }}>
      <Box
        sx={{
          height: '100%',
          width: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: theme.shadows[6],
          bgcolor: theme.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
          border: theme.palette.mode === 'dark'
            ? `1px solid ${alpha(theme.palette.divider, 0.3)}`
            : `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }}
      >
        <SocketProvider>
          <MessagingHub />
        </SocketProvider>
      </Box>
    </Container>
  );
}