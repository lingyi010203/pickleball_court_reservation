// src/components/messaging/MessageBubble.jsx
import React from 'react';
import { ListItem, Box, Typography, Avatar } from '@mui/material';

const MessageBubble = ({ message }) => {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const currentUsername = currentUser.username || '';
  
  // Determine if message is from current user
  const isOwn = currentUsername.toLowerCase() === (message.senderUsername || '').toLowerCase();
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-GB', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
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
        mb: 1,
        padding: 0,
        width: '100%'
      }}
    >
      {/* Sender avatar (left side for received messages) */}
      {!isOwn && (
        <Avatar
          src={message.senderProfileImage}
          sx={{ mr: 1, width: 36, height: 36 }}
        />
      )}
      
      {/* Message bubble */}
      <Box
        sx={{
          bgcolor: isOwn ? '#1976d2' : '#f5f5f5',
          color: isOwn ? '#fff' : '#333',
          p: 2,
          borderRadius: 4,
          maxWidth: '75%',
          minWidth: '120px',
          borderBottomRightRadius: isOwn ? 4 : 16,
          borderBottomLeftRadius: isOwn ? 16 : 4,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          wordBreak: 'break-word',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Image content */}
        {message.imageUrl && (
          <Box sx={{ 
            maxWidth: '100%', 
            borderRadius: 2, 
            overflow: 'hidden',
            mb: message.content ? 1 : 0
          }}>
            <img 
              src={message.imageUrl} 
              alt="Chat content" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: 300,
                display: 'block'
              }}
            />
          </Box>
        )}
        
        {/* Text content */}
        {message.content && (
          <Typography variant="body1">{message.content}</Typography>
        )}
        
        {/* Timestamp and status */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          alignItems: 'center',
          mt: 1
        }}>
          <Typography
            variant="caption"
            sx={{
              color: isOwn ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
              mr: 1
            }}
          >
            {formatTimestamp(message.timestamp)}
          </Typography>
          
          {/* Message status indicators (only for own messages) */}
          {isOwn && (
            <Typography 
              variant="caption"
              sx={{ 
                color: isOwn ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                fontWeight: 'bold'
              }}
            >
              {message.read ? '✓✓' : message.delivered ? '✓' : ''}
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* Current user avatar (right side for sent messages) */}
      {isOwn && (
        <Avatar
          src={currentUser.profileImage}
          sx={{ ml: 1, width: 36, height: 36 }}
        />
      )}
    </ListItem>
  );
};

export default MessageBubble;