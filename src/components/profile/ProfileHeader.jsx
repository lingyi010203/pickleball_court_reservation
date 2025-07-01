import React from 'react';
import { Avatar, Typography, Box, Chip } from '@mui/material';
import Diamond from '@mui/icons-material/Diamond';
import { useTheme } from '@mui/material';

const ProfileHeader = ({ profile, showTier, tierConfig, avatarSize = 80, sx }) => {
  const theme = useTheme();
  const currentTier = tierConfig ? tierConfig[profile.memberTier] : null;

  const statusColor = profile.status === 'ACTIVE' ? 'success' :
    profile.status === 'PENDING' ? 'warning' :
      profile.status === 'LOCKED' ? 'error' : 'default';

  return (
    <Box sx={{
      backgroundColor: 'white',
      borderRadius: '16px',
      p: 3,
      textAlign: 'center',
      mb: 3,
      border: '1px solid #f0f0f0',
      position: 'relative',
      ...sx
    }}>
      <Chip
        label={profile.status}
        color={statusColor}
        size="small"
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          fontSize: '0.7rem'
        }}
      />
      {showTier && currentTier && (
        <Box sx={{
          position: 'absolute',
          top: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: currentTier.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 3,
          zIndex: 1
        }}>
          <Diamond sx={{ color: 'white', fontSize: 40 }} />
        </Box>
      )}
      
      <Avatar
        src={profile.profileImage ? 
          `http://localhost:8081/uploads/${profile.profileImage}?ts=${new Date().getTime()}` : 
          null
        }
        sx={{
          width: avatarSize,
          height: avatarSize,
          mb: 1,
          bgcolor: theme.palette.primary.light,
          fontSize: '2.5rem',
          fontWeight: 'bold',
          mx: 'auto',
          border: showTier && currentTier ? `3px solid ${currentTier.color}` : '3px solid #f0f0f0',
          position: 'relative',
          zIndex: 2,
          ...(showTier && { mt: 4 })
        }}
      >
        {!profile.profileImage && (profile.username || profile.name)?.charAt(0).toUpperCase()}
      </Avatar>

      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
        {profile.username || profile.name}
      </Typography>

      <Typography variant="body2" color="text.secondary" >
        {profile.email}
      </Typography>

      {showTier && currentTier && (
        <Chip 
          label={`${currentTier.name} Member`}
          sx={{ 
            bgcolor: currentTier.gradient,
            color: 'white',
            fontWeight: 'bold',
            mt: 1,
            px: 2,
            py: 1,
            fontSize: '0.9rem'
          }}
        />
      )}
    </Box>
  );
};

export default ProfileHeader;