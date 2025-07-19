import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box
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
  Language as LanguageIcon
} from '@mui/icons-material';

const ProfileNavigation = ({ setActiveView }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    // If you have a mobile menu that needs to close, you could add:
    // handleCloseMenu(); 
  };

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const handleFeedbackNavigation = () => {
    // Navigate to the feedback selection page
            navigate('/profile/my-bookings');
  };

  return (
    <Box>
      {/* ME Section */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/profile/my-profile')}>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="My Profile" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/profile/my-bookings')}>
            <ListItemIcon>
              <BookingsIcon />
            </ListItemIcon>
            <ListItemText primary="My Bookings" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/profile/my-games')}>
            <ListItemIcon>
              <GamesIcon />
            </ListItemIcon>
            <ListItemText primary="My Games" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/profile/my-invoices')}>
            <ListItemIcon>
              <InvoicesIcon />
            </ListItemIcon>
            <ListItemText primary="My Invoices" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/profile/rewards')}>
            <ListItemIcon>
              <RewardsIcon />
            </ListItemIcon>
            <ListItemText primary="Rewards" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/profile/my-feedback')}>
            <ListItemIcon>
              <FeedbackIcon />
            </ListItemIcon>
            <ListItemText primary="My Feedback" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 1 }} />

      {/* ACCOUNT SETTINGS Section */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleViewChange('/profile/edit-profile')}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Edit Profile" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/profile/notifications')}>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText primary="Notification Preferences" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/profile/language')}>
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