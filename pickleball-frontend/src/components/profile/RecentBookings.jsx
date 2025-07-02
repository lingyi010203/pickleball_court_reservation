import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider
} from '@mui/material';
import { CalendarToday } from '@mui/icons-material';

const RecentBookings = () => {
  // Placeholder data - replace with actual data from backend
  const bookings = [];

  return (
    <Card sx={{
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      backgroundColor: 'white',
      p: 1,
      height: '100%' // Ensure consistent height
    }}>
      
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            My Bookings
          </Typography>
          <Button
            size="small"
            sx={{
              color: '#8e44ad',
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '0.875rem'
            }}
          >
            See all
          </Button>
        </Box>

        {bookings.length > 0 ? (
          <Box>
            {/* Render booking items */}
          </Box>
        ) : (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            textAlign: 'center',
            p: 3
          }}>
            <CalendarToday sx={{ fontSize: 60, color: '#bdc3c7', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
              No booking made
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Dive into the world of sports and start booking your favorite venues.
            </Typography>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#8e44ad',
                '&:hover': { backgroundColor: '#732d91' },
                fontWeight: 'bold',
                textTransform: 'none',
                px: 3,
                py: 1
              }}
            >
              Book Now
            </Button>
          </Box>
        )}

    </Card>
  );
};

export default RecentBookings;