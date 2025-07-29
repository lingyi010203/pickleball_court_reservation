// src/components/messaging/MessagingHub.jsx
import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import FriendList from './FriendList';
import FriendRequestList from './FriendRequestList';
import UserSearch from './UserSearch';
import Conversation from './Conversation';
import { useAuth } from '../../context/AuthContext';
import { useTheme, alpha } from '@mui/material/styles';

export default function MessagingHub() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [coachesWithChats, setCoachesWithChats] = useState([]);
  const [studentsWithChats, setStudentsWithChats] = useState([]);
  const location = useLocation();
  const { currentUser } = useAuth();
  const isCoach = currentUser?.userType === 'Coach' || currentUser?.userType === 'COACH';

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
                studentsInChats.push(preview.otherUser);
              }
            }
            console.log('Students with chats:', studentsInChats);
            setStudentsWithChats(studentsInChats);
          } else {
            // 普通用戶視角：篩選出教練的對話
            const coachesInChats = [];
            for (const preview of previewsData) {
              if (preview.otherUser && preview.otherUser.userType === 'COACH') {
                coachesInChats.push(preview.otherUser);
              }
            }
            console.log('Coaches with chats:', coachesInChats);
            setCoachesWithChats(coachesInChats);
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

            // 檢查是否有有效的 username
            const username = coachData.userAccount?.username || coachData.email;
            if (!username) {
              console.error('No valid username found for coach:', coachData);
              alert('教練信息不完整，無法發送消息。請聯繫管理員。');
              return;
            }

            // 創建教練對象，使用實際的用戶信息
            const coachUser = {
              id: parseInt(coachId),
              name: decodeURIComponent(coachName),
              username: username,
              userType: 'COACH',
              email: coachData.email
            };
            console.log('Created coach user object:', coachUser);
            setSelectedConversation(coachUser);
          } else {
            console.error('Failed to fetch coach info:', response.status);
            // 如果無法獲取教練信息，顯示錯誤
            alert('無法獲取教練信息，請稍後再試或聯繫管理員。');
          }
        } catch (error) {
          console.error('Error fetching coach info:', error);
          // 如果出錯，顯示錯誤
          alert('無法獲取教練信息，請稍後再試或聯繫管理員。');
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
          <Box>
            {isCoach ? (
              // 教練視角：顯示學生列表
              <>
                {/* 有聊天記錄的學生 */}
                {studentsWithChats.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Students</Typography>
                    <List>
                      {studentsWithChats.map(student => (
                        <ListItem
                          key={student.id}
                          button
                          onClick={() => handleSelectConversation({
                            id: student.id,
                            name: student.name || student.username || 'Student',
                            username: student.username || student.email,
                            userType: 'USER',
                            email: student.email
                          })}
                        >
                          <ListItemAvatar>
                            <Avatar src={student.profileImage}>
                              {student.name?.substring(0, 2)?.toUpperCase() || 'S'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={student.name || student.username || 'Student'}
                            secondary={`@${student.username || student.email}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </>
            ) : (
              // 普通用戶視角：顯示教練和朋友列表
              <>
                {/* 有聊天記錄的教練 */}
                {coachesWithChats.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Coaches</Typography>
                    <List>
                      {coachesWithChats.map(coach => (
                        <ListItem
                          key={coach.id}
                          button
                          onClick={() => handleSelectConversation({
                            id: coach.id,
                            name: coach.name || coach.username || 'Coach',
                            username: coach.username || coach.email,
                            userType: 'COACH',
                            email: coach.email
                          })}
                        >
                          <ListItemAvatar>
                            <Avatar src={coach.profileImage}>
                              {coach.name?.substring(0, 2)?.toUpperCase() || 'C'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={coach.name || coach.username || 'Coach'}
                            secondary={`@${coach.username || coach.email}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* 朋友列表 */}
   <FriendList onSelectFriend={handleSelectConversation} />
              </>
            )}
          </Box>
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