import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import QuickActions from '../components/home/QuickActions';
import FeaturedCourts from '../components/home/FeaturedCourts';
import UpcomingEvents from '../components/home/UpcomingEvents';
import { Container, Box, Typography, Button, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Hero images (from /public)
  const heroImages = useMemo(() => [
    process.env.PUBLIC_URL + '/home-1.jpg',
    process.env.PUBLIC_URL + '/home-2.jpg',
    process.env.PUBLIC_URL + '/home-3.jpg',
    process.env.PUBLIC_URL + '/home-4.jpg',
    process.env.PUBLIC_URL + '/home-5.jpg'
  ], []);

  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Preload first image and start auto-rotate
  useEffect(() => {
    const img = new Image();
    img.src = heroImages[0];
    img.onload = () => setLoaded(true);
  }, [heroImages]);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((p) => (p + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(id);
  }, [heroImages.length]);

  return (
    <>
      {/* Hero Section with auto-sliding background */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 380, md: 520 },
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          transition: 'background-image 800ms ease-in-out',
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.4) 100%), url(${heroImages[current]})`
        }}
      >
        {/* Content overlay */}
        <Box sx={{ maxWidth: 1200, width: '100%', px: { xs: 2, sm: 3, lg: 4 } }}>
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            fontWeight="800"
            sx={{ color: '#fff', textShadow: '0 6px 18px rgba(0,0,0,0.35)', mb: 1 }}
          >
            Reserve Your Court, Let’s Play
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 720, mb: 3 }}
          >
            Seamless pickleball bookings, curated venues, and vibrant community events near you.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/courts')}
              sx={{
                px: 3,
                py: 1.25,
                borderRadius: 2,
                background: 'linear-gradient(45deg, #7C4DFF 0%, #651FFF 100%)',
                '&:hover': { background: 'linear-gradient(45deg, #6A5ACD 0%, #5E35B1 100%)' }
              }}
            >
              Explore Courts
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/events')}
              sx={{
                px: 3,
                py: 1.25,
                borderRadius: 2,
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.7)',
                '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' }
              }}
            >
              Upcoming Events
            </Button>
          </Stack>

          {/* Dots */}
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 18, left: 24 }}>
            {heroImages.map((_, i) => (
              <Box key={i} sx={{
                width: i === current ? 18 : 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: i === current ? 'primary.main' : 'rgba(255,255,255,0.6)',
                transition: 'all 250ms ease'
              }} />
            ))}
          </Stack>
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, lg: 4 } }}>
      <Box sx={{
        maxWidth: 1200,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>

        <QuickActions />
        <FeaturedCourts />
        <UpcomingEvents />
      </Box>
    </Container>
    </>
  );
};

export default HomePage;