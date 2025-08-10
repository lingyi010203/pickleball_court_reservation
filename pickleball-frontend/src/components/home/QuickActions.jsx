// src/components/home/QuickActions.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  CardActionArea, 
  CardContent, 
  Typography, 
  Box, 
  useTheme,
  Stack,
  Chip
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon,
  EmojiEvents as EventsIcon,
  Group as GroupIcon,
  AccountBalanceWallet as WalletIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import ThemedCard from '../common/ThemedCard';

const QUICK_ACTIONS = [
  { 
    id: 'book-court',
    Icon: CalendarIcon, 
    title: 'Book a Court', 
    description: 'Reserve your favorite court instantly', 
    path: '/courts',
    color: 'primary'
  },
  { 
    id: 'join-events',
    Icon: EventsIcon, 
    title: 'Join Events', 
    description: 'Participate in tournaments and training', 
    path: '/events',
    color: 'warning'
  },
  { 
    id: 'find-partners',
    Icon: GroupIcon, 
    title: 'Find Partners', 
    description: 'Connect with other players', 
    path: '/messages',
    color: 'success'
  },
  { 
    id: 'topup-wallet',
    Icon: WalletIcon, 
    title: 'Top Up Wallet', 
    description: 'Add funds to your account', 
    path: '/wallet/topup',
    color: 'secondary'
  },
  {
    id: 'court-availability',
    Icon: SearchIcon,
    title: 'Find Available Courts',
    description: 'Quickly search all available courts by date and time',
    path: '/court-availability',
    color: 'info'
  },
];

const ActionCard = ({ action, navigate }) => {
  const theme = useTheme();
  return (
    <Grid item xs={12} sm={6} md={3}>
      <ThemedCard
        sx={{
          borderRadius: 3,
          height: 200,
          width: '100%',
          transition: theme.transitions.create(['transform', 'box-shadow'], {
            duration: theme.transitions.duration.short,
          }),
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-4px)'
          }
        }}
      >
        <CardActionArea
          onClick={() => navigate(action.path)}
          sx={{ height: '100%', p: 2.5, display: 'flex', flexDirection: 'column' }}
          aria-label={`Go to ${action.title}`}
        >
          <CardContent sx={{ 
            textAlign: 'center', 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 1,
            '&:last-child': { pb: 1 }
          }}>
            <Box sx={{
              mb: 1.5,
              display: 'inline-flex',
              p: 1.25,
              borderRadius: '16px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: theme.palette[action.color]?.main || theme.palette.text.primary,
              border: `1px solid ${theme.palette.divider}`,
              alignSelf: 'center'
            }}>
              <action.Icon fontSize="large" />
            </Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              gutterBottom
              sx={{ 
                minHeight: '2.2rem',
                fontSize: '1.05rem',
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {action.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ 
                minHeight: '2.2rem',
                fontSize: '0.875rem',
                lineHeight: 1.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              {action.description}
            </Typography>
          </CardContent>
        </CardActionArea>
      </ThemedCard>
    </Grid>
  );
};

const QuickActions = () => {
  const navigate = useNavigate();
  
  return (
    <Box component="section" sx={{ mb: 6, maxWidth: 1200, mx: 'auto', width: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" component="h2" fontWeight="bold">
          Quick Actions
        </Typography>
        <Chip label="Shortcut" size="small" color="primary" variant="outlined" />
      </Stack>

      <Grid container spacing={2.5}>
        {QUICK_ACTIONS.map((action) => (
          <ActionCard key={action.id} action={action} navigate={navigate} />
        ))}
      </Grid>
    </Box>
  );
};

export default React.memo(QuickActions);