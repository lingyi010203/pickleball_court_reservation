import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Container,
  Divider,
  useMediaQuery,
  IconButton,
  Skeleton,
  useTheme
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
  Help as HelpIcon,
  People as PeopleIcon,
  Assignment as BookingIcon,
  Event as EventIcon,
  Create as CreateEventIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MobileDrawer from './MobileDrawer';
import ProfileMenu from './ProfileMenu';
import { THEME } from '../../constants';

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
  const theme = useTheme();

  const username = currentUser?.username || '';
  const role = currentUser?.role || '';
  const isLoggedIn = isAuthenticated();

  const getUsernameInitial = () => {
    return username ? username.charAt(0).toUpperCase() : '';
  };

  useEffect(() => {
    const path = location.pathname;
    setIsAdminRoute(path.startsWith('/admin'));

    if (path === '/') setActiveTab('home');
    else if (path === '/courts' || path.startsWith('/courts/')) setActiveTab('courts');
    else if (path === '/book' || path.startsWith('/book/')) setActiveTab('book');
    else if (path === '/events' || path.startsWith('/events/')) setActiveTab('events');
    else if (path === '/deals' || path.startsWith('/deals/')) setActiveTab('deals');
    else if (path === '/admin' || path.startsWith('/admin/')) setActiveTab('admin');
    else if (path === '/profile' || path.startsWith('/profile/')) setActiveTab('');
    else if (path === '/messages' || path.startsWith('/messages/')) setActiveTab('messages');
    else if (path === '/helpdesk' || path.startsWith('/helpdesk/')) setActiveTab('helpdesk');
  }, [location]);

  useEffect(() => {
    const handleProfileImageChange = (event) => {
      setProfileImage(event.detail?.profileImage || null);
    };
    window.addEventListener('profileImageChanged', handleProfileImageChange);
    return () => {
      window.removeEventListener('profileImageChanged', handleProfileImageChange);
    };
  }, []);

  useEffect(() => {
    setProfileImage(currentUser?.profileImage || null);
  }, [currentUser]);

  useEffect(() => {
    handleCloseMenu();
    setMobileOpen(false);
  }, [location]);

  const navigateTo = useCallback((path, id) => {
    navigate(path);
    setActiveTab(id);
    setMobileOpen(false);
  }, [navigate]);

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
    handleCloseMenu();
  }, [logout, navigate]);

  const handleOpenMenu = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);


  const navItems = useMemo(() => {
    const baseItems = [
      { id: 'home', label: 'Home', icon: <HomeIcon />, path: '/' },
      { id: 'book', label: 'Book', icon: <BookIcon />, path: '/book' },
      { id: 'events', label: 'Events', icon: <EventIcon />, path: '/events' },
      { id: 'friendly-match', label: 'Friendly Match', icon: <Group />, path: '/friendly-match' },
      { id: 'courts', label: 'Courts', icon: <CourtsIcon />, path: '/courts' },
      { id: 'deals', label: 'Deals', icon: <DealsIcon />, path: '/deals' },
      { id: 'helpdesk', label: 'Help', icon: <HelpIcon />, path: '/helpdesk' },
    ];
    let items = [...baseItems];
    if (isLoggedIn && (role === 'EventOrganizer' || currentUser?.userType === 'EventOrganizer')) {
      items.splice(3, 0, {
        id: 'create-event',
        label: 'Create Event',
        icon: <CreateEventIcon />,
        path: '/events/create'
      });
    }
    if (isLoggedIn && role !== 'ADMIN') {
      items.push({ id: 'messages', label: 'Messages', icon: <MailIcon />, path: '/messages' });
    }
    if (isLoggedIn && role === 'ADMIN') {
      items.push({ id: 'admin', label: 'Manage Requests', icon: <ManageRequestsIcon />, path: '/admin' });
    }
    return items;
  }, [isLoggedIn, role, currentUser]);

  const adminNavItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { id: 'users', label: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
    { id: 'bookings', label: 'Bookings', icon: <BookingIcon />, path: '/admin/bookings' },
    { id: 'courts-admin', label: 'Courts', icon: <CourtsIcon />, path: '/admin/courts' },
  ], []);

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
              ? (isAdminRoute ? THEME.colors.adminPrimary : THEME.colors.primary)
              : 'text.primary',
            fontWeight: activeTab === item.id ? 'bold' : 'normal',
            position: 'relative',
            transition: 'color 0.2s ease, font-weight 0.2s ease',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: '-10px',
              left: 0,
              right: 0,
              height: activeTab === item.id ? '3px' : 0,
              borderRadius: '3px', // 添加圆角
              backgroundColor: isAdminRoute ? THEME.colors.adminPrimary : THEME.colors.primary,
              transform: activeTab === item.id ? 'scaleX(1)' : 'scaleX(0.8)', // 缩放动画
              transition: 'height 0.3s ease, transform 0.3s ease',
            },
            '&:hover': {
              color: isAdminRoute ? THEME.colors.adminPrimary : THEME.colors.primary,
              backgroundColor: 'transparent',
              '&:after': {
                height: '2px',
                backgroundColor: isAdminRoute ? THEME.colors.adminPrimary : THEME.colors.primary
              }
            }
          }}
        >
          {item.label}
        </Button>
      ))}
    </>
  );

  if (location.pathname.startsWith('/admin/login')) {
    return null;
  }

  const {
    gradients: { admin, primary: primaryGradient },
    colors: { adminPrimary, primary, primaryHover }
  } = THEME;

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

  return (
    <AppBar
      position="fixed"
      elevation={2}
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[2],
        borderBottom: theme.palette.mode === 'dark' ? '1px solid #23262F' : '1px solid #e0e0e0',
        transition: 'background-color 0.3s, color 0.3s',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: '1200px', width: '100%', mx: 'auto', px: { xs: 1, sm: 2, lg: 3 } }}>
        <Toolbar sx={{
          justifyContent: 'space-between',
          py: { xs: 1, sm: 1.5 }, // 响应式垂直间距
          px: { xs: 1, sm: 0 }    // 响应式水平间距
        }}>
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
                  background: isAdminRoute ? admin : primaryGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: 1.5,
                  fontFamily: '"Roboto Condensed", sans-serif'
                }}
              >
                {isAdminRoute ? 'ADMIN PORTAL' : 'Picklefy'}
              </Typography>
            </Box>
          </Box>

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
                      onClick={() => navigate('/register')}
                      sx={{
                        mx: 1,
                        backgroundColor: primary,
                        '&:hover': { backgroundColor: primaryHover }
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
                      backgroundColor: primary,
                      '&:hover': { backgroundColor: primaryHover }
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
                  transition: 'background-color 0.3s ease',
                  '&:active': {
                    transform: 'scale(0.95)',
                    transition: 'transform 0.1s ease'
                  }
                }}
                role="button"
                aria-label="User menu"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleOpenMenu(e)}
              >
                {profileImage === undefined ? (
                  <Skeleton variant="circular" width={40} height={40} />
                ) : (
                  <Avatar
                    src={profileImage ? `http://localhost:8081/uploads/${profileImage}?ts=${Date.now()}` : null}
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = null;
                    }}
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
                )}
                {!isMobile && (
                  <Typography variant="body1" sx={{ fontWeight: 500, ml: 1 }}>
                    {username ? `Hi, ${username}` : 'Profile'}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Toolbar>

        <Divider sx={{ backgroundColor: '#e0e0e0', mb: 1 }} />

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

      {isMobile && (
        <MobileDrawer
          isAdminRoute={isAdminRoute}
          navItems={navItems}
          adminNavItems={adminNavItems}
          activeTab={activeTab}
          navigateTo={navigateTo}
          isLoggedIn={isLoggedIn}
          profileImage={profileImage}
          username={username}
          getUsernameInitial={getUsernameInitial}
          handleLogout={handleLogout}
          navigate={navigate}
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
        />
      )}

      <ProfileMenu
        anchorEl={anchorEl}
        handleCloseMenu={handleCloseMenu}
        profileImage={profileImage}
        isAdminRoute={isAdminRoute}
        getUsernameInitial={getUsernameInitial}
        navigate={navigate}
        role={role}
        handleLogout={handleLogout}
        API_URL={API_URL}
      />
    </AppBar>
  );
}

export default Navbar;