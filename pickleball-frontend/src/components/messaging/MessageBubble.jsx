// src/components/messaging/MessageBubble.jsx
import React from 'react';
import { ListItem, Box, Typography, Avatar, Tooltip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

const MessageBubble = ({ message }) => {
  const theme = useTheme();
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const currentUsername = currentUser.username || '';
  const isOwn = currentUsername.toLowerCase() === (message.senderUsername || '').toLowerCase();
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <ListItem
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        mb: 1.5,
        padding: 0,
        width: '100%'
      }}
    >
      {!isOwn && (
        <Avatar
          src={message.senderProfileImage}
          sx={{ 
            mr: 1.5, 
            width: 40, 
            height: 40, 
            boxShadow: theme.shadows[1],
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
          }}
        />
      )}
      
      <Box
        sx={{
          background: isOwn
            ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.9)})`
            : theme.palette.mode === 'dark'
              ? alpha(theme.palette.grey[800], 0.8)
              : alpha(theme.palette.grey[50], 0.95),
          color: isOwn ? theme.palette.common.white : theme.palette.text.primary,
          p: 2,
          borderRadius: '18px',
          maxWidth: { xs: '85%', sm: '70%' },
          minWidth: 120,
          borderBottomRightRadius: isOwn ? '4px' : '18px',
          borderBottomLeftRadius: isOwn ? '18px' : '4px',
          boxShadow: theme.shadows[1],
          wordBreak: 'break-word',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[3]
          }
        }}
      >
        {message.imageUrl && (
          <Box sx={{
            maxWidth: '100%',
            borderRadius: 2,
            overflow: 'hidden',
            mb: message.content ? 1.5 : 0,
            boxShadow: theme.shadows[1],
          }}>
            <img
              src={message.imageUrl}
              alt="Chat content"
              style={{
                maxWidth: '100%',
                maxHeight: 280,
                display: 'block',
                borderRadius: 8,
              }}
            />
          </Box>
        )}
        
        {message.content && (
          <Typography variant="body1" sx={{ 
            fontSize: '1.05rem', 
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>
            {message.content}
          </Typography>
        )}
        
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mt: 1.5,
          gap: 0.5
        }}>
          <Tooltip title={new Date(message.timestamp).toLocaleString()} arrow>
            <Typography
              variant="caption"
              sx={{
                color: isOwn ? alpha(theme.palette.common.white, 0.7) : theme.palette.text.secondary,
                fontSize: '0.75rem'
              }}
            >
              {formatTimestamp(message.timestamp)}
            </Typography>
          </Tooltip>
          
          {isOwn && (
            <Typography
              variant="caption"
              sx={{
                color: message.read
                  ? theme.palette.success.light
                  : message.delivered
                    ? theme.palette.info.light
                    : alpha(theme.palette.common.white, 0.5),
                fontWeight: 'bold',
                fontSize: '1.1em',
                ml: 0.5
              }}
            >
              {message.read ? '✓✓' : message.delivered ? '✓' : ''}
            </Typography>
          )}
        </Box>
      </Box>
      
      {isOwn && (
        <Avatar
          src={currentUser.profileImage}
          sx={{ 
            ml: 1.5, 
            width: 40, 
            height: 40, 
            boxShadow: theme.shadows[1],
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
          }}
        />
      )}
    </ListItem>
  );
};

export default MessageBubble;