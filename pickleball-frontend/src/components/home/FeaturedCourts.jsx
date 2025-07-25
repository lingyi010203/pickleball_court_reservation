// src/components/home/FeaturedCourts.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, CardMedia, Typography, Box, Button, Chip, CircularProgress, CardActions } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CourtService from '../../service/CourtService';
import { getCourtImagesPublic } from '../../service/CourtService';

const FeaturedCourts = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courtImages, setCourtImages] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        const data = await CourtService.getAllCourts();
        setCourts(data.slice(0, 3)); // 只显示前3个featured
        // 加载图片
        const imagesObj = {};
        await Promise.all(
          data.slice(0, 3).map(async (court) => {
            try {
              const imgs = await getCourtImagesPublic(court.id);
              imagesObj[court.id] = imgs && imgs.length > 0 ? imgs[0].imagePath : null;
            } catch {
              imagesObj[court.id] = null;
            }
          })
        );
        setCourtImages(imagesObj);
      } catch (err) {
        setCourts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourts();
  }, []);

  return (
    <Box 
      sx={{ 
        mb: 6,
        maxWidth: 1200,
        mx: 'auto',
        width: '100%'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Featured Courts</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate('/courts')}>View All Courts</Button>
      </Box>
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {courts.map(court => (
            <Grid item xs={12} md={4} key={court.id}>
              <Card sx={{ 
                borderRadius: 3, 
                position: 'relative', 
                boxShadow: 3, 
                overflow: 'visible', 
                height: 370, 
                display: 'flex', 
                flexDirection: 'column' 
              }}>
                {/* 修正CardMedia用法，img时无children，div时显示🎾和Unavailable */}
                {courtImages[court.id] ? (
                  <CardMedia
                    component="img"
                    image={courtImages[court.id]}
                    alt={court.name}
                    sx={{
                      height: 160,
                      width: '100%',
                      objectFit: 'cover',
                      position: 'relative'
                    }}
                  />
                ) : (
                  <CardMedia
                    component="div"
                    sx={{
                      height: 160,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 48,
                      position: 'relative'
                    }}
                  >
                    🎾
                    {court.status === 'MAINTENANCE' && (
                      <Chip label="Unavailable" color="error" size="small" sx={{ position: 'absolute', top: 12, right: 12 }} />
                    )}
                  </CardMedia>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">{court.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon fontSize="small" color="warning" />
                      <Typography variant="body2">{court.rating || '4.8'}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">{court.location}</Typography>
                  </Box>
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                    RM {court.offPeakHourlyPrice || court.price || 25}/hour
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {(court.features || []).map(f => (
                      <Chip key={f} label={f} size="small" sx={{ bgcolor: '#ecf0f1', color: '#666' }} />
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ mt: 'auto', justifyContent: 'space-between', px: 2.5, py: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/courts/${court.id}`)} 
                    sx={{ 
                      color: '#2e7d32',
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
                    disabled={court.status === 'MAINTENANCE'}
                    sx={{ 
                      backgroundColor: '#ff6f00',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '0.875rem',
                      borderRadius: '8px',
                      px: 2,
                      '&:hover': { 
                        backgroundColor: '#e65100',
                        boxShadow: '0 2px 8px rgba(230, 81, 0, 0.4)'
                      },
                      '&:disabled': { 
                        backgroundColor: '#e0e0e0',
                        color: '#9e9e9e'
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
      )}
    </Box>
  );
};

export default FeaturedCourts;