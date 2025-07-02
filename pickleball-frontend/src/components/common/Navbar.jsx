import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Divider,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  SportsTennis as CourtsIcon,
  CalendarToday as BookIcon,
  Home as HomeIcon,
  LocalOffer as DealsIcon,
  ExitToApp as LogoutIcon,
  Group as ManageRequestsIcon,
  Group,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  Mail as MailIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';



function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:900px)');

  const username = currentUser?.username || '';
  const role = currentUser?.role || '';
  const isLoggedIn = isAuthenticated();

  const getUsernameInitial = () => {
    return username ? username.charAt(0).toUpperCase() : '';
  };

  useEffect(() => {
    // Check if current route is admin route
    setIsAdminRoute(location.pathname.startsWith('/admin'));
    // Set active tab based on current route
    if (location.pathname === '/') setActiveTab('home');
    else if (location.pathname.startsWith('/courts')) setActiveTab('courts');
    else if (location.pathname.startsWith('/book')) setActiveTab('book');
	else if (location.pathname.startsWith('/events')) setActiveTab('events');
    else if (location.pathname.startsWith('/deals')) setActiveTab('deals');
    else if (location.pathname.startsWith('/admin')) setActiveTab('admin');
    else if (location.pathname.startsWith('/profile')) setActiveTab('');
    else if (location.pathname.startsWith('/messages')) setActiveTab('messages');
    else if (location.pathname.startsWith('/helpdesk')) setActiveTab('helpdesk');
  }, [location]);

  useEffect(() => {
    // Listen for profile image changes
    const handleProfileImageChange = (event) => {
      setProfileImage(event.detail?.profileImage || null);
    };
    window.addEventListener('profileImageChanged', handleProfileImageChange);
    return () => {
      window.removeEventListener('profileImageChanged', handleProfileImageChange);
    };
  }, []);

  useEffect(() => {
    // Initialize profile image
    setProfileImage(currentUser?.profileImage || null);
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleCloseMenu();
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const navigateTo = (path, id) => {
    navigate(path);
    setActiveTab(id);
    setMobileOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Navigation items data
  const navItems = [
    { id: 'home', label: 'Home', icon: <HomeIcon />, path: '/' },
    { id: 'book', label: 'Book', icon: <BookIcon />, path: '/book' },
    { id: 'events', label: 'Events', icon: <BookIcon />, path: '/events' },
    { id: 'friendly-match', label: 'Friendly Match', icon: <Group />, path: '/friendly-match' },
    { id: 'courts', label: 'Courts', icon: <CourtsIcon />, path: '/courts' },
    { id: 'deals', label: 'Deals', icon: <DealsIcon />, path: '/deals' },
    { id: 'helpdesk', label: 'Help', icon: <HelpIcon />, path: '/helpdesk' },
  ];

  // Add Create Event button for Event Organizers
  if (isLoggedIn && (role === 'EventOrganizer' || currentUser?.userType === 'EventOrganizer')) {
    navItems.splice(3, 0, {
      id: 'create-event',
      label: 'Create Event',
      icon: <BookIcon />, // You can use a different icon if you want
      path: '/events/create'
    });
  }

  // Add Messages button for logged-in non-admin users
  if (isLoggedIn && role !== 'ADMIN') {
    navItems.push({
      id: 'messages',
      label: 'Messages',
      icon: <MailIcon />,
      path: '/messages'
    });
  }

  // Add Manage Requests tab for admin users
  if (isLoggedIn && role === 'ADMIN') {
    navItems.push({
      id: 'admin',
      label: 'Manage Requests',
      icon: <ManageRequestsIcon />,
      path: '/admin'
    });
  }

  // Admin-specific navigation items
  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { id: 'users', label: 'Users', icon: <ManageRequestsIcon />, path: '/admin/users' },
    { id: 'bookings', label: 'Bookings', icon: <BookIcon />, path: '/admin/bookings' },
    { id: 'courts-admin', label: 'Courts', icon: <CourtsIcon />, path: '/admin/courts' },
  ];

  // Render navigation items
  const renderNavItems = (items) => (
    <>
      {items.map((item) => (
        <Button
          key={item.id}
          startIcon={!isMobile && item.icon}
          onClick={() => navigateTo(item.path, item.id)}
          sx={{
            mx: 1,
            px: 2,
            color: activeTab === item.id 
              ? (isAdminRoute ? '#667eea' : '#8e44ad') 
              : 'text.primary',
            fontWeight: activeTab === item.id ? 'bold' : 'normal',
            position: 'relative',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: '-10px',
              left: 0,
              right: 0,
              height: activeTab === item.id ? '3px' : 0,
              backgroundColor: isAdminRoute ? '#667eea' : '#8e44ad',
              transition: 'height 0.3s ease',
            },
            '&:hover': {
              backgroundColor: 'transparent',
              '&:after': {
                height: '2px',
                backgroundColor: isAdminRoute ? '#667eea' : '#8e44ad'
              }
            }
          }}
        >
          {item.label}
        </Button>
      ))}
    </>
  );

  // Drawer content for mobile
  const drawer = (
    <Box sx={{ width: 250, py: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            background: isAdminRoute 
              ? 'linear-gradient(45deg, #667eea, #764ba2)' 
              : 'linear-gradient(45deg, #8e44ad, #3498db)',
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
            button 
            key={item.id}
            onClick={() => navigateTo(item.path, item.id)}
            sx={{
              py: 1.5,
              color: activeTab === item.id 
                ? (isAdminRoute ? '#667eea' : '#8e44ad') 
                : 'text.primary',
              fontWeight: activeTab === item.id ? 'bold' : 'normal',
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
              src={profileImage ? `http://localhost:8081/uploads/${profileImage}?ts=${Date.now()}` : null}
              sx={{
                width: 40,
                height: 40,
                bgcolor: isAdminRoute ? '#667eea' : '#8e44ad',
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
              borderColor: '#e74c3c',
              color: '#e74c3c',
              '&:hover': {
                backgroundColor: '#fdeded',
                borderColor: '#c0392b'
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
              borderColor: '#8e44ad',
              color: '#8e44ad',
              '&:hover': {
                backgroundColor: '#f5eef8',
                borderColor: '#732d91'
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
              backgroundColor: '#8e44ad',
              '&:hover': { backgroundColor: '#732d91' }
            }}
          >
            Register
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/admin/login')}
            sx={{
              backgroundColor: '#8e44ad', // Purple color
              '&:hover': { backgroundColor: '#732d91' }
            }}
          >
            Admin Login
          </Button>
        </Box>
      )}
    </Box>
  );

  // Don't show navbar on admin login pages
  if (location.pathname.startsWith('/admin/login')) {
    return null;
  }

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: 'white',
        color: 'black',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        py: 0
      }}
    >
      <Container maxWidth="xl">
        {/* Top row - Logo and Auth */}
        <Toolbar sx={{
          justifyContent: 'space-between',
          py: 1,
          px: 0
        }}>
          {/* Left side - Logo and Mobile Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box
              onClick={() => navigateTo(isAdminRoute ? '/admin/dashboard' : '/', 'home')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{
                  fontWeight: 'bold',
                  background: isAdminRoute 
                    ? 'linear-gradient(45deg, #667eea, #764ba2)' 
                    : 'linear-gradient(45deg, #8e44ad, #3498db)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: 1.5,
                  fontFamily: '"Roboto Condensed", sans-serif'
                }}
              >
                {isAdminRoute ? 'ADMIN PORTAL' : 'PICKLEBALL'}
              </Typography>
            </Box>
          </Box>

          {/* Right side - Auth/User */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!isLoggedIn ? (
              <>
                {!isMobile && !isAdminRoute && (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/login')}
                      sx={{
                        mx: 1,
                        borderColor: '#8e44ad',
                        color: '#8e44ad',
                        '&:hover': {
                          backgroundColor: '#f5eef8',
                          borderColor: '#732d91'
                        }
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/register')}
                      sx={{
                        mx: 1,
                        backgroundColor: '#8e44ad',
                        '&:hover': { backgroundColor: '#732d91' }
                      }}
                    >
                      Register
                    </Button>
                  </>
                )}
                {!isMobile && (
                  <Button
                    variant="contained"
                    onClick={() => navigate('/admin/login')}
                    sx={{
                      mx: 1,
                      backgroundColor: '#8e44ad', // Purple color
                      '&:hover': { backgroundColor: '#732d91' }
                    }}
                  >
                    Admin Login
                  </Button>
                )}
              </>
            ) : (
              <Box
                onClick={handleOpenMenu}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  },
                  p: 1,
                  transition: 'background-color 0.3s ease'
                }}
              >
                <Avatar
                  src={profileImage ? `http://localhost:8081/uploads/${profileImage}?ts=${Date.now()}` : null}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: isAdminRoute ? '#667eea' : '#8e44ad',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}
                >
                  {!profileImage && getUsernameInitial()}
                </Avatar>
                {!isMobile && (
                  <Typography variant="body1" sx={{ fontWeight: 500, ml: 1 }}>
                    {username ? `Hi, ${username}` : 'Profile'}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Toolbar>

        {/* Divider between logo and navigation */}
        <Divider sx={{ backgroundColor: '#e0e0e0', mb: 1 }} />

        {/* Bottom row - Navigation Items (Desktop) */}
        {!isMobile && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'left',
            py: 1,
            position: 'relative'
          }}>
            {renderNavItems(isAdminRoute ? adminNavItems : navItems)}
          </Box>
        )}
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            minWidth: 220,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => { navigate('/profile'); handleCloseMenu(); }}
          sx={{ py: 1.5 }}
        >
          <Avatar
            src={profileImage ? `http://localhost:8081/uploads/${profileImage}?ts=${Date.now()}` : null}
            sx={{
              width: 40,
              height: 40,
              bgcolor: isAdminRoute ? '#667eea' : '#8e44ad',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              mr: 2
            }}
          >
            {!profileImage && getUsernameInitial()}
          </Avatar>
          My Profile
        </MenuItem>
        <MenuItem
          onClick={() => { navigate('/helpdesk'); handleCloseMenu(); }}
          sx={{ py: 1.5 }}
        >
          <HelpIcon sx={{ mr: 1.5, color: '#667eea' }} />
          Help & Support
        </MenuItem>
        {(role === 'ADMIN' || isAdminRoute) && (
          <MenuItem
            onClick={() => { navigate('/admin'); handleCloseMenu(); }}
            sx={{ py: 1.5 }}
          >
            <Avatar
              sx={{
                bgcolor: isAdminRoute ? '#764ba2' : '#3498db',
                width: 24,
                height: 24,
                mr: 1.5,
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              A
            </Avatar>
            Admin Dashboard
          </MenuItem>
        )}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={handleLogout}
          sx={{ py: 1.5, color: '#e74c3c' }}
        >
          <LogoutIcon sx={{ mr: 1.5, color: '#e74c3c' }} />
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
}

export default Navbar;