import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as BookingsIcon,
  SportsTennis as GamesIcon,
  Receipt as InvoicesIcon,
  Redeem as RewardsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  RateReview as FeedbackIcon,
  Language as LanguageIcon,
  AccountBalance as WalletIcon
} from '@mui/icons-material';

const ProfileNavigation = (props) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    // If you have a mobile menu that needs to close, you could add:
    // handleCloseMenu(); 
  };

  const handleViewChange = (view) => {
    props.setActiveView(view);
  };

  const handleFeedbackNavigation = () => {
    // Navigate to the feedback selection page
            navigate('/profile/my-bookings');
  };

  // Helper to check if a path is active
  const isActive = (path) => location.pathname === path;

  return (
    <Box>
      {/* ME Section */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile')}
            selected={isActive('/profile')}
            sx={isActive('/profile') ? {
              background: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { background: alpha(theme.palette.primary.main, 0.18) }
            } : {}}
          >
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="My Profile" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile/my-bookings')}
            selected={isActive('/profile/my-bookings')}
            sx={isActive('/profile/my-bookings') ? {
              background: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { background: alpha(theme.palette.primary.main, 0.18) }
            } : {}}
          >
            <ListItemIcon>
              <BookingsIcon />
            </ListItemIcon>
            <ListItemText primary="My Bookings" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile/my-games')}
            selected={isActive('/profile/my-games')}
            sx={isActive('/profile/my-games') ? {
              background: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { background: alpha(theme.palette.primary.main, 0.18) }
            } : {}}
          >
            <ListItemIcon>
              <GamesIcon />
            </ListItemIcon>
            <ListItemText primary="My Games" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile/my-invoices')}
            selected={isActive('/profile/my-invoices')}
            sx={isActive('/profile/my-invoices') ? {
              background: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { background: alpha(theme.palette.primary.main, 0.18) }
            } : {}}
          >
            <ListItemIcon>
              <InvoicesIcon />
            </ListItemIcon>
            <ListItemText primary="My Invoices" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile/rewards')}
            selected={isActive('/profile/rewards')}
            sx={isActive('/profile/rewards') ? {
              background: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { background: alpha(theme.palette.primary.main, 0.18) }
            } : {}}
          >
            <ListItemIcon>
              <RewardsIcon />
            </ListItemIcon>
            <ListItemText primary="Rewards" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile/my-feedback')}
            selected={isActive('/profile/my-feedback')}
            sx={isActive('/profile/my-feedback') ? {
              background: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { background: alpha(theme.palette.primary.main, 0.18) }
            } : {}}
          >
            <ListItemIcon>
              <FeedbackIcon />
            </ListItemIcon>
            <ListItemText primary="My Feedback" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile/wallet')}
            selected={isActive('/profile/wallet')}
            sx={isActive('/profile/wallet') ? {
              background: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { background: alpha(theme.palette.primary.main, 0.18) }
            } : {}}
          >
            <ListItemIcon>
              <WalletIcon />
            </ListItemIcon>
            <ListItemText primary="My Wallet" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 1 }} />

      {/* ACCOUNT SETTINGS Section */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile/edit-profile')}
            selected={isActive('/profile/edit-profile')}
            sx={isActive('/profile/edit-profile') ? {
              background: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { background: alpha(theme.palette.primary.main, 0.18) }
            } : {}}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Edit Profile" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile/notifications')}
            selected={isActive('/profile/notifications')}
            sx={isActive('/profile/notifications') ? {
              background: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { background: alpha(theme.palette.primary.main, 0.18) }
            } : {}}
          >
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText primary="Notification Preferences" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile/language')}
            selected={isActive('/profile/language')}
            sx={isActive('/profile/language') ? {
              background: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { background: alpha(theme.palette.primary.main, 0.18) }
            } : {}}
          >
            <ListItemIcon>
              <LanguageIcon />
            </ListItemIcon>
            <ListItemText primary="Language" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default ProfileNavigation;