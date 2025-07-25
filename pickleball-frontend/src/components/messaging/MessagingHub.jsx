// src/components/messaging/MessagingHub.jsx
import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import FriendList from './FriendList';
import FriendRequestList from './FriendRequestList';
import UserSearch from './UserSearch';
import Conversation from './Conversation';
import { useTheme, alpha } from '@mui/material/styles';

export default function MessagingHub() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSelectConversation = (user) => {
    setSelectedConversation(user);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  if (selectedConversation) {
    return (
      <Conversation 
        otherUser={selectedConversation} 
        onBack={handleBack} 
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper square sx={{
        borderRadius: 0,
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[1],
        mb: 0.5,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          TabIndicatorProps={{
            style: {
              background: theme.palette.primary.main,
              height: 3,
              borderRadius: 2
            }
          }}
          textColor="inherit"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '0.95rem',
              color: theme.palette.text.secondary,
              transition: 'color 0.2s',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            }
          }}
        >
          <Tab label="Messages" />
          <Tab label="Requests" />
          <Tab label="Find People" />
        </Tabs>
      </Paper>
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        bgcolor: theme.palette.background.default, 
        p: { xs: 1, sm: 2 },
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(${alpha(theme.palette.background.default, 0.9)}, ${alpha(theme.palette.background.default, 0.9)}), 
             url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='${theme.palette.mode === 'dark' ? '0.05' : '0.03'}' fill-rule='evenodd'/%3E%3C/svg%3E")`
          : theme.palette.background.default,
        backgroundSize: '300px 300px'
      }}>
        {activeTab === 0 && (
          <FriendList onSelectFriend={handleSelectConversation} />
        )}
        {activeTab === 1 && (
          <FriendRequestList />
        )}
        {activeTab === 2 && (
          <UserSearch />
        )}
      </Box>
    </Box>
  );
}