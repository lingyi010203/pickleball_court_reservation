import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppBar,
  Badge,
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
  useTheme,
  Tooltip,
  alpha
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
import { useTheme as useCustomTheme } from '../../context/ThemeContext';
import MobileDrawer from './MobileDrawer';
import ProfileMenu from './ProfileMenu';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const isMobile = useMediaQuery('(max-width:900px)');
  const theme = useTheme();
  const customTheme = useCustomTheme();

  const username = currentUser?.username || '';
  const role = currentUser?.role || '';
  const isLoggedIn = isAuthenticated();

  const getUsernameInitial = () => {
    return username ? username.charAt(0).toUpperCase() : '';
  };

  // 獲取未讀訊息數量
  const fetchUnreadMessages = async () => {
    if (!isLoggedIn) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/messages/previews', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.reduce((total, preview) => total + (preview.unreadCount || 0), 0);
        setUnreadMessages(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
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
    else if (path === '/friendly-matches' || path.startsWith('/friendly-matches/')) setActiveTab('friendly-matches');
    else if (path === '/coaching' || path.startsWith('/coaching/')) setActiveTab('coaching');
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

  // Fetch unread messages when user is logged in
  useEffect(() => {
    fetchUnreadMessages();
    
    // Set up interval to refresh unread messages every 30 seconds
    const interval = setInterval(fetchUnreadMessages, 30000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    handleCloseMenu();
    setMobileOpen(false);
  }, [location]);

  const navigateTo = useCallback((path, id) => {
    // 检查是否是私有页面（需要登录）
    const isPrivateItem = ['messages', 'create-event', 'admin', 'coaching'].includes(id);
    
    if (!isLoggedIn && isPrivateItem) {
      // 未登录用户点击私有页面时重定向到登录页面
      navigate('/login');
    } else {
      navigate(path);
      setActiveTab(id);
    }
    setMobileOpen(false);
  }, [navigate, isLoggedIn]);

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
    // 未登录用户可以访问的页面
    const publicItems = [
      { id: 'home', label: 'Home', icon: <HomeIcon />, path: '/' },
      { id: 'courts', label: 'Courts', icon: <CourtsIcon />, path: '/courts' },
      { id: 'events', label: 'Events', icon: <EventIcon />, path: '/events' },
      { id: 'friendly-matches', label: 'Friendly Match', icon: <Group />, path: '/friendly-matches' },
    ];

    // 需要登录才能访问的页面
    const privateItems = [
      { id: 'coaching', label: 'Coaching', icon: <BookIcon />, path: '/coaching/browse' },
    ];

    let items = [...publicItems];
    
    // 如果已登录，添加私有页面
    if (isLoggedIn) {
      items = [...items, ...privateItems];
      
      // 添加EventOrganizer特有的页面
      if (role === 'EventOrganizer' || currentUser?.userType === 'EventOrganizer') {
        items.splice(3, 0, {
          id: 'create-event',
          label: 'Create Event',
          icon: <CreateEventIcon />,
          path: '/events/create'
        });
      }
      
      // 添加Messages页面（非管理员）
      if (role !== 'ADMIN') {
        items.push({ id: 'messages', label: 'Messages', icon: <MailIcon />, path: '/messages' });
      }
      
      // 添加管理员页面
      if (role === 'ADMIN') {
        items.push({ id: 'admin', label: 'Manage Requests', icon: <ManageRequestsIcon />, path: '/admin' });
      }
    } else {
      // 未登录用户只显示公开页面
      items = [...publicItems];
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
      {items.map((item) => {
        // 检查是否是私有页面（需要登录）
        const isPrivateItem = ['messages', 'create-event', 'admin', 'coaching'].includes(item.id);
        
        const button = (
          <Box key={item.id} sx={{ position: 'relative', display: 'inline-block' }}>
            <Button
              startIcon={!isMobile && item.icon}
              onClick={() => navigateTo(item.path, item.id)}
              disabled={!isLoggedIn && isPrivateItem}
              sx={{
                mx: 1,
                px: 2,
                color: activeTab === item.id
                  ? theme.palette.primary.main
                  : theme.palette.text.primary,
                fontWeight: activeTab === item.id ? 'bold' : 'normal',
                position: 'relative',
                transition: 'color 0.2s ease, font-weight 0.2s ease',
                opacity: !isLoggedIn && isPrivateItem ? 0.6 : 1,
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-10px',
                  left: 0,
                  right: 0,
                  height: activeTab === item.id ? '3px' : 0,
                  borderRadius: '3px',
                  backgroundColor: theme.palette.primary.main,
                  transform: activeTab === item.id ? 'scaleX(1)' : 'scaleX(0.8)',
                  transition: 'height 0.3s ease, transform 0.3s ease',
                },
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent',
                  '&:after': {
                    height: '2px',
                    backgroundColor: theme.palette.primary.main
                  }
                },
                '&:disabled': {
                  color: theme.palette.text.disabled,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    '&:after': {
                      height: '2px',
                      backgroundColor: theme.palette.text.disabled
                    }
                  }
                }
              }}
            >
              {item.label}
            </Button>
            {/* Unread messages badge for Messages button */}
            {item.id === 'messages' && unreadMessages > 0 && (
              <Badge
                badgeContent={unreadMessages > 99 ? '99+' : unreadMessages}
                color="error"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: 8,
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    minWidth: 18,
                    height: 18,
                    fontWeight: 'bold'
                  }
                }}
              />
            )}
          </Box>
        );

        // 为未登录用户显示工具提示
        if (!isLoggedIn && isPrivateItem) {
          return (
            <Tooltip 
              key={item.id}
              title="Login to access this feature" 
              arrow
              placement="bottom"
            >
              {button}
            </Tooltip>
          );
        }

        return button;
      })}
    </>
  );

  if (location.pathname.startsWith('/admin/login')) {
    return null;
  }



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
        zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: '1200px', width: '100%', mx: 'auto', px: { xs: 1, sm: 2, lg: 3 } }}>
        <Toolbar sx={{
          justifyContent: 'space-between',
          py: { xs: 1, sm: 1.5 },
          px: { xs: 1, sm: 0 }
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
              {isAdminRoute ? (
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  sx={{
                    fontWeight: 'bold',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: 1.5,
                    fontFamily: '"Roboto Condensed", sans-serif'
                  }}
                >
                  ADMIN PORTAL
                </Typography>
              ) : (
                <Box
                  component="img"
                  src={`${process.env.PUBLIC_URL}/web-name.png`}
                  alt="Brand"
                  sx={{
                    height: isMobile ? 28 : 36,
                    display: 'block'
                  }}
                />
              )}
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
                      onClick={() => navigate('/register')}
                      sx={{
                        mx: 1,
                        backgroundColor: theme.palette.primary.main,
                        '&:hover': { backgroundColor: theme.palette.primary.dark }
                      }}
                    >
                      Register
                    </Button>
                  </>
                )}

              </>
            ) : (
              <>

                
                <Box
                  onClick={handleOpenMenu}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
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
                      src={profileImage ? `${API_URL}/uploads/${profileImage}?ts=${Date.now()}` : null}
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src = null;
                      }}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: theme.palette.primary.main,
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
              </>
            )}
          </Box>
        </Toolbar>

        <Divider sx={{ backgroundColor: theme.palette.divider, mb: 1 }} />

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
          unreadMessages={unreadMessages}
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