import React from 'react';
import { Menu, MenuItem, Avatar, Divider } from '@mui/material';
import { Help as HelpIcon, ExitToApp as LogoutIcon, HeadsetMic as HeadsetMicIcon } from '@mui/icons-material';
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
           minWidth: 160,
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
                                                                                                               {!(role === 'ADMIN' || isAdminRoute) && (
           <MenuItem
             onClick={() => { navigate('/profile'); handleCloseMenu(); }}
             onKeyPress={(e) => { if (e.key === 'Enter') { navigate('/profile'); handleCloseMenu(); } }}
             tabIndex={0}
             sx={{ py: 1 }}
           >
             My Profile
           </MenuItem>
         )}
               {(role === 'ADMIN' || isAdminRoute) && (
           <MenuItem
             onClick={() => { navigate('/admin/dashboard'); handleCloseMenu(); }}
             onKeyPress={(e) => { if (e.key === 'Enter') { navigate('/admin/dashboard'); handleCloseMenu(); } }}
             tabIndex={0}
             sx={{ py: 1 }}
           >
             Admin Dashboard
           </MenuItem>
         )}
                  <MenuItem
             onClick={() => { navigate('/helpdesk'); handleCloseMenu(); }}
             onKeyPress={(e) => { if (e.key === 'Enter') { navigate('/helpdesk'); handleCloseMenu(); } }}
             tabIndex={0}
             sx={{ py: 1 }}
           >
             Help & Support
          </MenuItem>
       <Divider sx={{ my: 0.5 }} />
       <MenuItem
         onClick={handleLogout}
         onKeyPress={(e) => { if (e.key === 'Enter') handleLogout(); }}
         tabIndex={0}
         sx={{ py: 1, color: logout }}
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