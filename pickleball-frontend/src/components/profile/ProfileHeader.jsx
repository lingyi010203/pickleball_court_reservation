import React from 'react';
import { Avatar, Typography, Box, Chip } from '@mui/material';
import Diamond from '@mui/icons-material/Diamond';
import { useTheme, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const ProfileHeader = ({ profile, showTier, tierConfig, avatarSize = 70, sx }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const currentTier = tierConfig ? tierConfig[profile.memberTier] : null;

  const statusColor = profile.status === 'ACTIVE' ? 'success' :
    profile.status === 'PENDING' ? 'warning' :
      profile.status === 'LOCKED' ? 'error' : 'default';

  return (
    <Box sx={{
      textAlign: 'center',
      position: 'relative',
      width: '100%',
      overflow: 'hidden',
      ...sx
    }}>
      {/* Status Chip */}
      <Chip
        label={profile.status}
        color={statusColor}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          fontSize: '0.65rem',
          height: 22,
          minWidth: 50,
          zIndex: 10,
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />
      
      {/* Tier Badge - if enabled */}
      {showTier && currentTier && (
        <Box sx={{
          position: 'absolute',
          top: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: currentTier.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 3,
          zIndex: 1
        }}>
          <Diamond sx={{ color: 'white', fontSize: 30 }} />
        </Box>
      )}
      
      {/* Avatar */}
      <Avatar
        src={profile.profileImage ? 
          `http://localhost:8081/uploads/${profile.profileImage}?ts=${new Date().getTime()}` : 
          null
        }
        sx={{
          width: avatarSize,
          height: avatarSize,
          mb: 1.5,
          bgcolor: theme.palette.primary.light,
          fontSize: '1.8rem',
          fontWeight: 'bold',
          mx: 'auto',
          border: showTier && currentTier ? 
            `3px solid ${currentTier.color}` : 
            `3px solid ${alpha(theme.palette.divider, 0.2)}`,
          position: 'relative',
          zIndex: 2,
          cursor: 'pointer',
          ...(showTier && { mt: 3 })
        }}
        onClick={() => navigate('/profile')}
      >
        {!profile.profileImage && (profile.username || profile.name)?.charAt(0).toUpperCase()}
      </Avatar>

      {/* Username/Name */}
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 'bold', 
          color: theme.palette.text.primary,
          mb: 0.5,
          fontSize: { xs: '1.1rem', lg: '1.25rem' },
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          '&:hover': { textDecoration: 'underline' }
        }}
        onClick={() => navigate('/profile')}
      >
        {profile.username || profile.name}
      </Typography>

      {/* Email */}
      <Typography variant="body2" color="text.secondary" sx={{
        fontSize: '0.85rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        mb: showTier && currentTier ? 1 : 0
      }}>
        {profile.email}
      </Typography>

      {/* Tier Badge - if enabled */}
      {showTier && currentTier && (
        <Chip 
          label={`${currentTier.name} Member`}
          sx={{ 
            bgcolor: currentTier.gradient,
            color: 'white',
            fontWeight: 'bold',
            mt: 1,
            px: 1.5,
            py: 0.5,
            fontSize: '0.8rem',
            height: 28
          }}
        />
      )}
    </Box>
  );
};

export default ProfileHeader;