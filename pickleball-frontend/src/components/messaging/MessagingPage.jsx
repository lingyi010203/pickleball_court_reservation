// src/pages/MessagingPage.jsx
import React from 'react';
import { Container, Box } from '@mui/material';
import MessagingHub from './MessagingHub';
import { SocketProvider } from '../../context/SocketContext';

export default function MessagingPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 4, height: '80vh' }}>
      <Box 
        sx={{ 
          height: '100%', 
          border: '1px solid #e0e0e0', 
          borderRadius: 2, 
          overflow: 'hidden',
          boxShadow: 3
        }}
      >
        <SocketProvider>
          <MessagingHub />
        </SocketProvider>
      </Box>
    </Container>
  );
}