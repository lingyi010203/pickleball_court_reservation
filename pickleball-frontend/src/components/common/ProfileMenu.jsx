import React from 'react';
import { Menu, MenuItem, Avatar, Divider } from '@mui/material';
import { Help as HelpIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { THEME } from '../../constants';

const ProfileMenu = ({
  anchorEl,
  handleCloseMenu,
  profileImage,
  isAdminRoute,
  getUsernameInitial,
  navigate,
  role,
  handleLogout,
  API_URL
}) => {
  const { 
    colors: { adminPrimary, primary, adminPrimaryHover, primaryHover, logout } 
  } = THEME;

  return (
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
        onKeyPress={(e) => { if (e.key === 'Enter') { navigate('/profile'); handleCloseMenu(); } }}
        tabIndex={0}
        sx={{ py: 1.5 }}
      >
        <Avatar
          src={profileImage ? `${API_URL}/uploads/${profileImage}?ts=${Date.now()}` : null}
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
        My Profile
      </MenuItem>
      <MenuItem
        onClick={() => { navigate('/helpdesk'); handleCloseMenu(); }}
        onKeyPress={(e) => { if (e.key === 'Enter') { navigate('/helpdesk'); handleCloseMenu(); } }}
        tabIndex={0}
        sx={{ py: 1.5 }}
      >
        <HelpIcon sx={{ mr: 1.5, color: adminPrimary }} />
        Help & Support
      </MenuItem>
      {(role === 'ADMIN' || isAdminRoute) && (
        <MenuItem
          onClick={() => { navigate('/admin'); handleCloseMenu(); }}
          onKeyPress={(e) => { if (e.key === 'Enter') { navigate('/admin'); handleCloseMenu(); } }}
          tabIndex={0}
          sx={{ py: 1.5 }}
        >
          <Avatar
            sx={{
              bgcolor: isAdminRoute ? adminPrimaryHover : primaryHover,
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
        onKeyPress={(e) => { if (e.key === 'Enter') handleLogout(); }}
        tabIndex={0}
        sx={{ py: 1.5, color: logout }}
      >
        <LogoutIcon sx={{ mr: 1.5, color: logout }} />
        Logout
      </MenuItem>
    </Menu>
  );
};

ProfileMenu.propTypes = {
  anchorEl: PropTypes.object,
  handleCloseMenu: PropTypes.func.isRequired,
  profileImage: PropTypes.string,
  isAdminRoute: PropTypes.bool.isRequired,
  getUsernameInitial: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  role: PropTypes.string,
  handleLogout: PropTypes.func.isRequired,
  API_URL: PropTypes.string.isRequired
};

export default ProfileMenu;