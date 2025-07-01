import React from 'react';
import {
  Box,
  Typography,
  Grid,
  useTheme
} from '@mui/material';
import {
  SportsTennis,
  CalendarToday,
  LocalOffer,
  AccountBalanceWallet
} from '@mui/icons-material';
import StatCard from '../common/StatCard';

const ProfileStats = ({ profile }) => {
  const theme = useTheme();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const stats = [
    {
      title: "Bookings Made",
      value: profile.bookingsMade,
      icon: <CalendarToday fontSize="small" />,
      color: theme.palette.primary.main
    },
    {
      title: "Booking Hours",
      value: profile.bookingHours.toFixed(1),
      icon: <SportsTennis fontSize="small" />,
      color: theme.palette.success.main
    },
    {
      title: "Sumos Joined",
      value: profile.sumosJoined,
      icon: <LocalOffer fontSize="small" />,
      color: theme.palette.error.main
    },
    {
      title: "Amount Spent",
      value: formatCurrency(profile.amountSpent),
      icon: <AccountBalanceWallet fontSize="small" />,
      color: theme.palette.secondary.main
    }
  ];

  return (
    <Box sx={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      p: 2,
      mb: 2,
      width: 'auto',
      minHeight: { xs: 460, sm: 320, md: 280 },
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ flexShrink: 0, textAlign: 'left' }}>
        <Typography variant="h5" sx={{
          fontWeight: 'bold',
          color: 'text.primary',
          mb: 1
        }}>
          Activity Overview
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{
          fontWeight: 400,
          fontSize: '1.1rem'
        }}>
          Your pickleball journey at a glance
        </Typography>
      </Box>

      <Box sx={{ flex: 1, mt: 3, overflowY: 'auto' }}>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default ProfileStats;