// src/pages/MessagingPage.jsx
import React from 'react';
import { Container, Box } from '@mui/material';
import MessagingHub from './MessagingHub';
import { SocketProvider } from '../../context/SocketContext';
import { useTheme, alpha } from '@mui/material/styles';

export default function MessagingPage() {
  const theme = useTheme();
  return (
    <Container maxWidth="xl" sx={{ 
      mt: { xs: 1, sm: 2 }, 
      height: { xs: 'calc(100vh - 16px)', md: 'calc(100vh - 32px)' }, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      p: 0
    }}>
      <Box
        sx={{
          height: '100%',
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.shadows[8],
          bgcolor: theme.palette.background.paper,
          display: 'flex',
          flexDirection: 'row',
          border: theme.palette.mode === 'dark'
            ? `1px solid ${alpha(theme.palette.divider, 0.3)}`
            : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.95)})`,
          backdropFilter: 'blur(10px)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.secondary.main, 0.03)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
            pointerEvents: 'none'
          }
        }}
      >
        <SocketProvider>
          <MessagingHub />
        </SocketProvider>
      </Box>
    </Container>
  );
}