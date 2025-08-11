import React from 'react';
import {
  Box,
  Typography,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import {
  SportsTennis,
  CalendarToday,
  LocalOffer,
  AccountBalanceWallet
} from '@mui/icons-material';

const ProfileStats = ({ profile }) => {
  const theme = useTheme();

  // 调试信息 - 在开发环境中显示
  console.log('ProfileStats - profile data:', profile);

  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  // 安全的数据提取函数
  const getStatValue = (profile, field, defaultValue = 0) => {
    if (!profile) return defaultValue;
    
    const value = profile[field];
    if (value === null || value === undefined) return defaultValue;
    
    // 如果是数字类型的字段，确保转换为数字
    if (typeof value === 'string' && !isNaN(value)) {
      return Number(value);
    }
    
    return value;
  };

  const stats = [
    {
      title: "Bookings Made",
      value: getStatValue(profile, 'bookingsMade', 0),
      icon: <CalendarToday fontSize="small" />,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1)
    },
    {
      title: "Booking Hours",
      value: (() => {
        const hours = Number(getStatValue(profile, 'bookingHours', 0));
        return hours % 1 === 0 ? hours.toString() : hours.toFixed(1);
      })(),
      icon: <SportsTennis fontSize="small" />,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1)
    },
   /* {
      title: "Sumos Joined",
      value: getStatValue(profile, 'sumosJoined', 0),
      icon: <LocalOffer fontSize="small" />,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1)
    },*/
    {
      title: "Amount Spent",
      value: formatCurrency(getStatValue(profile, 'amountSpent', 0)),
      icon: <AccountBalanceWallet fontSize="small" />,
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.1)
    }
  ];

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header Section */}
      <Box sx={{ 
        mb: 3,
        textAlign: { xs: 'center', md: 'left' }
      }}>
        <Typography variant="h5" sx={{
          fontWeight: 700,
          color: theme.palette.text.primary,
          mb: 0.5,
          letterSpacing: '-0.3px',
          lineHeight: 1.2,
          fontSize: { xs: '1.25rem', lg: '1.5rem' }
        }}>
          Activity Overview
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{
          fontWeight: 400,
          opacity: 0.8,
          fontSize: { xs: '0.95rem', lg: '1rem' }
        }}>
          Your pickleball journey at a glance
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2}>
        {stats.map((stat, index) => (
          <Grid item xs={6} sm={6} lg={3} key={index}>
            <Box sx={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${alpha(stat.color, 0.15)}`,
              borderRadius: 2,
              p: 2,
              height: 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: theme.shadows[1],
              transition: 'all 0.2s ease',
              overflow: 'hidden',
              '&:hover': {
                boxShadow: theme.shadows[3],
                borderColor: stat.color,
                transform: 'translateY(-2px)'
              }
            }}>
              {/* Icon and Title Row */}
              <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                mb: 1,
                gap: 1
              }}>
                <Box sx={{
                  backgroundColor: stat.color,
                  color: theme.palette.getContrastText(stat.color),
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {stat.icon}
                </Box>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  fontSize: '0.8rem',
                  lineHeight: 1.2,
                  flex: 1,
                  wordBreak: 'break-word'
                }}>
                  {stat.title}
                </Typography>
              </Box>

              {/* Value */}
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="h6" sx={{
                  fontWeight: 800,
                  color: stat.color,
                  fontSize: { xs: '1rem', sm: '1.1rem', lg: '1.2rem' },
                  lineHeight: 1.1,
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {stat.value}
                </Typography>
              </Box>

              {/* Decorative Element */}
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: 3,
                background: `linear-gradient(90deg, ${stat.color} 0%, ${alpha(stat.color, 0.2)} 100%)`
              }} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProfileStats;