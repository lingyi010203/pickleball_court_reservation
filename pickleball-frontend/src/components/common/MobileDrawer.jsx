import React, { useCallback } from 'react';
import { 
  Box, Typography, Divider, List, ListItem, ListItemIcon, 
  ListItemText, Button, Avatar, Drawer, Tooltip
} from '@mui/material';
import { ExitToApp as LogoutIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material';

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
  const theme = useTheme();
  const handleItemClick = useCallback((path, id) => {
    // 检查是否是私有页面（需要登录）
    const isPrivateItem = ['book', 'deals', 'helpdesk', 'messages', 'create-event', 'admin', 'coaching'].includes(id);
    
    if (!isLoggedIn && isPrivateItem) {
      // 未登录用户点击私有页面时重定向到登录页面
      navigate('/login');
    } else {
      navigateTo(path, id);
    }
    handleDrawerToggle();
  }, [navigateTo, handleDrawerToggle, isLoggedIn, navigate]);

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
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
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
          {(isAdminRoute ? adminNavItems : navItems).map((item) => {
            // 检查是否是私有页面（需要登录）
            const isPrivateItem = ['book', 'deals', 'helpdesk', 'messages', 'create-event', 'admin', 'coaching'].includes(item.id);
            
            const listItem = (
              <ListItem 
                key={item.id}
                onClick={() => handleItemClick(item.path, item.id)}
                onKeyPress={(e) => { if (e.key === 'Enter') handleItemClick(item.path, item.id); }}
                tabIndex={0}
                sx={{
                  py: 1.5,
                  color: activeTab === item.id 
                    ? theme.palette.primary.main
                    : theme.palette.text.primary,
                  fontWeight: activeTab === item.id ? 'bold' : 'normal',
                  cursor: !isLoggedIn && isPrivateItem ? 'not-allowed' : 'pointer',
                  opacity: !isLoggedIn && isPrivateItem ? 0.6 : 1,
                  '&:hover': {
                    backgroundColor: !isLoggedIn && isPrivateItem ? 'transparent' : theme.palette.action.hover
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            );

            // 为未登录用户显示工具提示
            if (!isLoggedIn && isPrivateItem) {
              return (
                <Tooltip 
                  key={item.id}
                  title="Login to access this feature" 
                  arrow
                  placement="right"
                >
                  {listItem}
                </Tooltip>
              );
            }

            return listItem;
          })}
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
                  bgcolor: theme.palette.primary.main,
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
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: theme.palette.error.light + '20',
                  borderColor: theme.palette.error.dark
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
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.light + '20',
                  borderColor: theme.palette.primary.dark
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
                backgroundColor: theme.palette.primary.main,
                '&:hover': { backgroundColor: theme.palette.primary.dark }
              }}
            >
              Register
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