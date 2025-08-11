// src/components/friends/FriendList.jsx
import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemAvatar, Avatar, 
  ListItemText, Typography, Box, IconButton 
} from '@mui/material';
import friendService from '../../service/FriendService';
import { useTheme, alpha } from '@mui/material/styles';
// Removed status dot icon
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function FriendList({ onSelectFriend, selectedConversation, searchQuery = '' }) {
  const theme = useTheme();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed online/offline status tracking
  const [unreadCounts, setUnreadCounts] = useState({}); // Track unread message counts

  // Helper function to safely get display name
  const getDisplayName = (friend) => {
    if (!friend) return '';
    
    try {
      const name = friend.name || friend.username || friend.email || '';
      return typeof name === 'string' ? name : String(name);
    } catch (error) {
      console.error('Error getting display name:', error, friend);
      return '';
    }
  };

  // Helper function to safely get username
  const getUsername = (friend) => {
    if (!friend) return '';
    
    try {
      const username = friend.username || friend.email || '';
      return typeof username === 'string' ? username : String(username);
    } catch (error) {
      console.error('Error getting username:', error, friend);
      return '';
    }
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await friendService.getFriends();
        console.log('API getFriends result:', data); // Debug: log the API response
        setFriends(Array.isArray(data) ? data : []); // Defensive: always set an array
        
        // Initialize unread counts only
        const initialUnreadCounts = {};
        data.forEach(friend => {
          initialUnreadCounts[friend.id] = Math.floor(Math.random() * 3); // Random unread count for demo
        });
        setUnreadCounts(initialUnreadCounts);
      } catch (error) {
        console.error('Failed to fetch friends', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  // Removed toggle online status

  // Clear unread messages for a friend
  const clearUnreadMessages = (friendId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [friendId]: 0
    }));
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend => 
    searchQuery === '' || 
    getDisplayName(friend).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getUsername(friend).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
        Loading friends...
      </Typography>
    </Box>
  );

  if (filteredFriends.length === 0) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center', 
        color: theme.palette.text.secondary 
      }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {searchQuery ? 'No friends found' : 'No friends yet'}
        </Typography>
        <Typography variant="caption">
          {searchQuery ? 'Try a different search term' : 'Start connecting with other players!'}
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {filteredFriends.map((friend, index) => (
        <ListItem
          key={friend.id}
          button
          onClick={() => onSelectFriend(friend)}
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: index < filteredFriends.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
            transition: 'background 0.2s',
            background: selectedConversation?.id === friend.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          <ListItemAvatar sx={{ minWidth: 48 }}>
            <Avatar 
              src={friend.profileImage} 
              sx={{ 
                width: 40, 
                height: 40,
                boxShadow: theme.shadows[2]
              }}
            >
              {(getDisplayName(friend) || 'F').substring(0, 2).toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  fontSize: '0.9rem'
                }}
              >
                {getDisplayName(friend)}
              </Typography>
            }
            secondary={
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem'
                }}
              >
                {`@${getUsername(friend)}`}
              </Typography>
            }
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.7rem',
                mb: 0.5
              }}
            >
              {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
            {/* Removed unread indicator dot */}
          </Box>
          
          {/* Friend Actions Menu */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              // Clear unread if present (status feature removed)
              if (unreadCounts[friend.id] > 0) {
                clearUnreadMessages(friend.id);
              }
            }}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
              }
            }}
          >
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </ListItem>
      ))}
    </List>
  );
}