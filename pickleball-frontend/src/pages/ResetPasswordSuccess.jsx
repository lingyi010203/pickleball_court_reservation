// src/pages/ResetPasswordSuccess.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, AppBar, Toolbar, useTheme } from '@mui/material';

const ResetPasswordSuccess = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: theme.palette.primary.main }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            PICKLEBALL
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Home</Button>
          <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
          <Button color="inherit" onClick={() => navigate('/register')}>Register</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4,
        backgroundColor: theme.palette.background.default,
      }}>
        <Container maxWidth="sm">
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              padding: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold', color: theme.palette.success.main }}>
              Password changed!
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, color: theme.palette.text.primary }}>
              You've Successfully Completed Your Password Reset!
            </Typography>
            
            <Button
              variant="contained"
              sx={{
                py: 1.5,
                px: 4,
                backgroundColor: theme.palette.primary.main,
                '&:hover': { backgroundColor: theme.palette.primary.dark },
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}
              onClick={() => navigate('/login')}
            >
              Log In Now
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default ResetPasswordSuccess;