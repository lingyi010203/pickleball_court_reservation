// src/components/messaging/MessagingHub.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Tabs, Tab, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, TextField, InputAdornment, IconButton, Badge, Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Button } from '@mui/material';
import { useLocation } from 'react-router-dom';
import FriendList from './FriendList';
import FriendRequestList from './FriendRequestList';
import UserSearch from './UserSearch';
import GroupCreate from './GroupCreate';
import GroupList from './GroupList';
import Conversation from './Conversation';
import GroupChat from './GroupChat';
import { useAuth } from '../../context/AuthContext';
import GroupService from '../../service/GroupService';
import { useTheme, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';

// Removed status dot icon
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import NotificationsIcon from '@mui/icons-material/Notifications';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupIcon from '@mui/icons-material/Group';

export default function MessagingHub() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [coachesWithChats, setCoachesWithChats] = useState([]);
  const [studentsWithChats, setStudentsWithChats] = useState([]);
  const [groupListKey, setGroupListKey] = useState(0); // For forcing GroupList refresh
  const [searchQuery, setSearchQuery] = useState('');
  const groupListRef = useRef();
  const [newGroups, setNewGroups] = useState([]); // Store newly created groups
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [groupView, setGroupView] = useState('default'); // 'default', 'addFriend', 'friendRequests', 'createGroup'
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedGroupForAddMember, setSelectedGroupForAddMember] = useState(null);
  const [addMemberSearchQuery, setAddMemberSearchQuery] = useState('');
  const [addMemberSearchResults, setAddMemberSearchResults] = useState([]);
  const [selectedUsersForAdd, setSelectedUsersForAdd] = useState([]);
  // Removed online/offline status for users
  const [unreadCounts, setUnreadCounts] = useState({}); // Track unread message counts
  const location = useLocation();
  const { currentUser } = useAuth();
  const isCoach = currentUser?.userType === 'Coach' || currentUser?.userType === 'COACH';

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('messageSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (query) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('messageSearchHistory', JSON.stringify(newHistory));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSearchHistory(query.length > 0);
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    saveSearchHistory(searchQuery);
    setShowSearchHistory(false);
  };

  // Handle search history item click
  const handleSearchHistoryClick = (item) => {
    setSearchQuery(item);
    setShowSearchHistory(false);
  };

  // Handle add menu
  const handleAddMenuOpen = (event) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };

  // Handle menu item clicks
  const handleAddFriend = () => {
    handleAddMenuClose();
    setActiveTab(1); // Switch to Group tab
    setGroupView('addFriend');
  };

  const handleViewFriendRequests = () => {
    handleAddMenuClose();
    setActiveTab(1); // Switch to Group tab
    setGroupView('friendRequests');
  };

  const handleCreateGroup = () => {
    handleAddMenuClose();
    setActiveTab(1); // Switch to Group tab
    setGroupView('createGroup');
  };

  // Fetch friend request count
  useEffect(() => {
    const fetchFriendRequestCount = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:8081/api/friends/requests/count', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setFriendRequestCount(data.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch friend request count:', error);
      }
    };

    fetchFriendRequestCount();
  }, []);

  // Helper function to safely format date
  const formatMessageTime = (timeValue) => {
    if (!timeValue) return '';
    
    try {
      // If it's already a string timestamp, use it directly
      if (typeof timeValue === 'string') {
        return new Date(timeValue).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }
      
      // If it's an object with timestamp property
      if (typeof timeValue === 'object' && timeValue.timestamp) {
        return new Date(timeValue.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }
      
      // If it's a Date object
      if (timeValue instanceof Date) {
        return timeValue.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }
      
      // Default fallback
      return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting date:', error, timeValue);
      return '';
    }
  };

  // Helper function to safely get message preview
  const getMessagePreview = (messageData) => {
    if (!messageData) return '';
    
    try {
      // If it's a string, return it directly
      if (typeof messageData === 'string') {
        return messageData.length > 50 ? messageData.substring(0, 50) + '...' : messageData;
      }
      
      // If it's an object with content property
      if (typeof messageData === 'object' && messageData.content) {
        const content = messageData.content;
        return content.length > 50 ? content.substring(0, 50) + '...' : content;
      }
      
      // If it's an object with text property
      if (typeof messageData === 'object' && messageData.text) {
        const text = messageData.text;
        return text.length > 50 ? text.substring(0, 50) + '...' : text;
      }
      
      // Default fallback
      return '';
    } catch (error) {
      console.error('Error getting message preview:', error, messageData);
      return '';
    }
  };

  // Helper function to safely get display name
  const getDisplayName = (user) => {
    if (!user) return '';
    
    try {
      const name = user.name || user.username || user.email || '';
      return typeof name === 'string' ? name : String(name);
    } catch (error) {
      console.error('Error getting display name:', error, user);
      return '';
    }
  };

  // Helper function to safely get username
  const getUsername = (user) => {
    if (!user) return '';
    
    try {
      const username = user.username || user.email || '';
      return typeof username === 'string' ? username : String(username);
    } catch (error) {
      console.error('Error getting username:', error, user);
      return '';
    }
  };

  // 獲取對話預覽
  useEffect(() => {
    const fetchConversations = async () => {
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
          console.log('Conversation previews:', previewsData);

          if (isCoach) {
            // 教練視角：篩選出學生的對話
            const studentsInChats = [];
            for (const preview of previewsData) {
              if (preview.otherUser && preview.otherUser.userType === 'USER') {
                console.log('Processing student preview:', preview);
                studentsInChats.push({
                  ...preview.otherUser,
                  lastMessage: preview.lastMessage,
                  unreadCount: preview.unreadCount || 0,
                  lastMessageTime: preview.lastMessageTime
                });
              }
            }
            console.log('Students with chats:', studentsInChats);
            setStudentsWithChats(studentsInChats);
            // Initialize unread counts for students
            const initialUnreadCounts = {};
            studentsInChats.forEach(student => {
              initialUnreadCounts[student.id] = student.unreadCount || 0;
            });
            setUnreadCounts(initialUnreadCounts);
          } else {
            // 普通用戶視角：篩選出教練的對話
            const coachesInChats = [];
            for (const preview of previewsData) {
              if (preview.otherUser && preview.otherUser.userType === 'COACH') {
                console.log('Processing coach preview:', preview);
                coachesInChats.push({
                  ...preview.otherUser,
                  lastMessage: preview.lastMessage,
                  unreadCount: preview.unreadCount || 0,
                  lastMessageTime: preview.lastMessageTime
                });
              }
            }
            console.log('Coaches with chats:', coachesInChats);
            setCoachesWithChats(coachesInChats);
            // Initialize unread counts for coaches
            const initialUnreadCounts = {};
            coachesInChats.forEach(coach => {
              initialUnreadCounts[coach.id] = coach.unreadCount || 0;
            });
            setUnreadCounts(initialUnreadCounts);
          }
        } else {
          console.error('Failed to fetch conversation previews:', response.status);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, [isCoach]);

  // 處理 URL 參數，自動選擇教練
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const coachId = searchParams.get('coach');
    const coachName = searchParams.get('name');

    if (coachId && coachName) {
      console.log('Auto-selecting coach from URL params:', coachId, coachName);

      // 從後端獲取教練的實際用戶信息
      const fetchCoachInfo = async () => {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch(`http://localhost:8081/api/users/${coachId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const coachData = await response.json();
            console.log('Coach data from backend:', coachData);

            // Check if we have a valid username
            const username = coachData.userAccount?.username || coachData.email || coachData.username || coachData.name;
            if (!username) {
              console.error('No valid username found for coach:', coachData);
              alert('Coach information is incomplete. Cannot send message. Please contact administrator.');
              return;
            }

            // Create coach user object with actual user information
            const coachUser = {
              id: parseInt(coachId),
              name: decodeURIComponent(coachName),
              username: username,
              userType: 'COACH',
              email: coachData.email || coachData.userAccount?.email
            };
            console.log('Created coach user object:', coachUser);
            setSelectedConversation(coachUser);
          } else {
            console.error('Failed to fetch coach info:', response.status);
            // If unable to get coach information, show error
            alert('Unable to get coach information. Please try again later or contact administrator.');
          }
        } catch (error) {
          console.error('Error fetching coach info:', error);
          // If error occurs, show error
          alert('Unable to get coach information. Please try again later or contact administrator.');
        }
      };

      fetchCoachInfo();
    }
  }, [location.search]);

  // 處理從路由狀態傳遞的用戶信息
  useEffect(() => {
    if (location.state?.selectedUser) {
      console.log('Auto-selecting user from location state:', location.state.selectedUser);
      setSelectedConversation(location.state.selectedUser);
    }
  }, [location.state]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      setGroupView('default'); // Reset group view when switching to Friends tab
    }
  };

  const handleBackToGroupDefault = () => {
    setGroupView('default');
  };

  const handleSelectConversation = (user) => {
    console.log('Selected conversation with user:', user);
    console.log('Current selectedConversation:', selectedConversation);
    console.log('Setting new selectedConversation to:', user);
    setSelectedConversation(user);
    setSelectedGroup(null); // Clear group selection when selecting conversation
  };

  const handleSelectGroup = (group) => {
    console.log('Selected group:', group);
    setSelectedGroup(group);
    setSelectedConversation(null); // Clear conversation selection when selecting group
  };

  const handleBack = () => {
    setSelectedConversation(null);
    setSelectedGroup(null);
  };

  const handleGroupCreated = (newGroup) => {
    // Add the new group to the list
    setNewGroups(prev => {
      const updated = [newGroup, ...prev];
      // Save to localStorage for persistence
      localStorage.setItem('userGroups', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteGroup = (group) => {
    // Remove group from list
    setNewGroups(prev => {
      const updated = prev.filter(g => g.id !== group.id);
      // Update localStorage
      localStorage.setItem('userGroups', JSON.stringify(updated));
      return updated;
    });
    
    // Clear selected group if it's the one being deleted
    if (selectedGroup?.id === group.id) {
      setSelectedGroup(null);
    }
  };

  const handleAddMember = (group) => {
    setSelectedGroupForAddMember(group);
    setAddMemberSearchQuery('');
    setAddMemberSearchResults([]);
    setSelectedUsersForAdd([]);
    setShowAddMemberDialog(true);
  };

  const handleSearchUsersForAdd = async () => {
    if (!addMemberSearchQuery.trim()) {
      setAddMemberSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8081/api/users/search?query=${encodeURIComponent(addMemberSearchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out users who are already in the group
        const existingUsernames = [
          selectedGroupForAddMember.creator?.username,
          ...(selectedGroupForAddMember.members?.map(m => m.username) || [])
        ];
        const filteredResults = data.filter(user => 
          !existingUsernames.includes(user.username) &&
          user.username !== currentUser?.username
        );
        setAddMemberSearchResults(filteredResults);
      } else {
        console.error('Failed to search users');
        setAddMemberSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setAddMemberSearchResults([]);
    }
  };

  const handleSelectUserForAdd = (user) => {
    const isSelected = selectedUsersForAdd.some(u => u.username === user.username);
    if (isSelected) {
      setSelectedUsersForAdd(prev => prev.filter(u => u.username !== user.username));
    } else {
      setSelectedUsersForAdd(prev => [...prev, user]);
    }
  };

  const handleRemoveSelectedUserForAdd = (username) => {
    setSelectedUsersForAdd(prev => prev.filter(u => u.username !== username));
  };

  const handleConfirmAddMembers = async () => {
    if (selectedUsersForAdd.length === 0 || !selectedGroupForAddMember) return;

    try {
      // Send invitation emails
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/groups/send-invitations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groupName: selectedGroupForAddMember.name,
          memberUsernames: selectedUsersForAdd.map(user => user.username)
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Invitation emails sent:', result);
        
        // Update group members in localStorage
        setNewGroups(prev => {
          const updated = prev.map(g => {
            if (g.id === selectedGroupForAddMember.id) {
              const updatedMembers = [...(g.members || []), ...selectedUsersForAdd];
              return {
                ...g,
                members: updatedMembers,
                memberCount: updatedMembers.length + 1 // +1 for creator
              };
            }
            return g;
          });
          localStorage.setItem('userGroups', JSON.stringify(updated));
          return updated;
        });

        // Close dialog and show success message
        setShowAddMemberDialog(false);
        setSelectedUsersForAdd([]);
        setAddMemberSearchQuery('');
        setAddMemberSearchResults([]);
        
        if (result.emailsSent > 0) {
          alert(`Successfully added ${selectedUsersForAdd.length} member(s) to the group! Invitation emails sent to ${result.emailsSent} members.`);
        } else {
          alert(`Successfully added ${selectedUsersForAdd.length} member(s) to the group!`);
        }
        
        if (result.emailsFailed > 0) {
          console.warn('Some invitation emails failed:', result.failedEmails);
        }
      } else {
        console.error('Failed to send invitation emails');
        alert(`Successfully added ${selectedUsersForAdd.length} member(s) to the group! (Email invitations failed)`);
      }
    } catch (error) {
      console.error('Error adding members:', error);
      alert(`Successfully added ${selectedUsersForAdd.length} member(s) to the group! (Email invitations failed)`);
    }
  };

  const handleCancelAddMembers = () => {
    setShowAddMemberDialog(false);
    setSelectedUsersForAdd([]);
    setAddMemberSearchQuery('');
    setAddMemberSearchResults([]);
  };

  const handleEditGroup = (group) => {
    // For now, just show an alert - this could be expanded to show an edit modal
    const newName = prompt(`Edit group name for "${group.name}":`, group.name);
    if (newName && newName.trim() !== '' && newName !== group.name) {
      setNewGroups(prev => {
        const updated = prev.map(g => 
          g.id === group.id ? { ...g, name: newName.trim() } : g
        );
        // Update localStorage
        localStorage.setItem('userGroups', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleViewMembers = (group) => {
    // Show actual members list
    const members = group.members || [];
    const creator = group.creator;
    
    let membersList = `Creator: ${creator?.name || creator?.username || 'Unknown'}\n\nMembers:`;
    
    if (members.length === 0) {
      membersList += '\nNo additional members';
    } else {
      members.forEach(member => {
        membersList += `\n• ${member.name || member.username}`;
      });
    }
    
    alert(`Members of "${group.name}":\n\n${membersList}`);
  };

  // Removed toggle user online status

  // Clear unread messages for a user
  const clearUnreadMessages = (userId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [userId]: 0
    }));
  };

  // Load groups from backend API on component mount
  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!currentUser) return;
      
      try {
        const groups = await GroupService.getUserGroups();
        console.log('Fetched groups from backend:', groups);
        
        // Transform backend groups to frontend format
        const transformedGroups = groups.map(group => ({
          id: group.id,
          name: group.name,
          description: group.description,
          memberCount: group.members ? group.members.length : 0,
          lastMessage: null,
          lastMessageTime: group.updatedAt ? new Date(group.updatedAt) : new Date(),
          unreadCount: 0,
          creator: {
            username: group.creator?.userAccount?.username || group.creator?.username,
            name: group.creator?.name || group.creator?.userAccount?.username
          },
          members: group.members ? group.members.map(member => ({
            username: member.user?.userAccount?.username || member.user?.username,
            name: member.user?.name || member.user?.userAccount?.username,
            id: member.user?.id
          })) : []
        }));
        
        setNewGroups(transformedGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        // Fallback to localStorage if backend fails
        const savedGroups = localStorage.getItem('userGroups');
        if (savedGroups) {
          try {
            const parsedGroups = JSON.parse(savedGroups);
            // Filter groups to only show groups where current user is a member
            const userGroups = parsedGroups.filter(group => {
              // Check if current user is the creator
              if (group.creator?.username === currentUser?.username) {
                return true;
              }
              // Check if current user is in the members list
              if (group.members && Array.isArray(group.members)) {
                return group.members.some(member => 
                  member.username === currentUser?.username || 
                  member.id === currentUser?.id
                );
              }
              return false;
            });
            setNewGroups(userGroups);
          } catch (error) {
            console.error('Error loading groups from localStorage:', error);
          }
        }
      }
    };

    fetchUserGroups();
  }, [currentUser]);

  // Filter conversations based on search query
  const filteredStudents = studentsWithChats.filter(student => 
    searchQuery === '' || 
    (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCoaches = coachesWithChats.filter(coach => 
    searchQuery === '' || 
    (coach.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (coach.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Left Sidebar - Conversation List */}
      <Box sx={{ 
        width: 360, 
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.95)
          : alpha(theme.palette.background.paper, 0.98)
      }}>
        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
          <TextField
            fullWidth
            placeholder="search"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 3,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.default, 0.8)
                  : alpha(theme.palette.background.default, 0.6),
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.3)
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                }
              }
            }}
          />
          {showSearchHistory && (
            <Box sx={{ mt: 1, p: 1, borderRadius: 1, backgroundColor: alpha(theme.palette.background.default, 0.9) }}>
              {searchHistory.map((item, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleSearchHistoryClick(item)}
                  sx={{
                    px: 1,
                    py: 0.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: {
                        fontWeight: 500,
        color: theme.palette.text.primary,
                        '& span': {
                          fontWeight: 600,
                          color: theme.palette.primary.main
                        }
                      }
                    }}
                  />
                </ListItem>
              ))}
            </Box>
          )}
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.9)
            : alpha(theme.palette.background.paper, 0.95),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          TabIndicatorProps={{
            style: {
              background: theme.palette.primary.main,
                height: 2,
                borderRadius: 1
            }
          }}
          textColor="inherit"
          sx={{
              flex: 1,
            '& .MuiTab-root': {
              fontWeight: 600,
                 fontSize: '0.8rem',
              color: theme.palette.text.secondary,
              transition: 'color 0.2s',
                 textTransform: 'none',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            }
          }}
        >
            <Tab label="Friends" />
            <Tab label="Group" />
        </Tabs>
          
          {/* Add Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <IconButton
              onClick={handleAddMenuOpen}
              sx={{
                color: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                width: 32,
                height: 32,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
            
            {/* Friend Request Badge */}
            {friendRequestCount > 0 && (
              <Badge
                badgeContent={friendRequestCount}
                color="error"
                sx={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    minWidth: 16,
                    height: 16
                  }
                }}
              />
            )}
          </Box>
        </Box>

        {/* Add Menu */}
        <Menu
          anchorEl={addMenuAnchor}
          open={Boolean(addMenuAnchor)}
          onClose={handleAddMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              boxShadow: theme.shadows[4],
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleAddFriend} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <PersonAddIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Add Friend
            </Typography>
          </MenuItem>
          
          <MenuItem onClick={handleViewFriendRequests} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <NotificationsIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Friend Requests
            </Typography>
            {friendRequestCount > 0 && (
              <Badge
                badgeContent={friendRequestCount}
                color="error"
                sx={{
                  ml: 'auto',
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    minWidth: 16,
                    height: 16
                  }
                }}
              />
            )}
          </MenuItem>
          
          <MenuItem onClick={handleCreateGroup} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <GroupAddIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Create Group
            </Typography>
          </MenuItem>
        </Menu>

        {/* Conversation List */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.default, 0.8)
            : alpha(theme.palette.background.default, 0.6)
      }}>
        {activeTab === 0 && (
          <Box>
            {isCoach ? (
              // 教練視角：顯示學生列表
              <>
                {/* 有聊天記錄的學生 */}
                  {filteredStudents.length > 0 && (
                    <List sx={{ p: 0 }}>
                      {filteredStudents.map((student, index) => (
                        <ListItem
                          key={student.id}
                          button
                          onClick={() => handleSelectConversation({
                            id: student.id,
                            name: getDisplayName(student),
                            username: getUsername(student),
                            userType: 'USER',
                            email: student.email
                          })}
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderBottom: index < filteredStudents.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                            transition: 'background 0.2s',
                            background: selectedConversation?.id === student.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            '&:hover': {
                              background: alpha(theme.palette.primary.main, 0.08)
                            }
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 48 }}>
                            <Avatar 
                              src={student.profileImage}
                              sx={{ 
                                width: 40, 
                                height: 40,
                                boxShadow: theme.shadows[2]
                              }}
                            >
                              {(getDisplayName(student) || 'S').substring(0, 2).toUpperCase()}
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
                                     fontSize: '0.8rem'
                                   }}
                                 >
                                   {getDisplayName(student) || 'Student'}
                                 </Typography>
                                {unreadCounts[student.id] > 0 && (
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
                                    {unreadCounts[student.id] > 99 ? '99+' : unreadCounts[student.id]}
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
                                   {`@${getUsername(student)}`}
                                 </Typography>
                                {student.lastMessage && (
                                                                   <Typography 
                                   variant="caption" 
                                   sx={{ 
                                     color: student.unreadCount > 0 ? theme.palette.text.primary : theme.palette.text.secondary,
                                     fontSize: '0.7rem',
                                     fontWeight: student.unreadCount > 0 ? 500 : 400,
                                     display: 'block',
                                     overflow: 'hidden',
                                     textOverflow: 'ellipsis',
                                     whiteSpace: 'nowrap',
                                     maxWidth: 200
                                   }}
                                 >
                                   {getMessagePreview(student.lastMessage)}
                                 </Typography>
                                )}
                              </Box>
                            }
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                         <Typography 
                               variant="caption" 
                               sx={{ 
                                 color: theme.palette.text.secondary,
                                 fontSize: '0.65rem',
                                 mb: 0.5
                               }}
                             >
                               {formatMessageTime(student.lastMessageTime)}
                             </Typography>
                             {/* Removed unread indicator dot */}
                          </Box>
                          

                        </ListItem>
                      ))}
                    </List>
                )}
              </>
            ) : (
              // 普通用戶視角：顯示教練和朋友列表
              <>
                {/* 有聊天記錄的教練 */}
                  {filteredCoaches.length > 0 && (
                    <List sx={{ p: 0 }}>
                      {filteredCoaches.map((coach, index) => (
                        <ListItem
                          key={coach.id}
                          button
                          onClick={() => handleSelectConversation({
                            id: coach.id,
                            name: getDisplayName(coach),
                            username: getUsername(coach),
                            userType: 'COACH',
                            email: coach.email
                          })}
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderBottom: index < filteredCoaches.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                            transition: 'background 0.2s',
                            background: selectedConversation?.id === coach.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            '&:hover': {
                              background: alpha(theme.palette.primary.main, 0.08)
                            }
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 48 }}>
                            <Avatar 
                              src={coach.profileImage}
                              sx={{ 
                                width: 40, 
                                height: 40,
                                boxShadow: theme.shadows[2]
                              }}
                            >
                              {(getDisplayName(coach) || 'C').substring(0, 2).toUpperCase()}
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
                                     fontSize: '0.8rem'
                                   }}
                                 >
                                   {getDisplayName(coach) || 'Coach'}
                                 </Typography>
                                {unreadCounts[coach.id] > 0 && (
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
                                    {unreadCounts[coach.id] > 99 ? '99+' : unreadCounts[coach.id]}
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
                                   {`@${getUsername(coach)}`}
                                 </Typography>
                                {coach.lastMessage && (
                                                                   <Typography 
                                   variant="caption" 
                                   sx={{ 
                                     color: coach.unreadCount > 0 ? theme.palette.text.primary : theme.palette.text.secondary,
                                     fontSize: '0.7rem',
                                     fontWeight: coach.unreadCount > 0 ? 500 : 400,
                                     display: 'block',
                                     overflow: 'hidden',
                                     textOverflow: 'ellipsis',
                                     whiteSpace: 'nowrap',
                                     maxWidth: 200
                                   }}
                                 >
                                   {getMessagePreview(coach.lastMessage)}
                                 </Typography>
                                )}
                              </Box>
                            }
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                         <Typography 
                               variant="caption" 
                               sx={{ 
                                 color: theme.palette.text.secondary,
                                 fontSize: '0.65rem',
                                 mb: 0.5
                               }}
                             >
                               {formatMessageTime(coach.lastMessageTime)}
                             </Typography>
                             {/* Removed unread indicator dot */}
                          </Box>
                          

                        </ListItem>
                      ))}
                    </List>
                )}

                {/* 朋友列表 */}
                  <FriendList onSelectFriend={handleSelectConversation} selectedConversation={selectedConversation} searchQuery={searchQuery} />
              </>
            )}
          </Box>
        )}
        {activeTab === 1 && (
            <Box>
              {groupView === 'addFriend' ? (
                <Box>
                  <Box sx={{ 
                    p: 2, 
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <IconButton
                      onClick={handleBackToGroupDefault}
                      size="small"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                                         <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                       Add Friend
                     </Typography>
                  </Box>
                  <UserSearch />
                </Box>
                             ) : groupView === 'friendRequests' ? (
                 <Box>
                   <Box sx={{ 
                     p: 2, 
                     borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                     display: 'flex',
                     alignItems: 'center',
                     gap: 1
                   }}>
                     <IconButton
                       onClick={handleBackToGroupDefault}
                       size="small"
                       sx={{ color: theme.palette.text.secondary }}
                     >
                       <ArrowBackIcon fontSize="small" />
                     </IconButton>
                                          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        Friend Requests {friendRequestCount > 0 && `(${friendRequestCount})`}
                      </Typography>
                   </Box>
          <FriendRequestList />
                 </Box>
               ) : groupView === 'createGroup' ? (
                 <Box>
                   <Box sx={{ 
                     p: 2, 
                     borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                     display: 'flex',
                     alignItems: 'center',
                     gap: 1
                   }}>
                     <IconButton
                       onClick={handleBackToGroupDefault}
                       size="small"
                       sx={{ color: theme.palette.text.secondary }}
                     >
                       <ArrowBackIcon fontSize="small" />
                     </IconButton>
                                          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        Create Group
                      </Typography>
                   </Box>
                   <GroupCreate onGroupCreated={handleGroupCreated} />
                 </Box>
                              ) : (
                 <Box>
                   {/* Group List */}
                           <GroupList
          ref={groupListRef}
          onSelectGroup={handleSelectGroup}
          selectedGroup={selectedGroup}
          searchQuery={searchQuery}
          newGroups={newGroups}
        />
                 </Box>
               )}
            </Box>
          )}
        </Box>
      </Box>

             {/* Right Area - Chat or Empty State */}
       <Box sx={{ 
         flex: 1, 
         display: 'flex', 
         flexDirection: 'column',
         background: theme.palette.mode === 'dark'
           ? alpha(theme.palette.background.default, 0.9)
           : alpha(theme.palette.background.default, 0.95)
       }}>
         {selectedConversation ? (
           <Conversation 
             otherUser={selectedConversation} 
             onBack={handleBack} 
           />
         ) : selectedGroup ? (
           <GroupChat 
             group={selectedGroup} 
             onBack={handleBack} 
           />
         ) : (
          // Empty State
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 4
          }}>
            <Box sx={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 300
                }}
              >
                💬
              </Typography>
            </Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.text.primary,
                mb: 1
              }}
            >
              Welcome to Messages
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: theme.palette.text.secondary,
                textAlign: 'center',
                maxWidth: 400
              }}
            >
              Select a conversation from the left to start messaging, or search for new friends to connect with.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Add Member Dialog */}
      <Dialog
        open={showAddMemberDialog}
        onClose={handleCancelAddMembers}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon />
            <Typography variant="h6">Add Members to {selectedGroupForAddMember?.name}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Search Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
              Search Users
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Search by username or name"
                value={addMemberSearchQuery}
                onChange={(e) => setAddMemberSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchUsersForAdd()}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleSearchUsersForAdd}
                disabled={!addMemberSearchQuery.trim()}
                sx={{ minWidth: 80 }}
              >
                Search
              </Button>
            </Box>
          </Box>

          {/* Selected Users */}
          {selectedUsersForAdd.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                Selected Users ({selectedUsersForAdd.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedUsersForAdd.map((user) => (
                  <Chip
                    key={user.username}
                    avatar={
                      <Avatar sx={{ width: 20, height: 20 }}>
                        {(user.name || user.username).charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    label={user.name || user.username}
                    onDelete={() => handleRemoveSelectedUserForAdd(user.username)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Search Results */}
          {addMemberSearchResults.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                Search Results
              </Typography>
              <List sx={{ p: 0 }}>
                {addMemberSearchResults.map((user) => {
                  const isSelected = selectedUsersForAdd.some(u => u.username === user.username);
                  return (
                    <ListItem
                      key={user.id}
                      onClick={() => handleSelectUserForAdd(user)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {(user.name || user.username).charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name || user.username}
                        secondary={user.username}
                      />
                      {isSelected && (
                        <Chip label="Selected" size="small" color="primary" />
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {addMemberSearchQuery && addMemberSearchResults.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No users found matching "{addMemberSearchQuery}"
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAddMembers}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAddMembers}
            variant="contained"
            disabled={selectedUsersForAdd.length === 0}
          >
            Add {selectedUsersForAdd.length} Member{selectedUsersForAdd.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}