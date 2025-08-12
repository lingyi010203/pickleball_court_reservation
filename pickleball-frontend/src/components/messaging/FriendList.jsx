// src/components/friends/FriendList.jsx
import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemAvatar, Avatar, 
  ListItemText, Typography, Box, IconButton 
} from '@mui/material';
import friendService from '../../service/FriendService';
import messageService from '../../service/MessageService';
import { useTheme, alpha } from '@mui/material/styles';
// Removed status dot icon


export default function FriendList({ onSelectFriend, selectedConversation, searchQuery = '' }) {
  const theme = useTheme();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed online/offline status tracking
  const [unreadCounts, setUnreadCounts] = useState({}); // Track unread message counts
  const [lastMessages, setLastMessages] = useState({}); // Store last messages for each friend

  // 獲取真實的最後聊天消息
  const getLastMessage = (friend) => {
    const friendUsername = getUsername(friend);
    const lastMessage = lastMessages[friendUsername];
    
    if (lastMessage) {
      return {
        content: lastMessage.content,
        time: new Date(lastMessage.timestamp),
        unreadCount: lastMessage.unreadCount || 0
      };
    }
    
    // 如果沒有真實消息，返回默認
    return { content: "No messages yet", time: new Date(), unreadCount: 0 };
  };

  const formatMessageTime = (timeValue) => {
    if (!timeValue) return '';
    
    try {
      let time;
      
      // If it's already a string timestamp, use it directly
      if (typeof timeValue === 'string') {
        time = new Date(timeValue);
      }
      // If it's an object with timestamp property
      else if (typeof timeValue === 'object' && timeValue.timestamp) {
        time = new Date(timeValue.timestamp);
      }
      // If it's a Date object
      else if (timeValue instanceof Date) {
        time = timeValue;
      }
      else {
        return '';
      }
      
      const now = new Date();
      const diffInHours = (now - time) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - time) / (1000 * 60));
        return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch (error) {
      console.error('Error formatting date:', error, timeValue);
      return '';
    }
  };

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
        
        // Initialize unread counts - will be updated with real data from fetchLastMessages
        const initialUnreadCounts = {};
        data.forEach(friend => {
          initialUnreadCounts[friend.id] = 0;
        });
        setUnreadCounts(initialUnreadCounts);
        
        // Fetch last messages for each friend
        await fetchLastMessages(data);
      } catch (error) {
        console.error('Failed to fetch friends', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  // 獲取所有好友的最後消息 - 使用對話預覽API
  const fetchLastMessages = async (friendsList) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/messages/previews', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const previewsData = await response.json();
        console.log('Conversation previews for friends:', previewsData);
        
        const lastMessagesData = {};
        
        // 篩選出朋友的對話（非教練）
        for (const preview of previewsData) {
          if (preview.otherUser && preview.otherUser.userType === 'USER') {
            const username = preview.otherUser.username;
            if (preview.lastMessage) {
              lastMessagesData[username] = {
                content: preview.lastMessage.content || preview.lastMessage,
                timestamp: preview.lastMessage.timestamp || preview.lastMessageTime,
                senderUsername: preview.otherUser.username,
                unreadCount: preview.unreadCount || 0
              };
            }
          }
        }
        
        // Update unread counts with real data
        const updatedUnreadCounts = {};
        friends.forEach(friend => {
          const friendUsername = getUsername(friend);
          const lastMessage = lastMessagesData[friendUsername];
          updatedUnreadCounts[friend.id] = lastMessage ? lastMessage.unreadCount : 0;
        });
        setUnreadCounts(updatedUnreadCounts);
        
        setLastMessages(lastMessagesData);
      } else {
        console.error('Failed to fetch conversation previews:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch last messages:', error);
    }
  };

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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                {unreadCounts[friend.id] > 0 && (
                  <Box sx={{
                    backgroundColor: theme.palette.error.main,
                    color: theme.palette.common.white,
                    borderRadius: '50%',
                    minWidth: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    {unreadCounts[friend.id] > 99 ? '99+' : unreadCounts[friend.id]}
                  </Box>
                )}
              </Box>
            }
            secondary={
              <Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.7rem',
                    display: 'block'
                  }}
                >
                  {`@${getUsername(friend)}`}
                </Typography>
                {(() => {
                  const lastMessage = getLastMessage(friend);
                  return (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: unreadCounts[friend.id] > 0 ? theme.palette.text.primary : theme.palette.text.secondary,
                        fontSize: '0.7rem',
                        fontWeight: unreadCounts[friend.id] > 0 ? 500 : 400,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 200
                      }}
                    >
                      {lastMessage.content}
                    </Typography>
                  );
                })()}
              </Box>
            }
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {(() => {
              const lastMessage = getLastMessage(friend);
              return (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.65rem',
                    mb: 0.5
                  }}
                >
                  {formatMessageTime(lastMessage.time)}
                </Typography>
              );
            })()}
            {/* Removed unread indicator dot */}
          </Box>
          

        </ListItem>
      ))}
    </List>
  );
}