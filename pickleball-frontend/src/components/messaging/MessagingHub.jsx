// src/components/messaging/MessagingHub.jsx
import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import FriendList from './FriendList';
import FriendRequestList from './FriendRequestList';
import UserSearch from './UserSearch';
import Conversation from './Conversation';

export default function MessagingHub() {
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
      <Paper square>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Messages" />
          <Tab label="Requests" />
          <Tab label="Find People" />
        </Tabs>
      </Paper>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
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