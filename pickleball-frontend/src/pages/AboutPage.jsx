import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Button, 
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  Fade,
  Slide,
  CircularProgress
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme } from '../context/ThemeContext';
import { 
  SportsTennis,
  Group,
  Star,
  TrendingUp,
  LocationOn,
  Phone,
  Email,
  ArrowForward
} from '@mui/icons-material';
import AboutUsService from '../service/AboutUsService';

const AboutPage = () => {
  const muiTheme = useMuiTheme();
  const { theme: themeMode, getPrimaryColor } = useTheme();
  
  const [statistics, setStatistics] = useState({
    activeCourts: 0,
    totalMembers: 0,
    averageRating: 0.0,
    matchesPlayed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await AboutUsService.getAboutUsStatistics();
        setStatistics(data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const stats = [
    { 
      icon: <SportsTennis />, 
      label: 'Active Courts', 
      value: loading ? '...' : `${statistics.activeCourts || 0}+`, 
      color: getPrimaryColor() 
    },
    { 
      icon: <Group />, 
      label: 'Total Members', 
      value: loading ? '...' : `${(statistics.totalMembers || 0).toLocaleString()}+`, 
      color: '#4CAF50' 
    },
    { 
      icon: <Star />, 
      label: 'Average Rating', 
      value: loading ? '...' : `${(statistics.averageRating || 0).toFixed(1)}/5`, 
      color: '#FFD700' 
    },
    { 
      icon: <TrendingUp />, 
      label: 'Matches Played', 
      value: loading ? '...' : `${(statistics.matchesPlayed || 0).toLocaleString()}+`, 
      color: '#FF9800' 
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        py: 4,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        
        {/* Hero Section */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit>
          <Fade in={true} timeout={800}>
            <Paper
              elevation={24}
              sx={{
                p: { xs: 4, md: 6 },
                mb: 6,
                textAlign: 'center',
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <SportsTennis sx={{ fontSize: 50, color: getPrimaryColor(), mb: 2 }} />
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                About Picklefy
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Modern pickleball court reservations, made simple.  
                Connect, book, and play anytime, anywhere.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Photos Section */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={400}>
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {[
              { src: '/about-1.jpg', text: 'Premium Courts', description: 'State-of-the-art facilities' },
              { src: '/about-2.jpg', text: 'Vibrant Community', description: 'Connect with players' },
              { src: '/about-3.jpg', text: 'Quality Equipment', description: 'Professional gear' },
              { src: '/about-4.jpg', text: 'Training Programs', description: 'Learn from experts' },
            ].map((item, index) => (
              <Grid item xs={12} md={6} lg={3} key={index}>
                <Fade in={true} timeout={600 + index * 200}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      height: 280,
                      '& img': {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                      },
                      '&:hover img': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <img src={item.src} alt={item.text} />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        p: 3,
                        color: 'white'
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {item.text}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Slide>

        {/* Stats Section */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={600}>
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Fade in={true} timeout={800 + index * 200}>
                  <Card
                    elevation={24}
                    sx={{
                      textAlign: 'center',
                      borderRadius: '20px',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${muiTheme.palette.divider}`,
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.15), 0 15px 15px -5px rgba(0, 0, 0, 0.08)'
                      }
                    }}
                  >
                    <CardContent sx={{ py: 4 }}>
                      <Box sx={{ color: stat.color, mb: 2 }}>
                        {React.cloneElement(stat.icon, { sx: { fontSize: 48 } })}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 60 }}>
                        {loading ? (
                          <CircularProgress size={40} sx={{ color: stat.color }} />
                        ) : error ? (
                          <Typography variant="h6" color="error" sx={{ textAlign: 'center' }}>
                            Error
                          </Typography>
                        ) : (
                          <Typography variant="h3" fontWeight="bold" gutterBottom>
                            {stat.value}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Slide>

        {/* Mission & Vision Section */}
        {/* Mission Section */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={800}>
          <Fade in={true} timeout={1200}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                mb: 4,
                borderRadius: '24px',
                background: muiTheme.palette.background.paper,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Our Mission
              </Typography>
              <Typography color="text.secondary" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                To make pickleball accessible for everyone —  
                seamless booking, easy connections, and a stronger community.
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                We believe that pickleball has the power to bring people together, 
                promote healthy living, and create lasting friendships.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Vision Section */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1000}>
          <Fade in={true} timeout={1400}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                mb: 6,
                borderRadius: '24px',
                background: muiTheme.palette.background.paper,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Our Vision
              </Typography>
              <Typography color="text.secondary" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                To become the leading platform for pickleball enthusiasts worldwide, 
                connecting millions of players and creating the most vibrant pickleball 
                community in the world.
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                We envision a future where anyone can easily find a court, 
                connect with players, and enjoy the sport they love.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Contact Section */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1000}>
          <Fade in={true} timeout={1400}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" component="h2" textAlign="center" fontWeight="bold" gutterBottom>
                Get In Touch
              </Typography>
              <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 5 }}>
                We'd love to hear from you
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        color: getPrimaryColor()
                      }}
                    >
                      <Email sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Email Us
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        support@picklefy.com
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        color: getPrimaryColor()
                      }}
                    >
                      <Phone sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Call Us
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        +60 12-345 6789
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        color: getPrimaryColor()
                      }}
                    >
                      <LocationOn sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Visit Us
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Kuala Lumpur, Malaysia
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        </Slide>

      </Container>
    </Box>
  );
};

export default AboutPage;
