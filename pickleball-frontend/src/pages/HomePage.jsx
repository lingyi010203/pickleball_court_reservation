import React from 'react';
import { useAuth } from '../context/AuthContext';
import QuickActions from '../components/home/QuickActions';
import FeaturedCourts from '../components/home/FeaturedCourts';
import UpcomingEvents from '../components/home/UpcomingEvents';
import { Container, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const HomePage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const theme = useTheme();

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, lg: 4 } }}>
      <Box sx={{
        maxWidth: 1200,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight="bold" sx={{
            background: 'linear-gradient(45deg, #8e44ad, #3498db)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}>
            {isAuthenticated() && currentUser
              ? `Welcome Back, ${currentUser.username}!`
              : 'Welcome to Pickleball Pro!'}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {isAuthenticated() && currentUser
              ? 'Ready for your next pickleball adventure?'
              : 'Please log in to access your profile and bookings.'}
          </Typography>
        </Box>
        <QuickActions />
        <FeaturedCourts />
        <UpcomingEvents />
      </Box>
    </Container>
  );
};

export default HomePage;