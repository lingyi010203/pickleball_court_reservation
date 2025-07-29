import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tabs,
  Tab,
  Collapse,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Schedule,
  Assessment,
  Settings,
  Notifications,
  Add,
  Edit,
  Delete,
  Star,
  TrendingUp,
  CalendarToday,
  Person,
  FitnessCenter,
  Message,
  School,
  AttachMoney,
  CheckCircle,
  Receipt,
  AccountBalanceWallet,
  TrendingDown,
  AccountBalance
} from '@mui/icons-material';
import CoachScheduleManagement from './CoachScheduleManagement';
import MessagingPage from '../messaging/MessagingPage';
import CoachService from '../../service/CoachService';
import LeaveRequestService from '../../service/LeaveRequestService';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import StudentManagementSystem from './StudentManagementSystem';
import DeleteIcon from '@mui/icons-material/Delete';
import ClassSessionService from '../../service/ClassSessionService';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const drawerWidth = 240;

export default function CoachingDashboard() {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [scheduleTab, setScheduleTab] = useState(0);
  const [sessions, setSessions] = useState([]); // <-- real session data
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [expandedGroups, setExpandedGroups] = useState([]); // for expand/collapse
  const { currentUser, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [unattendedClasses, setUnattendedClasses] = useState([]);
  const [unattendedClassesCount, setUnattendedClassesCount] = useState(0);
  // Add these two lines to fix no-undef error
  const coachInitial = currentUser?.username?.charAt(0)?.toUpperCase() || 'C';
  const coachName = currentUser?.username || 'Coach';

  // 新增：獲取教練收入歷史
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showWalletTransactions, setShowWalletTransactions] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [revenueStatus, setRevenueStatus] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const fetchIncomeHistory = async () => {
    try {
      setIncomeLoading(true);
      const response = await fetch('http://localhost:8081/api/coach/income-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIncomeHistory(data.incomeHistory || []);
        console.log('Income history:', data);
      } else {
        console.error('Failed to fetch income history');
      }
    } catch (error) {
      console.error('Error fetching income history:', error);
    } finally {
      setIncomeLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      console.log('=== Fetching wallet balance ===');
      const response = await CoachService.getWalletBalance();
      console.log('Wallet balance response:', response);
      setWalletBalance(response);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // 如果錢包餘額獲取失敗，設置默認值
      setWalletBalance({
        balance: 0.00,
        coachName: 'Unknown',
        walletStatus: 'UNKNOWN'
      });
    }
  };

  const fetchWalletTransactions = async () => {
    try {
      setWalletLoading(true);
      const response = await CoachService.getWalletTransactions();
      setWalletTransactions(response.transactions || []);
    } catch (error) {
      console.error('Failed to fetch wallet transactions:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchRevenueStatus = async () => {
    try {
      setRevenueLoading(true);
      const response = await api.get('/coach/revenue-status');
      setRevenueStatus(response.data.revenueStatus || []);
    } catch (error) {
      console.error('Failed to fetch revenue status:', error);
    } finally {
      setRevenueLoading(false);
    }
  };

  // 在組件加載時獲取收入歷史和錢包餘額
  useEffect(() => {
    if (currentUser?.id) {
      fetchIncomeHistory();
      fetchWalletBalance();
    }
  }, [currentUser?.id]);

  // 新增：获取学生数据
  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const studentsData = await CoachService.getAllStudents();
      console.log('Fetched students data:', studentsData);
      setStudentList(studentsData);
      
      // 更新dashboard统计
      setDashboardStats(prev => ({
        ...prev,
        totalStudents: studentsData.length
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudentError('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  // 獲取未讀訊息數量
  const fetchUnreadMessages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/messages/previews', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.reduce((total, preview) => total + (preview.unreadCount || 0), 0);
        setUnreadMessages(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  // 獲取補課請求
  const fetchLeaveRequests = async () => {
    try {
      if (currentUser && currentUser.id) {
        console.log('=== fetchLeaveRequests ===');
        console.log('Current user ID:', currentUser.id);
        const data = await LeaveRequestService.getPendingRequestsByCoach(currentUser.id);
        console.log('Fetched leave requests data:', data);
        console.log('Number of requests:', data.length);
        
        // 調試每個請求的場地信息
        data.forEach((request, index) => {
          console.log(`Request ${index + 1} venue info:`, {
            venue: request.venue,
            state: request.state,
            court: request.court,
            originalSessionTitle: request.originalSessionTitle
          });
        });
        
        setLeaveRequests(data);
        setPendingRequestCount(data.length);
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    }
  };
  const [showMakeupDialog, setShowMakeupDialog] = useState(false);
  const [makeupSessionData, setMakeupSessionData] = useState({
    title: '',
    description: '',
    venueId: '',
    courtId: '',
    startTime: '',
    endTime: '',
    maxParticipants: 6,
    price: '',
    slotType: 'COACH_SESSION'
  });
  const [makeupOriginSession, setMakeupOriginSession] = useState(null);
  const [showForceCancelDialog, setShowForceCancelDialog] = useState(false);
  const [forceCancelSessionId, setForceCancelSessionId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [cancelledSessionObj, setCancelledSessionObj] = useState(null);
  const [busySlots, setBusySlots] = useState([]);
  const [replacementClasses, setReplacementClasses] = useState([]);

  // 新增：Dashboard 數據計算
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    todaySessions: 0,
    completionRate: 0,
    averageRating: 0
  });

  const [todaySessionsList, setTodaySessionsList] = useState([]);
  const [studentProgressList, setStudentProgressList] = useState([]);

  // 當 Dialog 開啟且有選擇場地時，fetch busy slots
  useEffect(() => {
    if (showMakeupDialog && makeupSessionData.courtId && makeupSessionData.startTime) {
      // 只查詢選擇日期那天的 busy slots
      const date = new Date(makeupSessionData.startTime);
      const dateStr = date.toISOString().slice(0, 10);
      CoachService.getAvailableTimes(makeupSessionData.courtId, dateStr).then(setBusySlots);
    }
  }, [showMakeupDialog, makeupSessionData.courtId, makeupSessionData.startTime]);

  // 获取学生数据
  useEffect(() => {
    if (currentUser?.id) {
      fetchStudents();
    }
  }, [currentUser?.id]);

  // 判斷某個日期是否整天都被booked
  const isDateFullyBooked = (date) => {
    if (!busySlots || busySlots.length === 0) return false;
    return busySlots.some(slot => {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      return (
        start.toDateString() === date.toDateString() &&
        end.toDateString() === date.toDateString() &&
        end - start >= 24 * 60 * 60 * 1000 // 一整天
      );
    });
  };
  // 判斷某個時間是否被booked
  const isTimeBooked = (date) => {
    if (!busySlots || busySlots.length === 0) return false;
    return busySlots.some(slot => {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      return date >= start && date < end;
    });
  };

  // Fetch coach's class sessions for the current month on mount
  useEffect(() => {
    const fetchSessions = async () => {
      setLoadingSessions(true);
      setSessionError('');
      try {
        // 先調用調試端點
        const debugData = await CoachService.getDebugSessions();
        console.log('Debug data:', debugData);
        
        // Fetch all sessions: use a very early start and far future end
        const start = new Date(2000, 0, 1, 0, 0, 0); // Jan 1, 2000
        const end = new Date(2100, 11, 31, 23, 59, 59); // Dec 31, 2100
        const data = await CoachService.getScheduleWithRegistrations(start.toISOString(), end.toISOString());
        console.log('Fetched sessions data:', data); // 調試信息
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching sessions:', err); // 調試信息
        setSessionError('Failed to load sessions.');
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  // Fetch replacement classes
  useEffect(() => {
    const fetchReplacements = async () => {
      try {
        if (currentUser && currentUser.id) {
          const data = await ClassSessionService.getReplacementClasses(currentUser.id);
          setReplacementClasses(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load replacement classes:', err);
      }
    };
    fetchReplacements();
  }, [currentUser]);

  // Fetch unread messages count
  useEffect(() => {
    fetchUnreadMessages();
  }, []);

  // Fetch leave requests
  useEffect(() => {
    fetchLeaveRequests();
  }, [currentUser]);

  // Fetch unattended classes
  useEffect(() => {
    fetchUnattendedClasses();
  }, [sessions]);

  const fetchUnattendedClasses = async () => {
    try {
      if (!sessions || sessions.length === 0) return;
      
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      
      // 過濾出今天的課程，且還沒有記錄出勤的
      const unattended = sessions.filter(session => {
        const sessionDate = new Date(session.startTime).toISOString().slice(0, 10);
        const isToday = sessionDate === todayStr;
        
        // 檢查是否有學生註冊且沒有記錄出勤
        const hasRegistrations = session.registrations && session.registrations.length > 0;
        const hasUnrecordedAttendance = hasRegistrations && session.registrations.some(reg => 
          !reg.attendanceStatus || reg.attendanceStatus === 'NOT_RECORDED' || reg.attendanceStatus === null
        );
        
        // 課程狀態檢查
        const isCompleted = session.status === 'completed' || session.status === 'COMPLETED';
        const isCancelled = session.status === 'cancelled' || session.status === 'CANCELLED';
        
        console.log('Session check:', {
          sessionId: session.id,
          sessionDate,
          isToday,
          hasRegistrations,
          hasUnrecordedAttendance,
          isCompleted,
          isCancelled,
          registrations: session.registrations
        });
        
        return isToday && hasRegistrations && hasUnrecordedAttendance && !isCompleted && !isCancelled;
      });
      
      setUnattendedClasses(unattended);
      setUnattendedClassesCount(unattended.length);
      
      console.log('Unattended classes:', unattended);
    } catch (error) {
      console.error('Error fetching unattended classes:', error);
    }
  };

  // Fetch courts and venues data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('=== Fetching courts and venues ===');
        
          // 獲取認證令牌
          const token = localStorage.getItem('authToken');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
        console.log('Using token:', token ? 'Token exists' : 'No token');
        
        // 強制使用教練專用的 API
        let courtsResponse, venuesResponse;
        
        try {
          console.log('Trying coach endpoints...');
          [courtsResponse, venuesResponse] = await Promise.all([
            api.get('/coach/all-courts', { headers }),
            api.get('/coach/all-venues', { headers })
          ]);
          console.log('Successfully fetched from coach endpoints');
        } catch (coachError) {
          console.error('Coach endpoints failed:', coachError.response?.status, coachError.response?.data);
          
          // 如果教練端點失敗，嘗試公開的 API
          try {
            console.log('Trying public endpoints...');
          [courtsResponse, venuesResponse] = await Promise.all([
              api.get('/courts'),
              api.get('/venues')
          ]);
          console.log('Successfully fetched from public endpoints');
          } catch (publicError) {
            console.error('Public endpoints also failed:', publicError.response?.status, publicError.response?.data);
            throw publicError;
          }
        }
        
        console.log('Courts response:', courtsResponse.data);
        console.log('Venues response:', venuesResponse.data);
        
        setCourts(Array.isArray(courtsResponse.data) ? courtsResponse.data : []);
        setVenues(Array.isArray(venuesResponse.data) ? venuesResponse.data : []);
        
        console.log('Set courts:', courtsResponse.data);
        console.log('Set venues:', venuesResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        console.error('Error details:', error.response?.data);
        
        // 如果所有 API 都失敗，創建一些測試數據
        console.log('Creating fallback test data');
        const testVenues = [
          { id: 1, name: 'Sunway Arena', state: 'Selangor' },
          { id: 2, name: 'Sports Complex', state: 'Selangor' }
        ];
        
        const testCourts = [
          { id: 1, name: 'Main Court', venue: testVenues[0] },
          { id: 2, name: 'Premium Court', venue: testVenues[1] }
        ];
        
        setVenues(testVenues);
        setCourts(testCourts);
      }
    };
    fetchData();
  }, []);

  // 計算 Dashboard 統計數據
  useEffect(() => {
    console.log('Sessions data for calculation:', sessions); // 調試信息
    if (sessions.length > 0) {
      // 計算總學生數（去重）- 只計算預訂了教練課程的用戶
      const uniqueStudents = new Set();
      const studentMap = new Map(); // 用於存儲學生詳細信息
      
      console.log('=== DETAILED SESSION ANALYSIS ===');
      console.log('Total sessions to process:', sessions.length);
      console.log('Current user ID:', currentUser?.id);
      console.log('Current user type:', currentUser?.userType);
      console.log('Current user username:', currentUser?.username);
      
      // 只計算屬於當前教練的課程的學生
      sessions.forEach((session, sessionIndex) => {
        console.log(`\n--- Session ${sessionIndex + 1} ---`);
        console.log('Session ID:', session.id);
        console.log('Session title:', session.title);
        console.log('Session coach ID:', session.coachId);
        console.log('Session coach:', session.coach);
        console.log('Session coach ID (from coach object):', session.coach?.id);
        console.log('Current user ID:', currentUser?.id);
        console.log('Registrations count:', session.registrations?.length || 0);
        
        // 檢查所有課程，不管是否屬於當前教練，先看看數據結構
        if (session.registrations && session.registrations.length > 0) {
          console.log('  📋 Found registrations, checking data structure...');
          session.registrations.forEach((reg, regIndex) => {
            console.log(`\n  Registration ${regIndex + 1} FULL DATA:`, JSON.stringify(reg, null, 2));
            console.log(`  Registration ${regIndex + 1} memberId:`, reg.memberId);
            console.log(`  Registration ${regIndex + 1} id:`, reg.id);
            console.log(`  Registration ${regIndex + 1} userId:`, reg.userId);
            console.log(`  Registration ${regIndex + 1} member:`, reg.member);
            
            // 嘗試不同的字段來獲取 memberId
            const studentId = reg.memberId || reg.member?.id || reg.id || reg.userId;
            console.log(`  Student ID extracted: ${studentId}`);
            
            // 檢查是否屬於當前教練 - 嘗試多種可能的字段
            const sessionCoachId = session.coachId || session.coach?.id;
            const belongsToCurrentCoach = sessionCoachId === currentUser?.id;
            console.log(`  Session coach ID: ${sessionCoachId}`);
            console.log(`  Current user ID: ${currentUser?.id}`);
            console.log(`  Belongs to current coach: ${belongsToCurrentCoach}`);
            
            if (studentId) {
              // 暫時移除教練過濾，先收集所有學生
              uniqueStudents.add(studentId);
              
              // 嘗試獲取用戶名，添加更多調試信息
              const possibleNames = [
                reg.username,
                reg.name,
                reg.memberName,
                reg.userName,
                reg.member?.name,
                reg.member?.username,
                reg.user?.name,
                reg.user?.username
              ];
              const studentName = possibleNames.find(name => name && name.trim() !== '') || 'Unknown Student';
              
              console.log(`  Possible names for student ${studentId}:`, possibleNames);
              console.log(`  Selected name: ${studentName}`);
              
              if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                  id: studentId,
                  name: studentName,
                  level: 'Beginner',
                  sessionCount: 1,
                  progress: 0,
                  status: 'active',
                  belongsToCoach: belongsToCurrentCoach // 記錄是否屬於當前教練
                });
                console.log(`  ✅ Added new student: ${studentId} - ${studentName} (belongs to coach: ${belongsToCurrentCoach})`);
              } else {
                const existingStudent = studentMap.get(studentId);
                existingStudent.sessionCount += 1;
                existingStudent.belongsToCoach = existingStudent.belongsToCoach || belongsToCurrentCoach;
                // 如果現有學生名稱是 "Unknown Student"，但有新的名稱，則更新
                if (existingStudent.name === 'Unknown Student' && studentName !== 'Unknown Student') {
                  existingStudent.name = studentName;
                }
                console.log(`  ✅ Updated existing student: ${studentId} - ${existingStudent.name}, session count: ${existingStudent.sessionCount} (belongs to coach: ${existingStudent.belongsToCoach})`);
              }
            } else {
              console.log('  ❌ No valid student ID found');
            }
          });
        } else {
          console.log('  ❌ No registrations for this session');
        }
      });

      console.log('Unique students count:', uniqueStudents.size); // 調試信息
      console.log('Student map size:', studentMap.size); // 調試信息
      console.log('Student IDs:', Array.from(uniqueStudents)); // 調試信息

      // 計算每個學生的進度
      studentMap.forEach((student, studentId) => {
        const studentSessions = sessions.filter(s => 
          s.registrations && s.registrations.some(reg => (reg.memberId || reg.id) === studentId)
        );
        const completedCount = studentSessions.filter(s => s.status === 'COMPLETED').length;
        student.progress = studentSessions.length > 0 ? Math.round((completedCount / studentSessions.length) * 100) : 0;
      });

      // 設置學生列表（保留原有的session-based计算作为备用）
      // setStudentList(Array.from(studentMap.values()));

      // 計算近兩天的課程
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = today.toISOString().slice(0, 10);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      
      const upcomingSessions = sessions.filter(session => {
        if (!session.startTime) return false;
        const sessionDate = new Date(session.startTime).toISOString().slice(0, 10);
        return sessionDate === todayStr || sessionDate === tomorrowStr;
      });

      console.log('Upcoming sessions count:', upcomingSessions.length); // 調試信息

      // 計算完成率
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

      console.log('Total sessions:', totalSessions, 'Completed:', completedSessions, 'Rate:', completionRate); // 調試信息

      // 計算平均評分（暫時設為 4.8，因為沒有評分數據）
      const averageRating = 4.8;

      // 計算總收入（所有課程的價格總和）
      const totalRevenue = sessions.reduce((sum, session) => {
        const sessionPrice = session.price || 0;
        const studentCount = session.registrations ? session.registrations.length : 0;
        return sum + (sessionPrice * studentCount);
      }, 0);

      // 只計算屬於當前教練的學生
      const coachStudents = Array.from(studentMap.values()).filter(student => student.belongsToCoach);
      const actualTotalStudents = coachStudents.length;
      
      console.log('=== DEBUG: Student Count ===');
      console.log('All unique students:', uniqueStudents.size);
      console.log('All student map entries:', studentMap.size);
      console.log('Students belonging to current coach:', actualTotalStudents);
      console.log('Coach students:', coachStudents.map(s => ({ id: s.id, name: s.name, belongsToCoach: s.belongsToCoach })));
      console.log('All sessions count:', sessions.length);
      console.log('Sessions with registrations:', sessions.filter(s => s.registrations && s.registrations.length > 0).length);
      
      // 更新dashboard统计（保留session-based计算作为备用，但优先使用API数据）
      const stats = {
        totalStudents: dashboardStats.totalStudents || actualTotalStudents, // 优先使用API数据
        totalSessions: totalSessions, // 總課程數量
        totalRevenue: totalRevenue, // 總收入
        upcomingSessions: upcomingSessions.length, // 即將到來的課程
        completionRate,
        averageRating
      };
      
      console.log('Final stats object:', stats);
      console.log('Setting dashboardStats with totalStudents:', stats.totalStudents);
      
      // 強制重置狀態，確保數據是最新的
      setDashboardStats({
        totalStudents: stats.totalStudents,
        totalSessions: totalSessions,
        totalRevenue: totalRevenue,
        upcomingSessions: upcomingSessions.length,
        completionRate,
        averageRating
      });
      
      console.log('Dashboard stats set successfully');

      // 設置近兩天的課程列表
      const upcomingSessionsData = upcomingSessions.slice(0, 6).map(session => {
        const sessionDate = new Date(session.startTime);
        const isToday = sessionDate.toISOString().slice(0, 10) === todayStr;
        const dateLabel = isToday ? 'Today' : 'Tomorrow';
        
        return {
          id: session.id,
          date: dateLabel,
          time: session.startTime ? sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          student: session.registrations ? session.registrations.length + ' students' : '0 students',
          type: session.slotType || session.title || 'Session',
          status: session.status || 'Scheduled'
        };
      });
      setTodaySessionsList(upcomingSessionsData);

      // 設置學生進度列表（使用API数据）
      const studentProgressData = studentList.slice(0, 3).map(student => {
        // 计算学生的实际进度
        let totalSessions = 0;
        let completedSessions = 0;
        
        sessions.forEach(session => {
          if (session.registrations) {
            const studentRegistration = session.registrations.find(reg => 
              (reg.memberId || reg.id) === student.id
            );
            if (studentRegistration) {
              totalSessions++;
              // 检查session是否已完成
              const isCompleted = session.status === 'COMPLETED' || 
                                 session.status === 'completed' || 
                                 session.attendanceTaken === true ||
                                 (session.registrations && session.registrations.some(reg => reg.attendanceStatus));
              if (isCompleted) {
                completedSessions++;
              }
            }
          }
        });
        
        const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
        
        return {
          id: student.id,
          name: student.name,
          progress: progress
        };
      });
      setStudentProgressList(studentProgressData);
    } else {
      console.log('No sessions data available'); // 調試信息
      // 設置默認值（保留API获取的学生数量）
      setDashboardStats(prev => ({
        ...prev,
        totalSessions: 0,
        totalRevenue: 0,
        upcomingSessions: 0,
        completionRate: 0,
        averageRating: 4.8
      }));
      setTodaySessionsList([]);
      setStudentProgressList([]);
      // 不重置studentList，因为它是从API获取的
    }
  }, [sessions, studentList]); // 添加studentList作为依赖

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    // 移除 navigate('/coaching/students')，直接切換 tab
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType('');
  };

  const handleExpandClick = (groupId) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, value: 'dashboard' },
    { text: 'Student Management', icon: <People />, value: 'students' },
    { text: 'Session Schedule', icon: <Schedule />, value: 'schedule' },
    { text: 'Messages', icon: <Message />, value: 'messages' },
    { text: 'Leave Requests', icon: <Assessment />, value: 'leave-requests' },
    { text: 'Income History', icon: <AttachMoney />, value: 'income' },
    { text: 'Analytics', icon: <Assessment />, value: 'analytics' },
    { text: 'Settings', icon: <Settings />, value: 'settings' }
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Coach System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.value} disablePadding>
            <ListItemButton 
              selected={selectedTab === item.value}
              onClick={() => handleTabChange(item.value)}
            >
              <ListItemIcon sx={{ color: selectedTab === item.value ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
              {item.value === 'messages' && unreadMessages > 0 && (
                <Badge badgeContent={unreadMessages} color="error" sx={{ ml: 1 }} />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  const renderDashboard = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.text.primary }}>
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.totalStudents}</Typography>
                  <Typography variant="body2">Total Students</Typography>
                </Box>
                <Person sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.totalSessions}</Typography>
                  <Typography variant="body2">Total Sessions</Typography>
                </Box>
                <School sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.upcomingSessions}</Typography>
                  <Typography variant="body2">Upcoming Sessions</Typography>
                </Box>
                <CalendarToday sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.completionRate}%</Typography>
                  <Typography variant="body2">Completion Rate</Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.averageRating}</Typography>
                  <Typography variant="body2">Average Rating</Typography>
                </Box>
                <Star sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>RM {dashboardStats.totalRevenue?.toFixed(2) || '0.00'}</Typography>
                  <Typography variant="body2">Total Revenue</Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 補課請求提醒 */}
      {pendingRequestCount > 0 && (
        <Card sx={{ 
          mb: 3, 
          backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#fff3cd', 
          border: `1px solid ${theme.palette.mode === 'dark' ? '#424242' : '#ffeaa7'}` 
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Typography variant="h6" sx={{ 
                  color: theme.palette.mode === 'dark' ? '#ffb74d' : '#856404', 
                  fontWeight: 'bold' 
                }}>
                  ⚠️ Makeup Class Requests ({pendingRequestCount})
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="warning"
                onClick={() => handleTabChange('leave-requests')}
              >
                View Requests
              </Button>
            </Box>
            <Typography variant="body2" sx={{ 
              color: theme.palette.mode === 'dark' ? '#ffb74d' : '#856404', 
              mt: 1 
            }}>
              You have {pendingRequestCount} pending makeup class request{pendingRequestCount > 1 ? 's' : ''} that need your attention.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* 出勤記錄提醒 */}
      {unattendedClassesCount > 0 && (
        <Card sx={{ 
          mb: 3, 
          backgroundColor: theme.palette.mode === 'dark' ? '#1a237e' : '#d1ecf1', 
          border: `1px solid ${theme.palette.mode === 'dark' ? '#3949ab' : '#bee5eb'}` 
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle sx={{ color: theme.palette.mode === 'dark' ? '#64b5f6' : '#0c5460' }} />
                  <Typography variant="h6" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#64b5f6' : '#0c5460', 
                    fontWeight: 'bold' 
                  }}>
                    Attendance Not Recorded ({unattendedClassesCount})
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="contained" 
                color="info"
                onClick={() => handleTabChange('students')}
              >
                Take Attendance
              </Button>
            </Box>
            <Typography variant="body2" sx={{ 
              color: theme.palette.mode === 'dark' ? '#64b5f6' : '#0c5460', 
              mt: 1 
            }}>
              You have {unattendedClassesCount} class{unattendedClassesCount > 1 ? 'es' : ''} today that need attendance to be recorded.
            </Typography>
            {/* 顯示具體的課程信息 */}
            <Box sx={{ mt: 2 }}>
              {unattendedClasses.slice(0, 3).map((session, index) => {
                const studentCount = session.registrations ? session.registrations.length : 0;
                const unrecordedCount = session.registrations ? 
                  session.registrations.filter(reg => 
                    !reg.attendanceStatus || reg.attendanceStatus === 'NOT_RECORDED' || reg.attendanceStatus === null
                  ).length : 0;
                
                return (
                  <Typography key={index} variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#64b5f6' : '#0c5460', 
                    opacity: 0.8 
                  }}>
                    • {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {session.title || 'Class Session'} ({unrecordedCount}/{studentCount} students)
                  </Typography>
                );
              })}
              {unattendedClasses.length > 3 && (
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'dark' ? '#64b5f6' : '#0c5460', 
                  opacity: 0.8 
                }}>
                  • ... and {unattendedClasses.length - 3} more
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="primary" />
                Upcoming Sessions (Next 2 Days)
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Session Type</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todaySessionsList.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <Chip 
                            label={session.date} 
                            color={session.date === 'Today' ? 'primary' : 'secondary'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{session.time}</TableCell>
                        <TableCell>{session.student}</TableCell>
                        <TableCell>{session.type}</TableCell>
                        <TableCell>
                          <Chip 
                            label={session.status === 'completed' ? 'Completed' : 'Scheduled'} 
                            color={session.status === 'completed' ? 'success' : 'primary'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FitnessCenter color="primary" />
                Student Progress Overview
              </Typography>
              {studentProgressList.map((student) => (
                <Box key={student.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{student.name}</Typography>
                    <Typography variant="body2">{student.progress}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={student.progress} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* 錢包餘額卡片 */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWallet color="primary" />
                Wallet Balance
              </Typography>
              {walletBalance ? (
                <Box>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    RM {walletBalance.balance?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Status: {walletBalance.walletStatus || 'Active'}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => handleTabChange('income')}
                  >
                    View History
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Loading wallet information...
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* 收入統計卡片 */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="primary" />
                Income Overview
              </Typography>
              {incomeHistory.length > 0 ? (
                <Box>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    RM {incomeHistory.reduce((sum, record) => sum + (record.amount || 0), 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Total Income ({incomeHistory.length} records)
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => handleTabChange('income')}
                  >
                    View Details
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No income records yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Replacement Classes 移到下面 */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">Replacement Classes</Typography>
              {replacementClasses.length === 0 ? (
                <Typography color="text.secondary">No replacement classes scheduled.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Venue</TableCell>
                        <TableCell>Court</TableCell>
                        <TableCell>Title</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {replacementClasses.map(cls => (
                        <TableRow key={cls.id}>
                          <TableCell>{cls.startTime ? new Date(cls.startTime).toLocaleDateString() : ''}</TableCell>
                          <TableCell>{cls.startTime ? new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} - {cls.endTime ? new Date(cls.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</TableCell>
                          <TableCell>{cls.venue?.name || cls.venueName || '-'}</TableCell>
                          <TableCell>{cls.court?.name || cls.courtName || '-'}</TableCell>
                          <TableCell>{cls.title}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderStudents = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Student Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => handleOpenDialog('addStudent')}
          sx={{ borderRadius: 2 }}
        >
          Add Student
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {studentList.map((student) => (
          <Grid item xs={12} sm={6} md={3} lg={2} key={student.id}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {student.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{student.name}</Typography>
                    <Chip 
                      label={student.level} 
                      size="small" 
                      color="secondary"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Chip 
                    label={student.status === 'active' ? 'Active' : 'Inactive'} 
                    color={student.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completed Sessions: {student.sessionCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Learning Progress: {student.progress ?? 60}%
                  </Typography>
                  <LinearProgress variant="determinate" value={student.progress ?? 60} sx={{ mb: 2 }} />
                  <Box display="flex" gap={1}>
                    <Button size="small" variant="outlined">Edit</Button>
                    <Button size="small" variant="text">Schedule Session</Button>
                  </Box>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button size="small" startIcon={<Edit />}>Edit</Button>
                <Button size="small" startIcon={<Schedule />}>Schedule Session</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderSchedule = (tab, handleTabChange) => {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Session Schedule</Typography>
        </Box>
        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Session Table" />
          <Tab label="Coach Schedule Management" />
        </Tabs>
        {tab === 0 && (
          <Card>
            <CardContent>
              {loadingSessions ? (
                <Typography>Loading sessions...</Typography>
              ) : sessionError ? (
                <Typography color="error">{sessionError}</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell />
                        <TableCell>Title</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Venue</TableCell>
                        <TableCell>Court</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Total Sessions</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        // Helper: get date part (YYYY-MM-DD) from ISO string
                        const getDatePart = (iso) => new Date(iso).toISOString().slice(0, 10);
                        // Group by recurringGroupId (or session id if not recurring)
                        const grouped = {};
                        sessions.forEach(session => {
                          const key = session.recurringGroupId || session.id;
                          if (!grouped[key]) grouped[key] = [];
                          grouped[key].push(session);
                        });
                        return Object.values(grouped).map(group => {
                          const first = group[0];
                          const start = new Date(first.startTime);
                          const end = new Date(first.endTime);
                          const groupKey = first.recurringGroupId || first.id;
                          const expanded = expandedGroups.includes(groupKey);
                          return (
                            <React.Fragment key={groupKey}>
                              <TableRow>
                                <TableCell>
                                  <IconButton size="small" onClick={() => handleExpandClick(groupKey)}>
                                    {expanded ? '-' : '+'}
                                  </IconButton>
                                </TableCell>
                                <TableCell>{first.title}</TableCell>
                                <TableCell>{first.slotType || first.type || '-'}</TableCell>
                                <TableCell>
                                  <Chip label={first.status || 'Scheduled'} color={first.status === 'completed' || first.status === 'COMPLETED' ? 'success' : 'primary'} size="small" />
                                </TableCell>
                                <TableCell>{first.venueName || first.venue?.name || '-'}</TableCell>
                                <TableCell>{first.courtName || first.court?.name || '-'}</TableCell>
                                <TableCell>{start.toLocaleDateString()}</TableCell>
                                <TableCell>{end.toLocaleDateString()}</TableCell>
                                <TableCell>{group.length}</TableCell>
                                <TableCell align="center">
                                  <IconButton size="small" color="primary">
                                    <Edit />
                                  </IconButton>
                                  <IconButton size="small" color="error">
                                    <Delete />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                                    <Box margin={1}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Start Time</TableCell>
                                            <TableCell>End Time</TableCell>
                                            <TableCell>Status</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {group.map((sess) => (
                                            <TableRow key={sess.id}>
                                              <TableCell>{new Date(sess.startTime).toLocaleDateString()}</TableCell>
                                              <TableCell>{new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                              <TableCell>{new Date(sess.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                              <TableCell>
                                                <Chip label={sess.status || 'Scheduled'} size="small" color={sess.status === 'CANCELLED' ? 'primary' : 'success'} />
                                                {sess.status === 'CANCELLED' && (
                                                  hasReplacement(sess.id) ? (
                                                    <Chip label="Replacement scheduled" color="success" />
                                                  ) : (
                                                    <>
                                                      <Chip label="No replacement scheduled" color="error" />
                                                      <Button variant="outlined" color="warning" onClick={() => handleBookReplacement(sess)} style={{ marginLeft: 8 }}>
                                                        BOOK REPLACEMENT
                                                      </Button>
                                                    </>
                                                  )
                                                )}
                                              </TableCell>
                                              {/* 新增 Cancel 按鈕 */}
                                              <TableCell>
                                                <IconButton color="error" size="small" onClick={() => handleCancelSession(sess.id, sess)}>
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}
        {tab === 1 && (
          <CoachScheduleManagement />
        )}
      </Box>
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'dashboard':
        return renderDashboard();
      case 'students':
        return <StudentManagementSystem />;
      case 'schedule':
        return renderSchedule(scheduleTab, (e, v) => setScheduleTab(v));
      case 'messages':
        return <MessagingPage />;
      case 'leave-requests':
        return renderLeaveRequests();
      case 'income':
        return renderIncomeHistory();
      case 'analytics':
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Analytics</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>Analytics feature under development...</Typography>
          </Box>
        );
      case 'settings':
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>System Settings</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>System settings feature under development...</Typography>
          </Box>
        );
      case 'student-management':
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Student Management</Typography>
            {loadingStudents ? (
              <Typography>Loading students...</Typography>
            ) : studentError ? (
              <Typography color="error">{studentError}</Typography>
            ) : (
              <Box display="flex" flexWrap="wrap" gap={3}>
                {studentList.map(student => (
                  <Card key={student.id} sx={{ width: 280 }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                          {student.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{student.name}</Typography>
                          <Chip label={student.level || 'Beginner'} color="primary" size="small" sx={{ mr: 1 }} />
                          <Chip label={student.status || 'Active'} color={(student.status || 'Active') === 'Active' ? 'success' : 'default'} size="small" />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Completed Sessions: {student.sessionCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Learning Progress: {student.progress ?? 60}%
                      </Typography>
                      <LinearProgress variant="determinate" value={student.progress ?? 60} sx={{ mb: 2 }} />
                      <Box display="flex" gap={1}>
                        <Button size="small" variant="outlined">Edit</Button>
                        <Button size="small" variant="text">Schedule Session</Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        );
      default:
        return renderDashboard();
    }
  };

  // 新增：取消課程
  const handleCancelSession = async (sessionId, sessionObj) => {
    if (!window.confirm("Are you sure you want to cancel this session?")) return;
    try {
      await ClassSessionService.cancelSession(sessionId);
      setCancelSuccess(true);
      setCancelMessage('Session cancelled successfully!');
      setCancelledSessionObj(sessionObj);
    } catch (e) {
      const errorMessage = e?.response?.data?.error || e.message;
      if (errorMessage.includes('force=true') || errorMessage.includes('24 hours')) {
        setForceCancelSessionId(sessionId);
        setCancelledSessionObj(sessionObj);
        setShowForceCancelDialog(true);
      } else {
        alert("Cancellation failed: " + errorMessage);
      }
    }
  };

  const handleForceCancel = async () => {
    try {
      await ClassSessionService.cancelSession(forceCancelSessionId, cancelReason, true);
      setShowForceCancelDialog(false);
      setCancelSuccess(true);
      setCancelMessage('Session force-cancelled successfully!');
    } catch (e) {
      alert("Force cancellation failed: " + (e?.response?.data?.error || e.message));
    }
  };

  const handleMakeupInputChange = (e) => {
    setMakeupSessionData({ ...makeupSessionData, [e.target.name]: e.target.value });
  };

  // 新增：多選連續時段
  const handleMakeupSlotSelect = (slot) => {
    if (!makeupSessionData.selectedSlots) {
      setMakeupSessionData({ ...makeupSessionData, selectedSlots: [slot], startTime: slot.start, endTime: slot.end });
      return;
    }
    const selected = makeupSessionData.selectedSlots;
    // 已選中則取消
    if (selected.some(s => s.start === slot.start && s.end === slot.end)) {
      const newSelected = selected.filter(s => !(s.start === slot.start && s.end === slot.end));
      let startTime = newSelected.length ? newSelected[0].start : '';
      let endTime = newSelected.length ? newSelected[newSelected.length - 1].end : '';
      setMakeupSessionData({ ...makeupSessionData, selectedSlots: newSelected, startTime, endTime });
      return;
    }
    // 只允許連續
    const all = [...selected, slot].sort((a, b) => a.start.localeCompare(b.start));
    let isConsecutive = true;
    for (let i = 1; i < all.length; i++) {
      const prev = parseInt(all[i - 1].end.replace(':', ''), 10);
      const curr = parseInt(all[i].start.replace(':', ''), 10);
      if (curr !== prev) {
        isConsecutive = false;
        break;
      }
    }
    if (!isConsecutive) return;
    setMakeupSessionData({
      ...makeupSessionData,
      selectedSlots: all,
      startTime: all[0].start,
      endTime: all[all.length - 1].end
    });
  };

  // 定義 fetchSessions 並設置到 state 供 handleCreateMakeupSession 使用
  const [fetchSessionsRef, setFetchSessionsRef] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoadingSessions(true);
      setSessionError('');
      try {
        const start = new Date(2000, 0, 1, 0, 0, 0);
        const end = new Date(2100, 11, 31, 23, 59, 59);
        const data = await CoachService.getSchedule(start.toISOString(), end.toISOString());
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        setSessionError('Failed to load sessions.');
      } finally {
        setLoadingSessions(false);
      }
    };
    setFetchSessionsRef(() => fetchSessions);
    fetchSessions();
  }, []);

  // 在 handleCreateMakeupSession 時自動帶入 startTime/endTime
  const handleCreateMakeupSession = async () => {
    try {
      const origin = sessions.find(s => s.id === makeupOriginSession?.id);
      // 組合正確的 LocalDateTime 格式
      let startTime = makeupSessionData.startTime;
      let endTime = makeupSessionData.endTime;
      if (makeupSessionData.date && makeupSessionData.selectedSlots && makeupSessionData.selectedSlots.length > 0) {
        startTime = `${makeupSessionData.date}T${makeupSessionData.selectedSlots[0].start}:00`;
        endTime = `${makeupSessionData.date}T${makeupSessionData.selectedSlots[makeupSessionData.selectedSlots.length - 1].end}:00`;
      }
      const payload = {
        ...makeupSessionData,
        courtId: origin?.court?.id,
        maxParticipants: origin?.maxParticipants,
        title: makeupSessionData.title || (origin?.title ? origin.title + ' (Make-up)' : 'Make-up Session'),
        description: makeupSessionData.description || (origin?.description || ''),
        startTime,
        endTime,
        price: 0,
      };
      // 帶上 makeupForSessionId
      await ClassSessionService.createClassSession(payload, makeupOriginSession?.id);
      alert('Make-up session created and students will be notified!');
      setShowMakeupDialog(false);
      // 自動刷新 sessions，讓 UI 立即變更
      if (fetchSessionsRef) fetchSessionsRef(); else window.location.reload();
    } catch (e) {
      alert('Failed to create make-up session: ' + (e?.response?.data?.error || e.message));
    }
  };

  // 判斷這堂課有沒有 replacement
  const hasReplacement = (sessionId) => {
    return sessions.some(s => s.replacementForSessionId === sessionId);
  };

  // 取得營業時間範圍，預設 8:00~22:00
  const getHourRange = () => {
    let open = 8, close = 22;
    const court = sessions.find(s => s.id === makeupOriginSession?.id)?.court;
    if (court && court.openingTime && court.closingTime) {
      open = parseInt(court.openingTime.split(':')[0], 10);
      close = parseInt(court.closingTime.split(':')[0], 10);
      if (isNaN(open)) open = 8;
      if (isNaN(close)) close = 22;
    }
    return { open, close };
  };
  const { open, close } = getHourRange();
  const hourSlots = [];
  for (let h = open; h < close; h++) {
    const start = (h < 10 ? '0' : '') + h + ':00';
    const end = (h + 1 < 10 ? '0' : '') + (h + 1) + ':00';
    hourSlots.push({ start, end });
  }
  const availableSlotSet = new Set(busySlots ? busySlots.map(s => s.start + '-' + s.end) : []);

  // 新增：BOOK REPLACEMENT 按鈕 handler
  const handleBookReplacement = (session) => {
    setMakeupOriginSession(session);
    setShowMakeupDialog(true);
  };

  const [commentDialog, setCommentDialog] = useState({ open: false, request: null, action: '' });
  const [coachComment, setCoachComment] = useState('');
  const [bookReplacementDialog, setBookReplacementDialog] = useState({ open: false, request: null });
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [courts, setCourts] = useState([]);
  const [venues, setVenues] = useState([]);
  const [replacementSessionData, setReplacementSessionData] = useState({
    title: '',
    description: '',
    venueId: '',
    venueName: '',
    state: '',
    courtId: '',
    startTime: '',
    endTime: '',
    maxParticipants: 6,
    price: '',
    slotType: 'COACH_SESSION',
    date: '',
    availableSlots: [],
    selectedSlots: [], // 改為數組，支持多選連續時段
    selectedSlot: ''
  });

  const handleApproveRequest = async (request) => {
    setCommentDialog({ open: true, request, action: 'approve' });
    setCoachComment('');
  };

  const handleDeclineRequest = async (request) => {
    setCommentDialog({ open: true, request, action: 'decline' });
    setCoachComment('');
  };

  const handleSubmitComment = async () => {
    try {
      const { request, action } = commentDialog;
      if (action === 'approve') {
        await LeaveRequestService.approveRequest(request.id, null, coachComment);
      } else {
        await LeaveRequestService.declineRequest(request.id, coachComment);
      }
      setCommentDialog({ open: false, request: null, action: '' });
      setCoachComment('');
      fetchLeaveRequests();
    } catch (error) {
      console.error('Failed to process request:', error);
    }
  };

  // 獲取指定日期的可用時段
  const getAvailableSlotsForDate = async (dateStr, courtId) => {
    try {
      console.log('=== getAvailableSlotsForDate ===');
      console.log('Date:', dateStr, 'Court ID:', courtId);
      
      // 獲取球場的營業時間
      const court = courts.find(c => c.id === courtId);
      if (!court) {
        console.error('Court not found for ID:', courtId);
        return [];
      }

      console.log('Found court:', court);

      // 解析營業時間
      const openingHour = court.openingTime ? parseInt(court.openingTime.split(':')[0]) : 8;
      const closingHour = court.closingTime ? parseInt(court.closingTime.split(':')[0]) : 22;
      
      console.log('Court operating hours:', openingHour, 'to', closingHour);

      // 獲取該日期的已預訂時段
      let bookedSlots = [];
      if (courtId && dateStr) {
        try {
          const token = localStorage.getItem('authToken');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
          const response = await api.get('/coach/available-times', {
            params: { courtId, date: dateStr },
            headers
          });
          bookedSlots = Array.isArray(response.data) ? response.data : [];
          console.log('Booked slots from API:', bookedSlots);
        } catch (error) {
          console.error('Failed to fetch booked slots:', error);
          console.error('Error details:', error.response?.data);
          
          // 如果 API 失敗，創建一些測試的已預訂時段
          console.log('Creating fallback booked slots for testing');
          bookedSlots = [
            { start: `${dateStr}T10:00:00`, end: `${dateStr}T12:00:00` }, // 10:00-12:00 被預訂
            { start: `${dateStr}T14:00:00`, end: `${dateStr}T16:00:00` }  // 14:00-16:00 被預訂
          ];
        }
      }

      // 生成所有時段
      const allSlots = [];
      for (let hour = openingHour; hour < closingHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        const slotKey = `${startTime}-${endTime}`;
        
        // 檢查是否被預訂
        const isBooked = bookedSlots.some(bookedSlot => {
          const bookedStart = new Date(bookedSlot.start);
          const bookedEnd = new Date(bookedSlot.end);
          const slotStart = new Date(`${dateStr}T${startTime}:00`);
          const slotEnd = new Date(`${dateStr}T${endTime}:00`);
          
          // 檢查時間重疊
          const hasOverlap = slotStart < bookedEnd && slotEnd > bookedStart;
          if (hasOverlap) {
            console.log(`Slot ${startTime}-${endTime} overlaps with booked slot ${bookedStart.toTimeString()}-${bookedEnd.toTimeString()}`);
          }
          return hasOverlap;
        });

        allSlots.push({
          time: slotKey,
          startTime: startTime,
          endTime: endTime,
          isBooked: isBooked
        });
      }

      console.log('Generated slots with booking status:', allSlots);
      return allSlots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  };

  // 處理多選時間段
  const handleSlotSelection = (slot) => {
    console.log('=== handleSlotSelection ===');
    console.log('Selected slot:', slot);
    console.log('Current selectedSlots:', replacementSessionData.selectedSlots);
    console.log('Original duration:', replacementSessionData.originalDuration);
    
    const currentSelected = replacementSessionData.selectedSlots;
    const requiredSlots = Math.ceil(replacementSessionData.originalDuration); // 需要的時間段數量
    
    // 檢查是否已經選中
    const isAlreadySelected = currentSelected.some(s => s.time === slot.time);
    
    if (isAlreadySelected) {
      // 如果已選中，則取消選中
      const newSelected = currentSelected.filter(s => s.time !== slot.time);
      console.log('Removing slot, new selected:', newSelected);
      
      // 更新開始和結束時間
      let newStartTime = '';
      let newEndTime = '';
      if (newSelected.length > 0) {
        newStartTime = `${replacementSessionData.date}T${newSelected[0].startTime}:00`;
        newEndTime = `${replacementSessionData.date}T${newSelected[newSelected.length - 1].endTime}:00`;
      }
      
      setReplacementSessionData({
        ...replacementSessionData,
        selectedSlots: newSelected,
        startTime: newStartTime,
        endTime: newEndTime
      });
    } else {
      // 檢查是否已經達到所需時間段數量
      if (currentSelected.length >= requiredSlots) {
        console.log(`Already selected ${currentSelected.length} slots, need ${requiredSlots}. Replacing selection.`);
        // 如果已達到所需數量，清空選擇並從新時段開始
        const newSelected = [slot];
        
        // 更新開始和結束時間
        const newStartTime = `${replacementSessionData.date}T${newSelected[0].startTime}:00`;
        const newEndTime = `${replacementSessionData.date}T${newSelected[0].endTime}:00`;
        
        setReplacementSessionData({
          ...replacementSessionData,
          selectedSlots: newSelected,
          startTime: newStartTime,
          endTime: newEndTime
        });
        return;
      }
      
      // 如果未選中，則添加到選中列表
      const newSelected = [...currentSelected, slot].sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
      );
      console.log('Adding slot, new selected:', newSelected);
      
      // 檢查是否連續
      let isConsecutive = true;
      for (let i = 1; i < newSelected.length; i++) {
        const prevEnd = newSelected[i - 1].endTime;
        const currStart = newSelected[i].startTime;
        if (prevEnd !== currStart) {
          isConsecutive = false;
          break;
        }
      }
      
      if (!isConsecutive) {
        console.log('Slots are not consecutive, replacing selection');
        // 如果不連續，只保留新選中的時段
        newSelected.splice(0, newSelected.length - 1);
      }
      
      // 限制選擇的時間段數量不超過所需數量
      if (newSelected.length > requiredSlots) {
        console.log(`Limiting selection to ${requiredSlots} slots`);
        newSelected.splice(requiredSlots);
      }
      
      // 更新開始和結束時間
      const newStartTime = `${replacementSessionData.date}T${newSelected[0].startTime}:00`;
      const newEndTime = `${replacementSessionData.date}T${newSelected[newSelected.length - 1].endTime}:00`;
      
      setReplacementSessionData({
        ...replacementSessionData,
        selectedSlots: newSelected,
        startTime: newStartTime,
        endTime: newEndTime
      });
    }
  };

  const handleBookReplacementForStudent = async (request) => {
    setBookReplacementDialog({ open: true, request });
    
    // 計算原始課程的時長
    let originalDuration = 1; // 默認1小時
    if (request.originalSessionStartTime && request.originalSessionEndTime) {
      console.log('=== Time Calculation Debug ===');
      console.log('Raw start time:', request.originalSessionStartTime);
      console.log('Raw end time:', request.originalSessionEndTime);
      
      // 使用更精確的時間解析
      const originalStart = new Date(request.originalSessionStartTime + 'Z'); // 添加 Z 表示 UTC
      const originalEnd = new Date(request.originalSessionEndTime + 'Z');
      
      console.log('Parsed start time:', originalStart);
      console.log('Parsed end time:', originalEnd);
      console.log('Start time ISO:', originalStart.toISOString());
      console.log('End time ISO:', originalEnd.toISOString());
      
      const timeDiffMs = originalEnd.getTime() - originalStart.getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
      
      console.log('Time difference (ms):', timeDiffMs);
      console.log('Time difference (hours):', timeDiffHours);
      
      originalDuration = timeDiffHours;
      console.log('Calculated duration before limits:', originalDuration);
      
      // 不要限制時長，讓它顯示真實的時長
      // originalDuration = Math.max(0.5, Math.min(4, originalDuration));
      console.log('Final duration:', originalDuration);
    }
    
    // 獲取原始課程的場地信息
    let originalVenueId = '';
    let originalVenueName = '';
    let originalState = '';
    
    try {
      // 從原始課程信息中獲取場地信息
      console.log('=== Venue Info Debug ===');
      console.log('Request venue:', request.venue);
      console.log('Request state:', request.state);
      console.log('Request court:', request.court);
      
      // 使用正確的字段名稱
      originalVenueName = request.venue || '';
      originalState = request.state || '';
      
      // 如果需要場地ID，需要從場地名稱查找
      if (originalVenueName && venues.length > 0) {
        const foundVenue = venues.find(v => v.name === originalVenueName);
        if (foundVenue) {
          originalVenueId = foundVenue.id;
        }
      }
      
      console.log('Extracted venue info:', { originalVenueId, originalVenueName, originalState });
    } catch (error) {
      console.error('Error getting original venue info:', error);
    }
    
    // 預設課程信息，包含原始課程的時長和場地信息
    setReplacementSessionData({
      title: `${request.originalSessionTitle} (Replacement)`,
      description: `Replacement session for ${request.studentName}`,
      venueId: originalVenueId,
      venueName: originalVenueName,
      state: originalState,
      courtId: '',
      startTime: '',
      endTime: '',
      maxParticipants: 1, // 單個學生時設為1
      price: '',
      slotType: 'COACH_SESSION',
      originalDuration: originalDuration, // 保存原始時長
      date: '',
      availableSlots: [],
      selectedSlots: [],
      selectedSlot: ''
    });
  };

  const handleBatchBookReplacement = async () => {
    const selectedRequestObjects = leaveRequests.filter(r => selectedRequests.includes(r.id));
    
    // 檢查是否所有選中的請求都是 MESSAGE_SENT 狀態
    const allMessageSent = selectedRequestObjects.every(r => r.status === 'MESSAGE_SENT');
    if (!allMessageSent) {
      alert('Only MESSAGE_SENT requests can be processed together');
      return;
    }
    
    // 檢查是否所有請求的原始課程時長相同
    const durations = selectedRequestObjects.map(r => {
      if (r.originalSessionStartTime && r.originalSessionEndTime) {
        const start = new Date(r.originalSessionStartTime + 'Z');
        const end = new Date(r.originalSessionEndTime + 'Z');
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
      return 1; // 默認1小時
    });
    
    const uniqueDurations = [...new Set(durations)];
    if (uniqueDurations.length > 1) {
      alert('All selected requests must have the same original session duration to be processed together');
      return;
    }
    
    // 使用第一個請求作為模板
    const firstRequest = selectedRequestObjects[0];
    setBookReplacementDialog({ open: true, request: firstRequest, batchRequests: selectedRequestObjects });
    
    // 計算原始課程的時長
    let originalDuration = 1;
    if (firstRequest.originalSessionStartTime && firstRequest.originalSessionEndTime) {
      const originalStart = new Date(firstRequest.originalSessionStartTime + 'Z');
      const originalEnd = new Date(firstRequest.originalSessionEndTime + 'Z');
      originalDuration = (originalEnd.getTime() - originalStart.getTime()) / (1000 * 60 * 60);
    }
    
    // 生成學生名單
    const studentNames = selectedRequestObjects.map(r => r.studentName).join(', ');
    
    // 獲取第一個請求的原始場地信息作為默認值
    let originalVenueId = '';
    let originalVenueName = '';
    let originalState = '';
    
    console.log('=== Batch Venue Info Debug ===');
    console.log('First request venue:', firstRequest.venue);
    console.log('First request state:', firstRequest.state);
    console.log('First request court:', firstRequest.court);
    
    // 使用正確的字段名稱
    originalVenueName = firstRequest.venue || '';
    originalState = firstRequest.state || '';
    
    // 如果需要場地ID，需要從場地名稱查找
    if (originalVenueName && venues.length > 0) {
      const foundVenue = venues.find(v => v.name === originalVenueName);
      if (foundVenue) {
        originalVenueId = foundVenue.id;
      }
    }
    
    console.log('Extracted batch venue info:', { originalVenueId, originalVenueName, originalState });
    
    // 預設課程信息
          setReplacementSessionData({
        title: `Group Replacement Session`,
        description: `Replacement session for: ${studentNames}`,
        venueId: originalVenueId,
        venueName: originalVenueName,
        state: originalState,
        courtId: '',
        startTime: '',
        endTime: '',
        maxParticipants: selectedRequestObjects.length,
        price: '',
        slotType: 'COACH_SESSION',
        originalDuration: originalDuration,
        batchRequests: selectedRequestObjects,
        date: '',
        availableSlots: [],
        selectedSlots: [],
        selectedSlot: ''
      });
  };

  const handleCreateReplacementSession = async () => {
    try {
      const { request, batchRequests } = bookReplacementDialog;
      
      // 計算結束時間（基於開始時間和原始時長）
      const startTime = replacementSessionData.startTime;
      const originalDuration = replacementSessionData.originalDuration || 1;
      const endTime = new Date(new Date(startTime).getTime() + originalDuration * 60 * 60 * 1000).toISOString();
      
      // 獲取球場信息以計算費用
      const selectedCourt = courts.find(court => court.id === replacementSessionData.courtId);
      const courtPricePerHour = selectedCourt ? (selectedCourt.pricePerHour || 45) : 45; // 默認45/小時
      const totalCost = courtPricePerHour * originalDuration;
      
      // 創建替換課程
      const payload = {
        ...replacementSessionData,
        endTime: endTime,
        coachId: currentUser.id,
        price: 0, // 學生不需要付錢
      };
      
      const newSession = await ClassSessionService.createClassSession(payload);
      
      // 如果是批量處理
      if (batchRequests && batchRequests.length > 0) {
        // 批量批准所有選中的請求
        const approvalPromises = batchRequests.map(req => 
          LeaveRequestService.approveRequest(req.id, newSession.id, 'Coach arranged group replacement session')
        );
        await Promise.all(approvalPromises);
        
        // 跳轉到支付頁面
        const paymentData = {
          sessionId: newSession.id,
          amount: totalCost * batchRequests.length, // 批量處理時總費用
          description: `Replacement session payment for ${batchRequests.length} student(s)`,
          courtId: replacementSessionData.courtId,
          courtName: selectedCourt ? selectedCourt.name : 'Unknown Court',
          duration: originalDuration,
          pricePerHour: courtPricePerHour,
          isReplacementSession: true,
          studentCount: batchRequests.length
        };
        
        // 將支付數據存儲到 localStorage
        localStorage.setItem('replacementSessionPayment', JSON.stringify(paymentData));
        
        // 跳轉到支付頁面
        navigate('/payment');
        
        alert(`Group replacement session created and ${batchRequests.length} requests approved! Redirecting to payment...`);
        setSelectedRequests([]); // 清空選擇
      } else {
        // 單個請求處理
        await LeaveRequestService.approveRequest(request.id, newSession.id, 'Coach arranged replacement session');
        
        // 跳轉到支付頁面
        const paymentData = {
          sessionId: newSession.id,
          amount: totalCost,
          description: `Replacement session payment for ${request.studentName}`,
          courtId: replacementSessionData.courtId,
          courtName: selectedCourt ? selectedCourt.name : 'Unknown Court',
          duration: originalDuration,
          pricePerHour: courtPricePerHour,
          isReplacementSession: true,
          studentCount: 1,
          studentName: request.studentName
        };
        
        // 將支付數據存儲到 localStorage
        localStorage.setItem('replacementSessionPayment', JSON.stringify(paymentData));
        
        // 跳轉到支付頁面
        navigate('/payment');
        
        alert('Replacement session created and request approved! Redirecting to payment...');
      }
      
      setBookReplacementDialog({ open: false, request: null });
      setReplacementSessionData({
        title: '',
        description: '',
        venueId: '',
        venueName: '',
        state: '',
        courtId: '',
        startTime: '',
        endTime: '',
        maxParticipants: 1,
        price: '',
        slotType: 'COACH_SESSION',
        date: '',
        availableSlots: [],
        selectedSlots: [],
        selectedSlot: ''
      });
      
      // 刷新請假請求列表
      fetchLeaveRequests();
    } catch (error) {
      console.error('Failed to create replacement session:', error);
      alert('Failed to create replacement session: ' + error.message);
    }
  };

  const renderLeaveRequests = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          Makeup Class Requests
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedRequests.length > 0 && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleBatchBookReplacement()}
            >
              BOOK COURT FOR {selectedRequests.length} STUDENT{selectedRequests.length > 1 ? 'S' : ''}
            </Button>
          )}
          <Button 
            variant="outlined" 
            onClick={async () => {
              try {
                const debugData = await LeaveRequestService.debugAllRequests();
                console.log('Debug all requests:', debugData);
                alert(`Total requests: ${debugData.totalRequests}\nCheck console for details`);
              } catch (error) {
                console.error('Debug failed:', error);
                alert('Debug failed: ' + error.message);
              }
            }}
          >
            Debug All Requests
          </Button>
        </Box>
      </Box>
      
      {leaveRequests.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No pending makeup class requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All requests have been processed.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRequests.length === leaveRequests.filter(r => r.status === 'MESSAGE_SENT').length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRequests(leaveRequests.filter(r => r.status === 'MESSAGE_SENT').map(r => r.id));
                      } else {
                        setSelectedRequests([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Original Date</TableCell>
                <TableCell>Preferred Date</TableCell>
                <TableCell>Request Type</TableCell>
                <TableCell>Student Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell padding="checkbox">
                    {request.status === 'MESSAGE_SENT' && (
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequests([...selectedRequests, request.id]);
                          } else {
                            setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                          }
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{request.studentName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.studentEmail}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(request.originalDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {request.preferredDate && new Date(request.preferredDate).getFullYear() > 1900 ? 
                      new Date(request.preferredDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }}>
                      {request.status === 'SELF_SELECTED' ? 'Self-Selected Replacement' : 
                       request.status === 'MESSAGE_SENT' ? 'Message Sent to Coach' : 
                       'Makeup Class Request'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }}>
                      {request.reason || 'No reason provided'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={request.status.toLowerCase()} 
                      color={
                        request.status === 'PENDING' ? 'warning' :
                        request.status === 'SELF_SELECTED' ? 'info' :
                        request.status === 'MESSAGE_SENT' ? 'primary' :
                        request.status === 'APPROVED' ? 'success' :
                        request.status === 'DECLINED' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {request.status === 'MESSAGE_SENT' && (
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="primary"
                          onClick={() => handleBookReplacementForStudent(request)}
                        >
                          BOOK COURT
                        </Button>
                      )}
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        onClick={() => handleApproveRequest(request)}
                      >
                        APPROVE
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="error"
                        onClick={() => handleDeclineRequest(request)}
                      >
                        DECLINE
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const renderIncomeHistory = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          {showWalletTransactions ? 'Wallet Transactions' : 'Income History'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowWalletTransactions(!showWalletTransactions);
              if (!showWalletTransactions && walletTransactions.length === 0) {
                fetchWalletTransactions();
              }
            }}
          >
            {showWalletTransactions ? 'Show Income History' : 'Show Wallet Transactions'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              fetchRevenueStatus();
            }}
          >
            Refresh Revenue Status
          </Button>
        </Box>
      </Box>
      
      {/* 收入分配狀態 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="primary" />
            Revenue Distribution Status
          </Typography>
          {revenueLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : revenueStatus.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Session</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>Total Revenue</TableCell>
                    <TableCell>Coach Share (80%)</TableCell>
                    <TableCell>Platform Share (20%)</TableCell>
                    <TableCell>Hours Until Start</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenueStatus.map((status, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {status.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {status.startTime ? new Date(status.startTime).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          RM {status.totalRevenue?.toFixed(2) || '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          RM {status.coachShare?.toFixed(2) || '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          RM {status.platformShare?.toFixed(2) || '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={status.hoursUntilStart <= 24 ? 'warning.main' : 'text.secondary'}>
                          {status.hoursUntilStart || 0} hours
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.revenueDistributed ? 'Distributed' : 'Pending'}
                          color={status.revenueDistributed ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
              No revenue data available
            </Typography>
          )}
        </CardContent>
      </Card>
      
      {showWalletTransactions ? (
        // 錢包交易記錄
        <>
          {/* 錢包統計卡片 */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceWallet color="primary" />
                    Wallet Balance
                  </Typography>
                  {walletBalance ? (
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      RM {walletBalance.balance?.toFixed(2) || '0.00'}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      RM 0.00
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp color="success" />
                    Total Income
                  </Typography>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    RM {walletTransactions.filter(t => t.isIncome).reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDown color="error" />
                    Total Expense
                  </Typography>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    RM {walletTransactions.filter(t => !t.isIncome).reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance color="info" />
                    Net Income
                  </Typography>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    RM {(walletTransactions.filter(t => t.isIncome).reduce((sum, t) => sum + (t.amount || 0), 0) - 
                         walletTransactions.filter(t => !t.isIncome).reduce((sum, t) => sum + (t.amount || 0), 0)).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 錢包交易記錄表格 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Wallet Transactions</Typography>
              {walletLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : walletTransactions.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Balance After</TableCell>
                        <TableCell>Reference</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {walletTransactions.map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.transactionType}
                              color={transaction.isIncome ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transaction.description || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={transaction.isIncome ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {transaction.isIncome ? '+' : '-'} RM {transaction.amount?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              RM {transaction.balanceAfter?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {transaction.referenceType} {transaction.referenceId}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" p={3}>
                  <AccountBalanceWallet sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Wallet Transactions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Your wallet transactions will appear here once you have completed sessions and received payments.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // 收入歷史記錄
        <>
      {/* 收入統計卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWallet color="primary" />
                Wallet Balance
              </Typography>
              {walletBalance ? (
                <Typography variant="h4" color="primary" fontWeight="bold">
                  RM {walletBalance.balance?.toFixed(2) || '0.00'}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                      RM 0.00
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="success" />
                Total Income
              </Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                RM {incomeHistory.reduce((sum, record) => sum + (record.amount || 0), 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt color="info" />
                Total Records
              </Typography>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {incomeHistory.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 收入歷史表格 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Income Records</Typography>
          {incomeLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : incomeHistory.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Session</TableCell>
                    <TableCell>Students</TableCell>
                    <TableCell>Session Revenue</TableCell>
                    <TableCell>Coach Income (80%)</TableCell>
                    <TableCell>Transaction ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeHistory.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {record.sessionTitle || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.sessionDate ? new Date(record.sessionDate).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {record.studentCount || 'N/A'}
                      </TableCell>
                      <TableCell>
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              RM {record.totalSessionRevenue?.toFixed(2) || '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              RM {record.amount?.toFixed(2) || '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {record.transactionId || 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" p={3}>
              <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Income Records
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                You haven't received any income yet. Income will appear here after your completed sessions are settled.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </Box>
  );

  // 檢查用戶權限和狀態
  const checkUserPermissions = () => {
    console.log('=== User Permission Check ===');
    const token = localStorage.getItem('authToken');
    console.log('Auth token exists:', !!token);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT payload:', payload);
        console.log('User role:', payload.role);
        console.log('User type:', payload.userType);
        console.log('User ID:', payload.userId);
        console.log('Subject:', payload.sub);
      } catch (error) {
        console.error('Failed to parse JWT token:', error);
      }
    }
    
    console.log('Current user:', currentUser);
    console.log('Has COACH role:', hasRole('COACH'));
    console.log('User type check:', currentUser?.userType === 'COACH' || currentUser?.userType === 'Coach');
  };

  // 在組件加載時檢查權限
  useEffect(() => {
    checkUserPermissions();
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Coach Management System
          </Typography>
          <Badge badgeContent={4} color="error">
            <IconButton color="inherit">
              <Notifications />
            </IconButton>
          </Badge>
          <Box sx={{ position: 'relative', ml: 2 }}>
            <Button
              variant="text"
              onClick={() => setShowUserMenu((v) => !v)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'inherit', p: 0, minWidth: 0 }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                {coachInitial}
              </Avatar>
              <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: 'primary.main', fontWeight: 600 }}>
                {coachName}
              </Typography>
            </Button>
            {showUserMenu && (
              <Paper sx={{
                position: 'absolute',
                top: '100%',
                right: 0,
                mt: 1,
                minWidth: 120,
                boxShadow: 3,
                zIndex: 10,
                backgroundColor: theme.palette.background.paper
              }}>
                <Button
                  fullWidth
                  onClick={handleLogout}
                  sx={{ justifyContent: 'flex-start', px: 2, py: 1 }}
                >
                  Logout
                </Button>
              </Paper>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: theme.palette.background.default
        }}
      >
        <Toolbar />
        {renderContent()}
      </Box>

      {/* 對話框 */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary
          }
        }}
      >
        <DialogTitle>
          {dialogType === 'addStudent' ? 'Add Student' : 'Add Session'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'addStudent' ? (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Student Name"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Level</InputLabel>
                <Select label="Level">
                  <MenuItem value="Beginner">Beginner</MenuItem>
                  <MenuItem value="Intermediate">Intermediate</MenuItem>
                  <MenuItem value="Advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Contact Number"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                type="email"
              />
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Student</InputLabel>
                <Select label="Student">
                  {studentList.map((student) => (
                    <MenuItem key={student.id} value={student.name}>
                      {student.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Date"
                type="date"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Time"
                type="time"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel>Session Type</InputLabel>
                <Select label="Session Type">
                  <MenuItem value="Private Training">Private Training</MenuItem>
                  <MenuItem value="Group Session">Group Session</MenuItem>
                  <MenuItem value="Evaluation Session">Evaluation Session</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {dialogType === 'addStudent' ? 'Add Student' : 'Add Session'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* 新增：補課 Dialog */}
      <Dialog 
        open={showMakeupDialog} 
        onClose={() => setShowMakeupDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary
          }
        }}
      >
        <DialogTitle>Schedule Make-up Session</DialogTitle>
        <DialogContent>
          <TextField
            label="Court"
            name="courtId"
            value={(() => {
              const court = sessions.find(s => s.id === makeupOriginSession?.id)?.court;
              return court ? court.name : '';
            })()}
            fullWidth
            margin="normal"
            disabled
          />
          <TextField
            label="Title"
            name="title"
            value={makeupSessionData.title}
            onChange={handleMakeupInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            name="description"
            value={makeupSessionData.description}
            onChange={handleMakeupInputChange}
            fullWidth
            margin="normal"
          />
          {makeupOriginSession && (
            <Box sx={{ 
              mb: 2, 
              p: 1, 
              bgcolor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5', 
              borderRadius: 2 
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Original Cancelled Session</div>
              <div>Date: {makeupOriginSession.startTime ? new Date(makeupOriginSession.startTime).toLocaleDateString() : ''}</div>
              <div>Time: {makeupOriginSession.startTime ? new Date(makeupOriginSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} - {makeupOriginSession.endTime ? new Date(makeupOriginSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
            </Box>
          )}
          <TextField
            label="Date"
            type="date"
            value={makeupSessionData.date || ''}
            onChange={async e => {
              const dateStr = e.target.value;
              setMakeupSessionData({ ...makeupSessionData, date: dateStr, startTime: '', endTime: '' });
              // fetch busySlots for this date
              const courtId = sessions.find(s => s.id === makeupOriginSession?.id)?.court?.id;
              if (courtId && dateStr) {
                const slots = await CoachService.getAvailableTimes(courtId, dateStr);
                setBusySlots(slots);
              } else {
                setBusySlots([]);
              }
            }}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          {makeupSessionData.date && (
            <Box sx={{ my: 2 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Select Start Time</div>
              <Grid container spacing={1.5}>
                {hourSlots.map((slot, idx) => {
                  const key = slot.start + '-' + slot.end;
                  // 只要有任何 busySlot 時間重疊，該格就 disabled
                  const isBusy = busySlots && busySlots.some(s => {
                    const sStart = s.start.slice(11, 16);
                    const sEnd = s.end.slice(11, 16);
                    // slot 格子的時間
                    const slotStart = slot.start;
                    const slotEnd = slot.end;
                    // 有重疊就算 busy
                    return slotStart < sEnd && slotEnd > sStart;
                  });
                  const isSelected = makeupSessionData.selectedSlots && makeupSessionData.selectedSlots.some(s => s.start === slot.start && s.end === slot.end);
                  return (
                    <Grid item xs={4} sm={3} md={2} key={key}>
                      <Button
                        fullWidth
                        variant={isSelected ? "contained" : "outlined"}
                        onClick={() => !isBusy && handleMakeupSlotSelect(slot)}
                        disabled={isBusy}
                        sx={{
                          py: 1.5,
                          borderRadius: '12px',
                          fontWeight: 600,
                          ...(isSelected ? {
                            background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
                            color: 'white',
                            boxShadow: '0 4px 8px rgba(37, 117, 252, 0.3)'
                          } : {}),
                          ...(isBusy ? {
                            borderColor: '#aaa',
                            color: '#aaa',
                            background: theme.palette.mode === 'dark' ? '#424242' : '#f5f5f5',
                            opacity: 0.7
                          } : {})
                        }}
                      >
                        {slot.start}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
          <TextField
            label="Max Participants"
            name="maxParticipants"
            type="number"
            value={(() => {
              const session = sessions.find(s => s.id === makeupOriginSession?.id);
              return session ? session.maxParticipants : makeupSessionData.maxParticipants;
            })()}
            fullWidth
            margin="normal"
            disabled
          />
          <TextField
            label="Price"
            name="price"
            type="number"
            value={0}
            fullWidth
            margin="normal"
            disabled
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMakeupDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateMakeupSession} variant="contained" color="primary">Create Make-up</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={cancelSuccess} autoHideDuration={6000} onClose={() => setCancelSuccess(false)}>
        <Alert onClose={() => setCancelSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {cancelMessage}
          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={() => setShowMakeupDialog(true)}>
              Make a Replacement Class
            </Button>
          </Box>
        </Alert>
      </Snackbar>
      <Dialog 
        open={showForceCancelDialog} 
        onClose={() => setShowForceCancelDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary
          }
        }}
      >
        <DialogTitle>Force Cancel Session</DialogTitle>
        <DialogContent>
          <Typography color="error" mb={2}>This session has participants. Please provide a reason for cancellation. All participants will be notified and refunded.</Typography>
          <TextField
            label="Reason for cancellation"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForceCancelDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleForceCancel} variant="contained" color="error" disabled={!cancelReason}>Force Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Coach Comment Dialog */}
      <Dialog 
        open={commentDialog.open} 
        onClose={() => setCommentDialog({ open: false, request: null, action: '' })}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary
          }
        }}
      >
        <DialogTitle>
          {commentDialog.action === 'approve' ? 'Approve Makeup Request' : 'Decline Makeup Request'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {commentDialog.request && (
              <>
                <strong>Student:</strong> {commentDialog.request.studentName}<br/>
                <strong>Original Session:</strong> {new Date(commentDialog.request.originalDate).toLocaleDateString()}<br/>
                <strong>Student's Reason:</strong> {commentDialog.request.reason}<br/>
                <strong>Preferred Date:</strong> {new Date(commentDialog.request.preferredDate).toLocaleDateString()}
              </>
            )}
          </Typography>
          <TextField
            label="Coach Response (Optional)"
            value={coachComment}
            onChange={(e) => setCoachComment(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Add your response or notes here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialog({ open: false, request: null, action: '' })}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitComment}
            variant="contained"
            color={commentDialog.action === 'approve' ? 'success' : 'error'}
          >
            {commentDialog.action === 'approve' ? 'Approve' : 'Decline'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Book Replacement Session Dialog */}
      <Dialog 
        open={bookReplacementDialog.open} 
        onClose={() => setBookReplacementDialog({ open: false, request: null })} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary
          }
        }}
      >
        <DialogTitle>
          {bookReplacementDialog.batchRequests ? 
            `Book Group Replacement Session for ${bookReplacementDialog.batchRequests.length} Students` :
            'Book Replacement Session for Student'
          }
          {replacementSessionData.originalDuration && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              (Same duration as original: {replacementSessionData.originalDuration} hours)
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {bookReplacementDialog.request && (
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              bgcolor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5', 
              borderRadius: 1 
            }}>
              <Typography variant="subtitle2" gutterBottom>
                {bookReplacementDialog.batchRequests ? 'Students Request Details:' : 'Student Request Details:'}
              </Typography>
              {bookReplacementDialog.batchRequests ? (
                // 批量請求顯示
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Number of Students:</strong> {bookReplacementDialog.batchRequests.length}<br/>
                    <strong>Original Session Duration:</strong> {replacementSessionData.originalDuration || 1} hours
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>Student List:</Typography>
                  {bookReplacementDialog.batchRequests.map((req, index) => (
                    <Typography key={req.id} variant="body2" sx={{ mb: 1, pl: 2 }}>
                      {index + 1}. <strong>{req.studentName}</strong> - {req.reason}
                    </Typography>
                  ))}
                </Box>
              ) : (
                // 單個請求顯示
                <Typography variant="body2">
                  <strong>Student:</strong> {bookReplacementDialog.request.studentName}<br/>
                  <strong>Original Session:</strong> {bookReplacementDialog.request.originalSessionTitle}<br/>
                  <strong>Original Date:</strong> {new Date(bookReplacementDialog.request.originalDate).toLocaleDateString()}<br/>
                  <strong>Original Time:</strong> {bookReplacementDialog.request.originalSessionStartTime ? 
                    new Date(bookReplacementDialog.request.originalSessionStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} - 
                    {bookReplacementDialog.request.originalSessionEndTime ? 
                    new Date(bookReplacementDialog.request.originalSessionEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}<br/>
                  <strong>Original Duration:</strong> {replacementSessionData.originalDuration || 1} hours<br/>
                  <strong>Reason:</strong> {bookReplacementDialog.request.reason}
                </Typography>
              )}
            </Box>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Session Title"
                value={replacementSessionData.title}
                onChange={(e) => setReplacementSessionData({...replacementSessionData, title: e.target.value})}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Original Venue Information
                </Typography>
                <Typography variant="body2">
                  <strong>Venue:</strong> {replacementSessionData.venueName || 'Not specified'}<br/>
                  <strong>State:</strong> {replacementSessionData.state || 'Not specified'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Select Court</InputLabel>
                <Select
                  value={replacementSessionData.courtId || ''}
                  onChange={(e) => {
                    const courtId = e.target.value;
                    setReplacementSessionData({
                      ...replacementSessionData,
                      courtId,
                      date: '',
                      availableSlots: [],
                      selectedSlot: ''
                    });
                  }}
                  label="Select Court"
                >
                                    <MenuItem value="">Select a court</MenuItem>
                  {courts.length === 0 ? (
                    <MenuItem disabled>No courts available</MenuItem>
                  ) : (
                    (() => {
                      console.log('=== Court Selection Debug ===');
                      console.log('Courts array:', courts);
                      console.log('Venues array:', venues);
                      console.log('Replacement session data:', replacementSessionData);
                      console.log('Original state:', replacementSessionData.state);
                      
                      const filteredCourts = courts.filter(court => {
                        console.log('Checking court:', court.name, 'venue state:', court.venue?.state, 'original state:', replacementSessionData.state);
                        
                        // 只顯示與原始場地相同州的球場
                        if (replacementSessionData.state && court.venue?.state === replacementSessionData.state) {
                          console.log('Court matches state:', court.name);
                          return true;
                        }
                        // 如果沒有州信息，顯示所有球場
                        if (!replacementSessionData.state) {
                          console.log('No original state, showing all courts');
                          return true;
                        }
                        console.log('Court does not match state:', court.name);
                        return false;
                      });
                      
                      console.log('Filtered courts (same state):', filteredCourts);
                      console.log('Filtered courts count:', filteredCourts.length);
                      
                      return filteredCourts
                        .sort((a, b) => {
                          // 將原始場地的球場排在前面
                          if (a.venue?.id === replacementSessionData.venueId && b.venue?.id !== replacementSessionData.venueId) {
                            return -1;
                          }
                          if (a.venue?.id !== replacementSessionData.venueId && b.venue?.id === replacementSessionData.venueId) {
                            return 1;
                          }
                          // 然後按場地名稱排序
                          if (a.venue?.name && b.venue?.name) {
                            return a.venue.name.localeCompare(b.venue.name);
                          }
                          return 0;
                        })
                        .map(court => (
                          <MenuItem key={court.id} value={court.id}>
                            <Box>
                              <Typography variant="body2">
                                {court.name} - {court.venue?.name || 'Unknown Venue'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {court.venue?.state || 'Unknown State'}
                              </Typography>
                              {court.venue?.id === replacementSessionData.venueId && (
                                <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                                  (Original Venue)
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        ));
                    })()
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={replacementSessionData.description}
                onChange={(e) => setReplacementSessionData({...replacementSessionData, description: e.target.value})}
                fullWidth
                multiline
                rows={2}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Date"
                type="date"
                value={replacementSessionData.date || ''}
                onChange={async (e) => {
                  const dateStr = e.target.value;
                  setReplacementSessionData({ 
                    ...replacementSessionData, 
                    date: dateStr, 
                    startTime: '', 
                    endTime: '', 
                    selectedSlots: [],
                    selectedSlot: '' 
                  });
                  // 獲取該日期的可用時段
                  if (dateStr && replacementSessionData.courtId) {
                    try {
                      const availableSlots = await getAvailableSlotsForDate(dateStr, replacementSessionData.courtId);
                      setReplacementSessionData(prev => ({ ...prev, availableSlots }));
                    } catch (error) {
                      console.error('Failed to fetch available slots:', error);
                    }
                  }
                }}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                disabled={!replacementSessionData.courtId}
                helperText={!replacementSessionData.courtId ? "Please select a court first" : ""}
              />
            </Grid>
            
            {replacementSessionData.date && replacementSessionData.availableSlots && (
              <Grid item xs={12}>
                <Card sx={{ mt: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">
                      Available Time Slots - {new Date(replacementSessionData.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                  <Grid container spacing={1}>
                    {replacementSessionData.availableSlots.map((slot, index) => {
                      const isSelected = replacementSessionData.selectedSlots.some(s => s.time === slot.time);
                      const isAvailable = !slot.isBooked;
                      const requiredSlots = Math.ceil(replacementSessionData.originalDuration || 1);
                      const hasReachedLimit = replacementSessionData.selectedSlots.length >= requiredSlots;
                      const isDisabled = !isAvailable || (hasReachedLimit && !isSelected);
                      
                      return (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Button
                            fullWidth
                            variant={isSelected ? "contained" : "outlined"}
                            onClick={() => {
                              if (isAvailable && (!hasReachedLimit || isSelected)) {
                                handleSlotSelection(slot);
                              }
                            }}
                            disabled={isDisabled}
                            sx={{
                              py: 1.5,
                              borderRadius: '12px',
                              fontWeight: 600,
                              ...(isSelected ? {
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                                }
                              } : isAvailable && !hasReachedLimit ? {
                                borderColor: '#667eea',
                                color: '#667eea',
                                backgroundColor: 'white',
                                '&:hover': {
                                  borderColor: '#5a6fd8',
                                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)'
                                }
                              } : {
                                borderColor: '#ccc',
                                color: '#999',
                                backgroundColor: '#f8f9fa',
                                opacity: 0.7,
                                cursor: 'not-allowed',
                                '&:hover': {
                                  backgroundColor: '#f8f9fa',
                                  transform: 'none',
                                  boxShadow: 'none'
                                }
                              })
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {slot.startTime}
                              </Typography>
                              {slot.isBooked && (
                                <Typography variant="caption" sx={{ 
                                  color: '#dc3545',
                                  fontWeight: 500,
                                  display: 'block',
                                  mt: 0.5 
                                }}>
                                  Booked
                                </Typography>
                              )}
                            </Box>
                          </Button>
                        </Grid>
                      );
                    })}
                  </Grid>
                  <Box sx={{ mt: 2, p: 1, bgcolor: '#e8f5e8', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      RM45-60/hour
                    </Typography>
                    {replacementSessionData.selectedSlots.length > 0 && (
                      <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 600 }}>
                        Selected: {replacementSessionData.selectedSlots.length} hour(s) 
                        {replacementSessionData.selectedSlots.length >= Math.ceil(replacementSessionData.originalDuration || 1) && 
                          ' (Complete)'}
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                label="Duration (hours)"
                type="number"
                value={replacementSessionData.originalDuration || 1}
                fullWidth
                margin="normal"
                disabled
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                    backgroundColor: '#f5f5f5'
                  }
                }}
                helperText={`Original session duration: ${replacementSessionData.originalDuration || 1} hours`}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Max Participants"
                type="number"
                value={bookReplacementDialog.batchRequests ? replacementSessionData.maxParticipants : 1}
                onChange={(e) => setReplacementSessionData({...replacementSessionData, maxParticipants: parseInt(e.target.value)})}
                fullWidth
                margin="normal"
                disabled={!bookReplacementDialog.batchRequests}
                inputProps={{ min: 1, max: 20 }}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                    backgroundColor: '#f5f5f5'
                  }
                }}
                helperText={bookReplacementDialog.batchRequests ? 
                  `Group session for ${bookReplacementDialog.batchRequests.length} students` : 
                  'Individual replacement session'
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookReplacementDialog({ open: false, request: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateReplacementSession}
            variant="contained"
            color="primary"
            disabled={!replacementSessionData.title || !replacementSessionData.startTime}
          >
            Create & Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 