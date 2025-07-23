import React, { useCallback } from 'react';
import { 
  Box, Typography, Divider, List, ListItem, ListItemIcon, 
  ListItemText, Button, Avatar, Drawer 
} from '@mui/material';
import { ExitToApp as LogoutIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { THEME } from '../../constants';

const MobileDrawer = ({
  isAdminRoute,
  navItems,
  adminNavItems,
  activeTab,
  navigateTo,
  isLoggedIn,
  profileImage,
  username,
  getUsernameInitial,
  handleLogout,
  navigate,
  mobileOpen,
  handleDrawerToggle
}) => {
  const handleItemClick = useCallback((path, id) => {
    navigateTo(path, id);
    handleDrawerToggle();
  }, [navigateTo, handleDrawerToggle]);

  const { 
    gradients: { admin, primary: primaryGradient },
    colors: { adminPrimary, primary, primaryHover, logout, logoutHover, text } 
  } = THEME;

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 } }}
    >
      <Box sx={{ width: 250, py: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              background: isAdminRoute 
                ? THEME.gradients.admin 
                : THEME.gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: '"Roboto Condensed", sans-serif'
            }}
          >
            {isAdminRoute ? 'ADMIN PORTAL' : 'PICKLEBALL'}
          </Typography>
        </Box>
        <Divider />
        <List>
          {(isAdminRoute ? adminNavItems : navItems).map((item) => (
            <ListItem 
              key={item.id}
              onClick={() => handleItemClick(item.path, item.id)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleItemClick(item.path, item.id); }}
              tabIndex={0}
              sx={{
                py: 1.5,
                color: activeTab === item.id 
                  ? (isAdminRoute ? THEME.colors.adminPrimary : THEME.colors.primary) 
                  : THEME.colors.text,
                fontWeight: activeTab === item.id ? 'bold' : 'normal',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
        <Divider />
        {isLoggedIn ? (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={profileImage ? `${process.env.REACT_APP_API_URL}/uploads/${profileImage}?ts=${Date.now()}` : null}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: isAdminRoute ? adminPrimary : primary,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  mr: 2
                }}
              >
                {!profileImage && getUsernameInitial()}
              </Avatar>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {username ? `Hi, ${username}` : 'Profile'}
              </Typography>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                borderColor: logout,
                color: logout,
                '&:hover': {
                  backgroundColor: '#fdeded',
                  borderColor: logoutHover
                }
              }}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/login')}
              sx={{
                borderColor: primary,
                color: primary,
                '&:hover': {
                  backgroundColor: '#f5eef8',
                  borderColor: primaryHover
                }
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: primary,
                '&:hover': { backgroundColor: primaryHover }
              }}
            >
              Register
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/admin/login')}
              sx={{
                backgroundColor: primary,
                '&:hover': { backgroundColor: primaryHover }
              }}
            >
              Admin Login
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

MobileDrawer.propTypes = {
  isAdminRoute: PropTypes.bool.isRequired,
  navItems: PropTypes.array.isRequired,
  adminNavItems: PropTypes.array.isRequired,
  activeTab: PropTypes.string,
  navigateTo: PropTypes.func.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  profileImage: PropTypes.string,
  username: PropTypes.string,
  getUsernameInitial: PropTypes.func.isRequired,
  handleLogout: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  mobileOpen: PropTypes.bool.isRequired,
  handleDrawerToggle: PropTypes.func.isRequired
};

export default MobileDrawer;