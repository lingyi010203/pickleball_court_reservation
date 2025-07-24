// src/components/home/QuickActions.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Card, 
  CardActionArea, 
  CardContent, 
  Typography, 
  Box, 
  useTheme 
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon,
  EmojiEvents as EventsIcon,
  Group as GroupIcon,
  AccountBalanceWallet as WalletIcon,
  Search as SearchIcon
} from '@mui/icons-material';

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
      <Card 
        sx={{ 
          borderRadius: 3,
          height: '100%',
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
          sx={{ height: '100%', p: 2 }}
          aria-label={`Go to ${action.title}`}
        >
          <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ 
              mb: 2,
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '50%',
              bgcolor: theme.palette[action.color].light,
              color: theme.palette[action.color].main
            }}>
              <action.Icon fontSize="large" />
            </Box>
            
            <Typography 
              variant="h6" 
              fontWeight="bold"
              gutterBottom
              sx={{ minHeight: '3rem' }}
            >
              {action.title}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 2, minHeight: '3rem' }}
            >
              {action.description}
            </Typography>
            
            <Typography 
              variant="button" 
              color={action.color}
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 'bold',
                '&:after': {
                  content: '"→"',
                  ml: 0.5,
                  transition: 'transform 0.2s'
                },
                '&:hover:after': {
                  transform: 'translateX(3px)'
                }
              }}
            >
              Get Started
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
};

const QuickActions = () => {
  const navigate = useNavigate();
  
  return (
    <Box component="section" sx={{ mb: 6 }}>
      <Typography 
        variant="h5" 
        component="h2"
        fontWeight="bold" 
        sx={{ mb: 3 }}
      >
        Quick Actions
      </Typography>
      
      <Grid container spacing={3}>
        {QUICK_ACTIONS.map((action) => (
          <ActionCard 
            key={action.id} 
            action={action} 
            navigate={navigate} 
          />
        ))}
      </Grid>
    </Box>
  );
};

export default React.memo(QuickActions);