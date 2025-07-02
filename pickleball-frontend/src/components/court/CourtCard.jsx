import React from 'react';
import { 
  Card, CardMedia, CardContent, CardActions, 
  Typography, Button, Chip, Box, Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SportsTennis } from '@mui/icons-material';

const CourtCard = ({ court, onBookNow }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => navigate(`/courts/${court.id}`);
  
  return (
    <Card sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': { 
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
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
        <Typography gutterBottom variant="h6" component="div" sx={{ 
          fontWeight: 700,
          mb: 1,
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {court.name}
        </Typography>
        
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
          <Chip 
            label={`RM${court.offPeakHourlyPrice || '50'}/hr`} 
            size="small" 
            color="primary" 
            sx={{ fontWeight: 700 }}
          />
          <Chip 
            label={court.status === 'MAINTENANCE' ? 'Maintenance' : 'Available'} 
            size="small" 
            variant="outlined" 
            color={court.status === 'MAINTENANCE' ? 'error' : 'success'}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
        
        <Typography variant="body2" color="text.secondary" sx={{ 
          mb: 2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {court.location}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ 
        justifyContent: 'space-between', 
        px: 2.5, 
        py: 1.5,
        borderTop: '1px solid rgba(0, 0, 0, 0.08)'
      }}>
        <Button 
          size="small" 
          onClick={handleViewDetails} 
          sx={{ 
            color: '#1976d2',
            fontWeight: 600,
            textTransform: 'none'
          }}
        >
          View Details
        </Button>
        <Button 
          size="small" 
          variant="contained" 
          onClick={() => onBookNow(court.id)}
          disabled={court.status === 'MAINTENANCE'}
          startIcon={<SportsTennis />}
          sx={{ 
            backgroundColor: '#ff6f00',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { backgroundColor: '#e65100' },
            '&:disabled': { backgroundColor: '#e0e0e0' }
          }}
        >
          Book Now
        </Button>
      </CardActions>
    </Card>
  );
};

export default CourtCard;