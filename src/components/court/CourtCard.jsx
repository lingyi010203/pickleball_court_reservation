// src/components/court/CourtCard.jsx
import React from 'react';
import { Card, CardMedia, CardContent, CardActions, Typography, Button, Chip, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CourtCard = ({ court }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate(`/courts/${court.id}`);
  };
  
  const handleBookNow = () => {
    navigate(`/booking/${court.id}`);
  };

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': { 
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
      }
    }}>
      <CardMedia
        component="img"
        height="180"
        image={court.imageUrl || '/default-court.jpg'}
        alt={court.name}
        sx={{ 
          objectFit: 'cover',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}
      />
      <CardContent sx={{ flexGrow: 1, px: 2.5, py: 2 }}>
        <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {court.name}
        </Typography>
        {/* 场馆信息 */}
        {court.venue && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
            {court.venue.name} ({court.venue.location})
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
          {court.location}
        </Typography>
        {/* 营业时间 */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
          Open: {court.openingTime} - {court.closingTime}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          {/* 价格信息 */}
          <Chip 
            label={`Off-peak: RM${court.offPeakHourlyPrice || '50'}/hr`} 
            size="small" 
            color="primary" 
            sx={{ fontWeight: 'bold', borderRadius: '8px' }}
          />
          <Chip 
            label={`Peak: RM${court.peakHourlyPrice || '80'}/hr (${court.peakStartTime || '16:00'}-${court.peakEndTime || '20:00'})`} 
            size="small" 
            color="warning" 
            sx={{ fontWeight: 'bold', borderRadius: '8px' }}
          />
          {/* 状态显示更细致 */}
          <Chip 
            label={court.status === 'MAINTENANCE' ? 'Maintenance' : court.status === 'ACTIVE' ? 'Available' : court.status === 'INACTIVE' ? 'Inactive' : court.status} 
            size="small" 
            variant="outlined" 
            color={court.status === 'MAINTENANCE' ? 'error' : court.status === 'ACTIVE' ? 'success' : 'default'}
            sx={{ borderRadius: '8px' }}
          />
        </Box>
      </CardContent>
      <CardActions sx={{ 
        justifyContent: 'space-between', 
        px: 2.5, 
        py: 1.5,
        borderTop: '1px solid rgba(0, 0, 0, 0.12)'
      }}>
        <Button 
          size="small" 
          onClick={handleViewDetails} 
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
          onClick={handleBookNow}
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
  );
};

export default CourtCard;