// src/components/home/FeaturedCourts.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  Button, 
  Chip, 
  CircularProgress, 
  CardActions,
  Alert,
  useTheme as useMuiTheme,
  useMediaQuery
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CourtService from '../../service/CourtService';
import { getCourtImagesPublic } from '../../service/CourtService';
import { useTheme } from '../../context/ThemeContext';

const FeaturedCourts = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courtImages, setCourtImages] = useState({});
  const [venueNames, setVenueNames] = useState({});
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const { getPrimaryColor, getPrimaryDarkColor, getPrimaryLightColor } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await CourtService.getAllCourts();
        
        // 过滤出可用的球场，并按评分排序
        const availableCourts = data
          .filter(court => court.status !== 'MAINTENANCE')
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, isMobile ? 2 : 4); // 移动端显示2个，桌面端显示4个
        
        setCourts(availableCourts);
        
        // 加载图片和venue名称
        const imagesObj = {};
        const venueNamesObj = {};
        await Promise.all(
          availableCourts.map(async (court) => {
            try {
              const imgs = await getCourtImagesPublic(court.id);
              imagesObj[court.id] = imgs && imgs.length > 0 ? imgs[0].imagePath : null;
            } catch {
              imagesObj[court.id] = null;
            }
            
            // 获取venue名称
            if (court.venue && court.venue.name) {
              venueNamesObj[court.id] = court.venue.name;
            } else {
              venueNamesObj[court.id] = 'Venue not available';
            }
          })
        );
        setCourtImages(imagesObj);
        setVenueNames(venueNamesObj);
      } catch (err) {
        console.error('Error fetching courts:', err);
        setError('Failed to load featured courts. Please try again later.');
        setCourts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourts();
  }, [isMobile]);

  const formatPrice = (court) => {
    if (court.offPeakHourlyPrice) {
      return `RM ${court.offPeakHourlyPrice}/hour`;
    }
    if (court.price) {
      return `RM ${court.price}/hour`;
    }
    return 'Price not available';
  };

  const formatRating = (rating) => {
    if (rating && rating > 0) {
      return rating.toFixed(1);
    }
    return 'No ratings yet';
  };

  if (loading) {
    return (
      <Box sx={{ mb: 6, maxWidth: 1200, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: 'black' }}>Featured Courts</Typography>
          <Button variant="outlined" size="small" onClick={() => navigate('/courts')}>
            View All Courts
          </Button>
        </Box>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress size={40} sx={{ color: getPrimaryColor() }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading featured courts...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 6, maxWidth: 1200, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: 'black' }}>Featured Courts</Typography>
          <Button variant="outlined" size="small" onClick={() => navigate('/courts')}>
            View All Courts
          </Button>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2, backgroundColor: getPrimaryColor(), '&:hover': { backgroundColor: getPrimaryDarkColor() } }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  if (courts.length === 0) {
    return (
      <Box sx={{ mb: 6, maxWidth: 1200, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: 'black' }}>Featured Courts</Typography>
          <Button variant="outlined" size="small" onClick={() => navigate('/courts')}>
            View All Courts
          </Button>
        </Box>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No featured courts available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Check out all our courts to find your perfect match
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/courts')}
            sx={{ 
              background: `linear-gradient(135deg, ${getPrimaryColor()}, ${getPrimaryLightColor()})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${getPrimaryDarkColor()}, ${getPrimaryColor()})`
              }
            }}
          >
            Browse All Courts
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 6, maxWidth: 1200, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: 'black' }}>Featured Courts</Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => navigate('/courts')}
          sx={{
            borderColor: getPrimaryColor(),
            color: getPrimaryColor(),
            '&:hover': {
              borderColor: getPrimaryDarkColor(),
              backgroundColor: muiTheme.palette.mode === 'dark' ? '#2c2c2c' : `${getPrimaryColor()}10`,
            }
          }}
        >
          View All Courts
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {courts.map(court => (
          <Grid item xs={12} sm={6} md={4} key={court.id}>
            <Card sx={{ 
              borderRadius: 4, 
              position: 'relative', 
              boxShadow: 3, 
              overflow: 'visible', 
              height: 400, 
              width: 250,
              display: 'flex', 
              flexDirection: 'column',
              transition: muiTheme.transitions.create(['transform', 'box-shadow'], {
                duration: muiTheme.transitions.duration.short,
              }),
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}>
              {courtImages[court.id] ? (
                <CardMedia
                  component="img"
                  image={courtImages[court.id]}
                  alt={court.name}
                  sx={{
                    height: 160,
                    width: 250,
                    objectFit: 'cover',
                    position: 'relative',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16
                  }}
                />
              ) : (
                <CardMedia
                  component="div"
                  sx={{
                    height: 160,
                    background: `linear-gradient(135deg, ${getPrimaryColor()}, ${getPrimaryLightColor()})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 48,
                    position: 'relative',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16
                  }}
                >
                  🎾
                </CardMedia>
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 250,
                  mb: 1,
                  fontSize: '1rem',
                  color: 'black'
                }}>
                  {court.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'black', mb: 1 }}>
                  <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'black' }} />
                  <Typography variant="body2" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'black'
                  }}>
                    {venueNames[court.id] || 'Venue not available'}
                  </Typography>
                </Box>
                
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: getPrimaryColor() }}>
                  {formatPrice(court)}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {(court.features || []).slice(0, 2).map(f => (
                    <Chip 
                      key={f} 
                      label={f} 
                      size="small" 
                      sx={{ 
                        bgcolor: muiTheme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#ecf0f1', 
                        color: muiTheme.palette.text.secondary,
                        fontSize: '0.75rem'
                      }} 
                    />
                  ))}
                  {(court.features || []).length > 2 && (
                    <Chip 
                      label={`+${(court.features || []).length - 2} more`} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
                
                {/* Rating moved to above CardActions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, mb: 0.5 }}>
                  <StarIcon fontSize="small" color="warning" />
                  <Typography variant="body2" sx={{ color: 'black' }}>
                    {formatRating(court.rating)}
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions sx={{ 
                mt: 'auto', 
                justifyContent: 'space-between', 
                px: 2.5, 
                py: 1.5, 
                borderTop: `1px solid ${muiTheme.palette.divider}` 
              }}>
                <Button 
                  size="small" 
                  onClick={() => navigate(`/courts/${court.id}`)} 
                  sx={{ 
                    color: muiTheme.palette.success.main,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  View Details
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={() => navigate(`/booking/${court.id}`)}
                  sx={{ 
                    background: `linear-gradient(135deg, ${getPrimaryColor()}, ${getPrimaryLightColor()})`,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    px: 2,
                    '&:hover': { 
                      background: `linear-gradient(135deg, ${getPrimaryDarkColor()}, ${getPrimaryColor()})`,
                      boxShadow: `0 2px 8px ${getPrimaryColor()}40`
                    }
                  }}
                >
                  Book Now
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FeaturedCourts;