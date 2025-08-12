// src/components/messaging/GroupList.jsx
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, 
  useTheme, alpha, Badge
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import GroupIcon from '@mui/icons-material/Group';




const GroupList = forwardRef(({ onSelectGroup, selectedGroup, searchQuery = '', newGroups = [] }, ref) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth();

  // Expose empty object to parent component (no longer needed but keeping for compatibility)
  useImperativeHandle(ref, () => ({}));

  // No mock data - only use newGroups from parent
  // When backend API is implemented, fetch groups here
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call when backend group functionality is implemented
        // const response = await fetch('/api/groups/my-groups', {
        //   headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        // });
        // const data = await response.json();
        // setGroups(data);
        
        // For now, no groups are loaded from backend
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []); // Only run once on mount

  // Only use newGroups since there's no backend API yet
  const allGroups = newGroups;

  // Filter groups based on search query
  const filteredGroups = allGroups.filter(group => 
    searchQuery === '' || 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (time) => {
    if (!time) return '';
    
    try {
      const date = new Date(time);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch (error) {
      return '';
    }
  };

  const getDisplayName = (user) => {
    if (!user) return 'Unknown User';
    if (typeof user === 'string') return user;
    return user.name || user.username || 'Unknown User';
  };







  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 200,
        color: theme.palette.text.secondary
      }}>
        <Typography>Loading groups...</Typography>
      </Box>
    );
  }

  if (allGroups.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 200,
        color: theme.palette.text.secondary,
        textAlign: 'center',
        px: 2
      }}>
        <GroupIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
          No Groups Yet
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          Create your first group to start chatting with multiple people
        </Typography>
      </Box>
    );
  }

  if (filteredGroups.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 200,
        color: theme.palette.text.secondary,
        textAlign: 'center',
        px: 2
      }}>
        <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
          No Groups Found
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          Try adjusting your search terms
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <List sx={{ p: 0 }}>
        {filteredGroups.map((group) => (
        <ListItem
          key={group.id}
          onClick={() => onSelectGroup(group)}
          selected={selectedGroup?.id === group.id}
          sx={{
            cursor: 'pointer',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
              },
            },
            py: 1.5,
            px: 2,
          }}
        >
                     <ListItemAvatar>
             <Avatar
               sx={{
                 bgcolor: theme.palette.primary.main,
                 width: 48,
                 height: 48,
               }}
             >
               <GroupIcon />
             </Avatar>
           </ListItemAvatar>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: theme.palette.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '70%'
                  }}
                >
                  {group.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    color: theme.palette.text.secondary,
                    ml: 1
                  }}
                >
                  {formatTime(group.lastMessageTime)}
                </Typography>
              </Box>
            }
            secondary={
              <Box sx={{ mt: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8rem',
                    color: theme.palette.text.secondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mb: 0.5
                  }}
                >
                  {group.lastMessage || 'No messages yet'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      color: theme.palette.text.secondary
                    }}
                  >
                    {group.memberCount} members
                  </Typography>
                  {group.unreadCount > 0 && (
                    <Badge
                      badgeContent={group.unreadCount}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.7rem',
                          minWidth: 16,
                          height: 16,
                        }
                      }}
                    />
                  )}
                </Box>
              </Box>
            }
          />
        </ListItem>
      ))}
      </List>
    </Box>
  );
});

GroupList.displayName = 'GroupList';

export default GroupList; 