// src/components/messaging/GroupCreate.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, TextField, Button, List, ListItem, 
  ListItemAvatar, Avatar, ListItemText, Typography, 
  useTheme, alpha, Badge, Chip, IconButton 
} from '@mui/material';
import { Alert } from '@mui/material';
import UserService from '../../service/UserService';
import GroupService from '../../service/GroupService';
import { useAuth } from '../../context/AuthContext';

import CloseIcon from '@mui/icons-material/Close';

export default function GroupCreate({ onGroupCreated }) {
  const theme = useTheme();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    try {
      const users = await UserService.searchUsers(searchQuery);
      // Filter out current user and already selected members
      const filteredUsers = users.filter(user => 
        user.username !== currentUser?.username &&
        !selectedMembers.some(member => member.username === user.username)
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Search failed', error);
      setError('Failed to search users');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = (user) => {
    // Check if user is already in selected members
    const isAlreadySelected = selectedMembers.some(member => member.username === user.username);
    
    if (!isAlreadySelected) {
      setSelectedMembers([...selectedMembers, user]);
      setSearchResults(searchResults.filter(u => u.username !== user.username));
    } else {
      // Show a brief error message
      setError(`${user.name || user.username} is already added to the group`);
      setTimeout(() => setError(''), 2000);
    }
  };

  const handleRemoveMember = (username) => {
    setSelectedMembers(selectedMembers.filter(member => member.username !== username));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (groupName.trim().length > 100) {
      setError('Group name must be less than 100 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please add at least one member to the group');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Remove duplicate members by username
    const uniqueMembers = selectedMembers.filter((member, index, self) => 
      index === self.findIndex(m => m.username === member.username)
    );

    if (uniqueMembers.length !== selectedMembers.length) {
      setSelectedMembers(uniqueMembers);
      setError('Duplicate members removed. Please try creating the group again.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Debug logging
      console.log('Creating group with data:', {
        groupName,
        description: `Group created by ${currentUser?.name || currentUser?.username}`,
        memberUsernames: uniqueMembers.map(member => member.username),
        currentUser: currentUser?.username
      });
      
      // Check if backend is accessible
      console.log('Checking backend connectivity...');
      const token = localStorage.getItem('authToken');
      console.log('Auth token exists:', !!token);
      
      // Create group using GroupService
      const result = await GroupService.createGroup(
        groupName,
        `Group created by ${currentUser?.name || currentUser?.username}`,
        uniqueMembers.map(member => member.username)
      );
      
      console.log('Group created successfully:', result);
      
      // Check if result.group exists
      if (!result.group) {
        throw new Error('Group creation response is missing group data');
      }
      
      // Create a new group object for the frontend
      const newGroup = {
        id: result.group.id,
        name: result.group.name,
        description: result.group.description,
        memberCount: uniqueMembers.length + 1, // +1 for creator
        lastMessage: null,
        lastMessageTime: new Date(),
        unreadCount: 0,
        creator: { 
          username: currentUser?.username, 
          name: currentUser?.name || currentUser?.username 
        },
        members: uniqueMembers
      };

      setSuccess('Group created successfully! Invitation emails sent to all members.');
      setGroupName('');
      setSelectedMembers([]);
      setSearchResults([]);
      setSearchQuery('');

      // Call the callback to refresh group list
      if (onGroupCreated) {
        onGroupCreated(newGroup);
      }
      
      setTimeout(() => setSuccess(''), 5000); // Show success message longer
    } catch (error) {
      console.error('Failed to create group', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create group. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        const serverError = error.response.data;
        console.error('Server error response:', serverError);
        if (serverError.message) {
          errorMessage = serverError.message;
        } else if (serverError.error) {
          errorMessage = serverError.error;
        }
      } else if (error.request) {
        // Network error
        console.error('Network error - no response received');
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        console.error('Other error:', error.message);
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      p: 3
    }}>
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600, 
            color: theme.palette.text.primary,
            mb: 2,
            fontSize: '1.3rem'
          }}
        >
          Create Group
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.text.secondary,
            mb: 3,
            fontSize: '0.85rem'
          }}
        >
          Create a group chat and add members to start messaging together.
        </Typography>
      </Box>

      {/* Group Name Input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          disabled={loading}
          sx={{
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.6),
            borderRadius: 2,
            boxShadow: theme.shadows[1],
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />
      </Box>

      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              mb: 2,
              fontSize: '0.9rem'
            }}
          >
            Selected Members ({selectedMembers.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedMembers.map((member) => (
              <Chip
                key={member.username}
                avatar={
                  <Avatar 
                    src={member.profileImage}
                    sx={{ width: 20, height: 20 }}
                  >
                    {(member.name || member.username || 'U').substring(0, 1).toUpperCase()}
                  </Avatar>
                }
                label={member.name || member.username}
                onDelete={() => handleRemoveMember(member.username)}
                sx={{
                  fontSize: '0.8rem',
                  '& .MuiChip-deleteIcon': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Search Section */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600, 
            color: theme.palette.text.primary,
            mb: 2,
            fontSize: '0.9rem'
          }}
        >
          Add Members
        </Typography>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            label="Search users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={loading}
            sx={{
              bgcolor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.8)
                : alpha(theme.palette.background.paper, 0.6),
              borderRadius: 2,
              boxShadow: theme.shadows[1],
              mr: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <Button
            variant="contained"
            sx={{
              borderRadius: 2,
              minWidth: 80,
              height: 56,
              fontSize: '0.85rem',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              boxShadow: theme.shadows[2],
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
              }
            }}
            onClick={handleSearch}
            disabled={!searchQuery.trim() || loading}
          >
            {loading ? '...' : 'Search'}
          </Button>
        </Box>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <Box sx={{ flex: 1, overflow: 'auto', mb: 3 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              mb: 2,
              fontSize: '0.9rem'
            }}
          >
            Search Results
          </Typography>
          <List sx={{ p: 0 }}>
            {searchResults.map((user) => (
              <ListItem
                key={user.id}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  transition: 'background 0.2s',
                  background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.6),
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.08)
                  }
                }}
              >
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  <Avatar 
                    src={user.profileImage} 
                    sx={{ 
                      width: 40, 
                      height: 40,
                      boxShadow: theme.shadows[2]
                    }}
                  >
                    {(user.name || user.username || 'U').substring(0, 2).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        fontSize: '0.8rem'
                      }}
                    >
                      {user.name || user.username}
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.7rem'
                      }}
                    >
                      {`@${user.username}`}
                    </Typography>
                  }
                />
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    minWidth: 60,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    color: theme.palette.common.white,
                    boxShadow: theme.shadows[1],
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                    }
                  }}
                  onClick={() => handleAddMember(user)}
                >
                  Add
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      
      {/* Create Group Button */}
      <Button
        variant="contained"
        fullWidth
        sx={{
          borderRadius: 2,
          height: 48,
          fontSize: '0.9rem',
          fontWeight: 600,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          boxShadow: theme.shadows[2],
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
          }
        }}
        onClick={handleCreateGroup}
        disabled={!groupName.trim() || selectedMembers.length === 0 || loading}
      >
        {loading ? 'Creating...' : 'Create Group'}
      </Button>


    </Box>
  );
} 