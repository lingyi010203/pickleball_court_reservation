// src/components/friends/UserSearch.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, TextField, Button, List, ListItem, 
  ListItemAvatar, Avatar, ListItemText, Typography, useTheme, alpha, Badge 
} from '@mui/material';
import { Alert } from '@mui/material';
import friendService from '../../service/FriendService';
import UserService from '../../service/UserService';
import { useAuth } from '../../context/AuthContext';


export default function UserSearch() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [friends, setFriends] = useState([]);
  const { currentUser } = useAuth();
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
          Find People
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.text.secondary,
            mb: 3,
            fontSize: '0.85rem'
          }}
        >
          Search for other players to connect with and start messaging.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          fullWidth
          label="Search users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
          disabled={!query.trim() || loading}
        >
          {loading ? '...' : 'Search'}
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      
      {loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Searching...
          </Typography>
        </Box>
      )}
      
      {results.length > 0 && (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            Search Results
          </Typography>
          <List sx={{ p: 0 }}>
            {results.map((user, index) => {
              const isOwn = user.username === currentUsername;
              const isFriend = friends.some(f => f.username === user.username);
              return (
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
                        {user.name}
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
                    sx={{
                      borderRadius: 3,
                      fontWeight: 600,
                      minWidth: 110,
                      ml: 1,
                      fontSize: '0.8rem',
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
        </Box>
      )}
      
      {!loading && results.length === 0 && query && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            No users found
          </Typography>
        </Box>
      )}
    </Box>
  );
}