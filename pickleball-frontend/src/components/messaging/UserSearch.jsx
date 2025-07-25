// src/components/friends/UserSearch.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, TextField, Button, List, ListItem, 
  ListItemAvatar, Avatar, ListItemText, Typography, useTheme, alpha 
} from '@mui/material';
import { Alert } from '@mui/material';
import friendService from '../../service/FriendService';
import UserService from '../../service/UserService';

export default function UserSearch() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [friends, setFriends] = useState([]);

  // Get current user's username from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUsername = currentUser?.username;

  useEffect(() => {
    // Fetch the current user's friends when component mounts
    friendService.getFriends().then(setFriends);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Call backend user search
      const users = await UserService.searchUsers(query);
      setResults(users);
    } catch (error) {
      console.error('Search failed', error);
      let msg = 'Failed to search users';
      if (error.response && error.response.data) {
        // If backend sends a string message
        msg = typeof error.response.data === 'string'
          ? error.response.data
          : (error.response.data.message || msg);
      } else if (error.message) {
        msg = error.message;
      }
      setError(msg);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (username) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await friendService.sendRequest(username);
      setResults(results.filter(user => user.username !== username));
      // Optionally show a success message
      setSuccess('Friend request already sent');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to send request', error);
      console.log('error.response', error.response);
      console.log('error.response.data', error.response?.data);
      let msg = 'Failed to send request';
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          msg = error.response.data;
        } else if (error.response.data.message) {
          msg = error.response.data.message;
        } else {
          msg = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        msg = error.message;
      }
      setError(msg);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          fullWidth
          label="Search users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          disabled={loading}
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            boxShadow: theme.shadows[1],
            mr: 1
          }}
        />
        <Button
          variant="contained"
          sx={{
            borderRadius: '50%',
            minWidth: 48,
            height: 48,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            boxShadow: theme.shadows[2],
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
            }
          }}
          onClick={handleSearch}
          disabled={!query.trim() || loading}
        >
          {loading ? '...' : 'Go'}
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      
      {loading && <Typography>Searching...</Typography>}
      
      {results.length > 0 && (
        <List>
          {results.map(user => {
            const isOwn = user.username === currentUsername;
            const isFriend = friends.some(f => f.username === user.username);
            return (
              <ListItem
                key={user.id}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  transition: 'background 0.2s',
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.08)
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar src={user.profileImage} sx={{ boxShadow: theme.shadows[2] }} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{user.name}</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{`@${user.username}`}</Typography>}
                />
                <Button
                  variant="contained"
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    minWidth: 110,
                    ml: 1,
                    background: isOwn || isFriend ? theme.palette.grey[300] : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    color: isOwn || isFriend ? theme.palette.text.disabled : theme.palette.common.white,
                    boxShadow: theme.shadows[1],
                    '&:hover': {
                      background: isOwn || isFriend ? theme.palette.grey[300] : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                    }
                  }}
                  disabled={loading || isFriend || isOwn}
                  onClick={() => !isOwn && handleAddFriend(user.username)}
                >
                  {isOwn
                    ? "Own"
                    : isFriend
                      ? "Friend"
                      : (loading ? '...' : 'Add')}
                </Button>
              </ListItem>
            );
          })}
        </List>
      )}
      
      {!loading && results.length === 0 && query && (
        <Typography>No users found</Typography>
      )}
    </Box>
  );
}