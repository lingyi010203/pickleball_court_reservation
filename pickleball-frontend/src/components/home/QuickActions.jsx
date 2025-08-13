// src/components/home/QuickActions.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  CardActionArea, 
  CardContent, 
  Typography, 
  Box, 
  useTheme as useMuiTheme,
  Stack,
  Chip
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon,
  EmojiEvents as EventsIcon,
  Group as GroupIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import ThemedCard from '../common/ThemedCard';
import { useTheme } from '../../context/ThemeContext';

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
    id: 'court-availability',
    Icon: SearchIcon,
    title: 'Find Available Courts',
    description: 'Quickly search all available courts by date and time',
    path: '/court-availability',
    color: 'info'
  },
  { 
    id: 'find-partners',
    Icon: GroupIcon, 
    title: 'Find Partners', 
    description: 'Connect with other players',
    path: '/messages',
    color: 'success'
  },
];

const ActionCard = ({ action, navigate, totalCards }) => {
  const muiTheme = useMuiTheme();
  const { getPrimaryColor, getPrimaryDarkColor, getPrimaryLightColor } = useTheme();
  
  // Calculate responsive grid sizes based on total number of cards
  const getGridSize = () => {
    if (totalCards <= 2) {
      return { xs: 12, sm: 6, md: 6 }; // 2 cards per row on medium+ screens
    } else if (totalCards === 3) {
      return { xs: 12, sm: 6, md: 4 }; // 3 cards per row on medium+ screens
    } else if (totalCards === 4) {
      return { xs: 12, sm: 6, md: 3 }; // 4 cards per row on medium+ screens
    } else {
      return { xs: 12, sm: 6, md: 3 }; // Default: 4 cards per row
    }
  };
  
  const gridSize = getGridSize();
  
  return (
    <Grid item xs={gridSize.xs} sm={gridSize.sm} md={gridSize.md}>
      <ThemedCard
        sx={{
          borderRadius: 4,
          height: 250,
          width: 250,
          mx: 'auto',
          background: muiTheme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          border: `1px solid ${muiTheme.palette.divider}`,
          transition: muiTheme.transitions.create(['transform', 'box-shadow', 'border-color'], {
            duration: muiTheme.transitions.duration.standard,
          }),
          '&:hover': {
            boxShadow: muiTheme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)'
              : '0 8px 32px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.05)',
            transform: 'translateY(-6px)',
            borderColor: getPrimaryColor(),
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
            p: 2,
            '&:last-child': { pb: 2 }
          }}>
            <Box sx={{
              mb: 2,
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${getPrimaryColor()}15 0%, ${getPrimaryColor()}25 100%)`,
              color: getPrimaryColor(),
              border: `2px solid ${getPrimaryColor()}30`,
              alignSelf: 'center',
              transition: muiTheme.transitions.create(['transform', 'background'], {
                duration: muiTheme.transitions.duration.short,
              }),
              '&:hover': {
                transform: 'scale(1.1)',
                background: `linear-gradient(135deg, ${getPrimaryColor()}25 0%, ${getPrimaryColor()}35 100%)`,
              }
            }}>
              <action.Icon sx={{ fontSize: '2rem' }} />
            </Box>
            <Typography
              variant="h6"
              fontWeight="700"
              gutterBottom
              sx={{ 
                minHeight: '2.4rem',
                fontSize: '1.1rem',
                lineHeight: 1.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: muiTheme.palette.text.primary,
                mb: 1
              }}
            >
              {action.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ 
                minHeight: '2.8rem',
                fontSize: '0.9rem',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                opacity: 0.8
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
  const { getPrimaryColor, getPrimaryDarkColor } = useTheme();
  
  return (
    <Box component="section" sx={{ mb: 6, maxWidth: 1200, mx: 'auto', width: '100%' }}>
      <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 2, color: 'black' }}>
        Quick Actions
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {QUICK_ACTIONS.map((action) => (
          <ActionCard 
            key={action.id} 
            action={action} 
            navigate={navigate} 
            totalCards={QUICK_ACTIONS.length}
          />
        ))}
      </Grid>
    </Box>
  );
};

export default React.memo(QuickActions);