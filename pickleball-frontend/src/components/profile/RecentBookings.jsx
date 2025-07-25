import React from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme
} from '@mui/material';
import { CalendarToday } from '@mui/icons-material';

const RecentBookings = () => {
  const theme = useTheme();
  // Placeholder data - replace with actual data from backend
  const bookings = [];

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexShrink: 0
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 'bold',
          fontSize: { xs: '1.1rem', lg: '1.25rem' }
        }}>
          My Bookings
        </Typography>
        <Button
          size="small"
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '0.85rem',
            minWidth: 'auto',
            px: 1
          }}
        >
          See all
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {bookings.length > 0 ? (
          <Box sx={{ 
            flex: 1,
            overflowY: 'auto'
          }}>
            {/* Render booking items */}
            {bookings.map((booking, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {/* Booking item content */}
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 2
          }}>
            <CalendarToday sx={{ 
              fontSize: { xs: 48, lg: 56 }, 
              color: theme.palette.grey[400], 
              mb: 2 
            }} />
            <Typography variant="h6" sx={{ 
              mb: 1, 
              fontWeight: 'bold',
              fontSize: { xs: '1rem', lg: '1.1rem' }
            }}>
              No booking made
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              mb: 3,
              fontSize: '0.9rem',
              lineHeight: 1.4,
              maxWidth: 250
            }}>
              Dive into the world of sports and start booking your favorite venues.
            </Typography>
            <Button
              variant="contained"
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.main,
                '&:hover': { 
                  backgroundColor: theme.palette.primary.dark 
                },
                fontWeight: 'bold',
                textTransform: 'none',
                px: 3,
                py: 1,
                fontSize: '0.9rem'
              }}
            >
              Book Now
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RecentBookings;