import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppBar,
  Tabs,
  Tab,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Divider,
  Tooltip,
  Grid,
  Alert,
  Pagination
} from '@mui/material';
import { Star, Edit, Add, CheckCircle, Cancel, AccessTime, WarningAmber, School, TrendingUp, Book, Email, Phone, Event, Person, Schedule, Message, BarChart, Settings } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import ClassSessionService from '../../service/ClassSessionService';
import CoachService from '../../service/CoachService';

const StudentManagementSystem = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [expandedClass, setExpandedClass] = useState(null);

  // Mock data
  const [students, setStudents] = useState([]);

  const [classes, setClasses] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const classesPerPage = 2;
  const { currentUser } = useAuth();
  
  // 出席和反饋狀態 - 移到頂部避免重新定義
  const [todayAttendance, setTodayAttendance] = useState({});
  const [studentFeedbacks, setStudentFeedbacks] = useState({});
  const [evaluations, setEvaluations] = useState([]);
  const [attendanceSessionId, setAttendanceSessionId] = useState(null);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState(null);
  const [unattendedClasses, setUnattendedClasses] = useState([]);
  const [unattendedClassesCount, setUnattendedClassesCount] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedAttendanceData, setSavedAttendanceData] = useState(null);
  
  console.log(currentUser); // 這裡就有教練的所有資訊

  // 添加全局錯誤處理器
  useEffect(() => {
    const handleError = (error) => {
      console.error('Global error caught:', error);
      // 防止頁面刷新
      error.preventDefault();
      return false;
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // 防止頁面刷新
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 獲取我的課程
  const fetchMyClasses = useCallback(async () => {
    // 獲取更長時間範圍的課程，包括過去和未來
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1); // 從一年前開始
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1); // 到一年後結束
    
    // 使用 getScheduleWithRegistrations 來獲取包含 attendanceStatus 的完整數據
    const allSessions = await CoachService.getScheduleWithRegistrations(start.toISOString(), end.toISOString());
    
    // 添加调试信息
    console.log('🔍 Fetched sessions data:', allSessions);
    if (allSessions && allSessions.length > 0) {
      console.log('📊 First session sample:', allSessions[0]);
      if (allSessions[0].registrations) {
        console.log('👥 First session registrations:', allSessions[0].registrations);
        allSessions[0].registrations.forEach((reg, index) => {
          console.log(`  Registration ${index}:`, {
            id: reg.id,
            memberId: reg.memberId,
            attendanceStatus: reg.attendanceStatus,
            hasAttendanceStatus: !!reg.attendanceStatus
          });
        });
      }
    }
    
    // 過濾掉 CANCELLED 的 session
    const activeSessions = allSessions.filter(session => session.status !== 'CANCELLED');
    // 依 recurringGroupId 分組
    const grouped = {};
    activeSessions.forEach(session => {
      const key = session.recurringGroupId || session.id;
      if (!grouped[key]) grouped[key] = { groupId: session.recurringGroupId || session.id, sessions: [] };
      grouped[key].sessions.push(session);
    });
    // 轉成卡片資料格式
    const classCards = await Promise.all(Object.values(grouped).map(async group => {
      const first = group.sessions[0];
      let sessionsWithRegs = [];
      // 用 recurringGroupId 查詢所有 session 及報名名單
      if (first.recurringGroupId) {
        sessionsWithRegs = await ClassSessionService.getRecurringClassFullDetails(first.recurringGroupId);
      } else {
        // 單堂課 fallback
        sessionsWithRegs = [
          { ...first, registrations: await ClassSessionService.getSessionStudents(first.id) }
        ];
      }
      
      // 計算總學生數（去重）
      const uniqueStudents = new Set();
      sessionsWithRegs.forEach(session => {
        if (session.registrations) {
          session.registrations.forEach(reg => {
            uniqueStudents.add(reg.memberId || reg.id);
          });
        }
      });
      
      return {
        id: first.recurringGroupId || first.id, // 卡片 id 用 recurringGroupId
        recurringGroupId: first.recurringGroupId || first.id,
        name: first.title || first.type || '-',
        time: `${first.daysOfWeek ? first.daysOfWeek.join('/') : ''} ${first.startTime ? new Date(first.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}-${first.endTime ? new Date(first.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`,
        capacity: first.maxParticipants || 0,
        sessions: sessionsWithRegs,
        totalStudents: uniqueStudents.size, // 添加總學生數
        // 添加最早開始時間用於排序
        earliestStartTime: sessionsWithRegs.length > 0 ? 
          Math.min(...sessionsWithRegs.map(s => s.startTime ? new Date(s.startTime).getTime() : Infinity)) : 
          (first.startTime ? new Date(first.startTime).getTime() : Infinity)
      };
    }));
    
    // 按最早開始時間排序，最近的日期排在前面
    const sortedClassCards = classCards.sort((a, b) => {
      const now = new Date().getTime();
      const aTime = a.earliestStartTime;
      const bTime = b.earliestStartTime;
      
      // 如果兩個課程都還沒開始，按開始時間排序（最近的在前）
      if (aTime > now && bTime > now) {
        return aTime - bTime;
      }
      // 如果一個已開始一個還沒開始，未開始的排在前面
      if (aTime > now && bTime <= now) {
        return -1;
      }
      if (aTime <= now && bTime > now) {
        return 1;
      }
      // 如果兩個都已開始，按開始時間排序（最近的在前）
      return aTime - bTime;
    });
    
    setClasses(sortedClassCards);
    
    // 調試：顯示所有課程的詳細信息
    console.log('=== ALL CLASSES DEBUG ===');
    sortedClassCards.forEach((classItem, index) => {
      console.log(`Class ${index + 1}:`, {
        name: classItem.name,
        sessionsCount: classItem.sessions.length,
        totalStudents: classItem.totalStudents,
        sessions: classItem.sessions.map(s => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          date: s.startTime ? new Date(s.startTime).toISOString().slice(0, 10) : 'N/A',
          registrations: s.registrations ? s.registrations.length : 0,
          // 詳細的場地信息調試
          courtName: s.courtName,
          court: s.court,
          venue: s.venue,
          venueName: s.venueName,
          venueState: s.venueState,
          // 檢查所有可能的場地相關字段
          allFields: Object.keys(s).filter(key => 
            key.toLowerCase().includes('court') || 
            key.toLowerCase().includes('venue')
          ).reduce((obj, key) => {
            obj[key] = s[key];
            return obj;
          }, {})
        }))
      });
      
      // 特別調試第一個課程的場地信息
      if (index === 0 && classItem.sessions.length > 0) {
        const firstSession = classItem.sessions[0];
        console.log('=== FIRST SESSION COURT DEBUG ===');
        console.log('Session object:', firstSession);
        console.log('Court name field:', firstSession.courtName);
        console.log('Court object:', firstSession.court);
        console.log('Venue object:', firstSession.venue);
        console.log('Venue name field:', firstSession.venueName);
        console.log('All session fields:', Object.keys(firstSession));
      }
    });
  }, []);

  useEffect(() => {
    if (currentUser?.id) fetchMyClasses();
  }, [currentUser, fetchMyClasses]);

  useEffect(() => {
    // 直接從 classes 取得所有學生，並去重
    let allStudents = [];
    const studentMap = new Map(); // 用 Map 來去重，key 是 memberId
    
    for (const classItem of classes) {
      for (const session of classItem.sessions) {
        if (session.registrations) {
          session.registrations.forEach(reg => {
            const memberId = reg.memberId || reg.id;
            if (!studentMap.has(memberId)) {
              // 新學生，創建記錄
              studentMap.set(memberId, {
                ...reg,
                memberId: memberId,
                classId: classItem.recurringGroupId,
                sessionId: session.id,
                totalSessions: 1,
                completedSessions: 0,
                progress: 0,
                rating: 0,
                missedSessions: 0,
                status: 'active'
              });
            } else {
              // 已存在的學生，增加課程計數
              const existingStudent = studentMap.get(memberId);
              existingStudent.totalSessions += 1;
              // 可以根據需要合併其他資訊
            }
          });
        }
      }
    }
    
    // 轉換 Map 為陣列
    allStudents = Array.from(studentMap.values());
    setStudents(allStudents);
  }, [classes]);

  // 檢測今天需要記錄出席的課程
  const fetchUnattendedClasses = useCallback(async () => {
    try {
      if (!classes || classes.length === 0) {
        console.log('No classes available for unattended check');
        return;
      }
      
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      console.log('Checking for unattended classes on:', todayStr);
      console.log('Total classes available:', classes.length);
      
      // 收集今天和未來幾天內的課程（最多檢查未來7天）
      let todaySessions = [];
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(today.getDate() + i);
        const checkDateStr = checkDate.toISOString().slice(0, 10);
        
        for (const classItem of classes) {
          console.log('Checking class:', classItem.name, 'with', classItem.sessions?.length, 'sessions');
          for (const session of classItem.sessions) {
            if (session.startTime) {
              const sessionDate = new Date(session.startTime).toISOString().slice(0, 10);
              console.log('Session date:', sessionDate, 'vs check date:', checkDateStr);
              if (sessionDate === checkDateStr) {
                console.log('Found session for date:', checkDateStr, ':', session.title || session.className);
                todaySessions.push({
                  ...session,
                  className: classItem.name,
                  classId: classItem.recurringGroupId,
                  sessionDate: checkDateStr,
                  isToday: i === 0
                });
              }
            }
          }
        }
      }
      
      console.log('Sessions found for next 7 days:', todaySessions.length);
      
      // 過濾出有學生註冊但還沒有記錄出勤的課程
      const unattended = todaySessions.filter(session => {
        const hasRegistrations = session.registrations && session.registrations.length > 0;
        const hasUnrecordedAttendance = hasRegistrations && session.registrations.some(reg => 
          !reg.attendanceStatus || reg.attendanceStatus === 'NOT_RECORDED' || reg.attendanceStatus === null
        );
        
        // 課程狀態檢查
        const isCompleted = session.status === 'completed' || session.status === 'COMPLETED';
        const isCancelled = session.status === 'cancelled' || session.status === 'CANCELLED';
        
        console.log('Session check:', {
          sessionTitle: session.title || session.className,
          hasRegistrations,
          hasUnrecordedAttendance,
          isCompleted,
          isCancelled,
          shouldInclude: hasRegistrations && hasUnrecordedAttendance && !isCompleted && !isCancelled
        });
        
        return hasRegistrations && hasUnrecordedAttendance && !isCompleted && !isCancelled;
      });
      
      console.log('Unattended sessions found:', unattended.length);
      setUnattendedClasses(unattended);
      setUnattendedClassesCount(unattended.length);
    } catch (error) {
      console.error('Error fetching unattended classes:', error);
    }
  }, [classes]);

  // 簡化：只在 classes 變化時調用一次
  useEffect(() => {
    if (classes.length > 0) {
      fetchUnattendedClasses();
    }
  }, [classes.length, fetchUnattendedClasses]); // 添加 fetchUnattendedClasses 依賴項

  // 移除可能導致無限循環的 useEffect
  // useEffect(() => {
  //   if (classes.length > 0) {
  //     fetchUnattendedClasses();
  //   }
  // }, [fetchMyClasses]);

  const handleAttendanceCheck = useCallback((memberId, present) => {
    try {
      const safeMemberId = String(memberId || '').trim();
      if (!safeMemberId || safeMemberId.length === 0) {
        console.error('Invalid memberId in attendance check:', memberId);
        return;
      }
      
      console.log('Updating attendance for student:', safeMemberId, 'present:', present);
      
      setTodayAttendance(prev => {
        try {
          const newState = {
            ...prev,
            [safeMemberId]: present
          };
          console.log('New todayAttendance state:', newState);
          return newState;
        } catch (stateError) {
          console.error('Error updating attendance state:', stateError);
          return prev;
        }
      });
    } catch (error) {
      console.error('Error in handleAttendanceCheck:', error);
    }
  }, []);

  // 新增：處理 feedback 輸入
  const handleFeedbackChange = useCallback((memberId, feedback) => {
    // 確保 memberId 是有效的字符串
    const safeMemberId = String(memberId || '').trim();
    if (!safeMemberId) {
      console.error('Invalid memberId:', memberId);
      return;
    }
    
    console.log('Feedback change:', { memberId: safeMemberId, feedback });
    
    try {
      setStudentFeedbacks(prev => {
        const newState = {
          ...prev,
          [safeMemberId]: feedback
        };
        console.log('New studentFeedbacks state:', newState);
        return newState;
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  }, []);

  // 新增：保存 attendance 和 feedback
  const handleSaveAttendanceAndFeedback = async () => {
    try {
      if (!selectedSessionForAttendance) {
        console.error('No session selected for attendance');
        alert('No session selected for attendance');
        return;
      }

      console.log('=== SAVING ATTENDANCE AND FEEDBACK ===');
      console.log('Session ID:', selectedSessionForAttendance.id);
      console.log('Session Title:', selectedSessionForAttendance.title);
      console.log('Attendance data:', todayAttendance);
      console.log('Feedback data:', studentFeedbacks);
      console.log('Current user:', currentUser);

      // 檢查是否有出席數據
      if (Object.keys(todayAttendance).length === 0) {
        console.warn('No attendance data to save');
        alert('Please mark at least one student as Present or Absent');
        return;
      }

      // 準備要保存的數據
      const attendanceData = {
        sessionId: selectedSessionForAttendance.id,
        attendance: todayAttendance,
        feedbacks: studentFeedbacks // 這個會保存到後端的 coachComment 字段
      };

      console.log('Sending data to backend:', attendanceData);

      // 調用後端 API 保存出席記錄
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081'}/api/coach/session/${selectedSessionForAttendance.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(attendanceData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Attendance saved successfully:', result);
        
        // 保存成功後設置編輯狀態
        setIsEditing(false);
        setSavedAttendanceData({
          sessionId: selectedSessionForAttendance.id,
          attendance: { ...todayAttendance },
          feedbacks: { ...studentFeedbacks }
        });
        
        // 顯示成功提示
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000); // 3秒後自動隱藏
        
        // 刷新classes数据以更新出席率显示
        try {
          console.log('Refreshing classes data to update attendance rate...');
          await fetchMyClasses();
        } catch (refreshError) {
          console.error('Error refreshing classes data:', refreshError);
        }
        
        // 不關閉模態框，讓用戶可以編輯
        console.log('Data saved successfully. View mode enabled.');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to save attendance:', errorData);
        alert('Failed to save attendance: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error saving attendance:', error);
      alert('Failed to save: ' + error.message);
    }
  };

  // 新增：選擇具體 session 進行點名
  const handleTakeAttendance = (classItem) => {
    setAttendanceSessionId(classItem.recurringGroupId);
    setModalType('selectSession');
    setShowModal(true);
  };

  const handleAddEvaluation = (evaluation) => {
    setEvaluations(prev => [...prev, {
      id: Date.now(),
      studentId: selectedStudent.memberId,
      date: new Date().toISOString().split('T')[0],
      ...evaluation
    }]);
    setShowModal(false);
  };

  // 新增：編輯功能
  const handleEdit = () => {
    console.log('Entering edit mode...');
    setIsEditing(true);
    
    // 确保当前状态包含已保存的数据
    if (savedAttendanceData) {
      setTodayAttendance({ ...savedAttendanceData.attendance });
      setStudentFeedbacks({ ...savedAttendanceData.feedbacks });
      console.log('Edit mode enabled with saved data:', {
        attendance: savedAttendanceData.attendance,
        feedbacks: savedAttendanceData.feedbacks
      });
    } else {
      console.log('Edit mode enabled without saved data');
    }
  };

  // 新增：取消編輯功能
  const handleCancelEdit = (closeModal = false) => {
    if (closeModal) {
      // 直接关闭模态框
      setIsEditing(false);
      setSavedAttendanceData(null);
      setShowModal(false);
      setSelectedSessionForAttendance(null);
      setTodayAttendance({});
      setStudentFeedbacks({});
      console.log('Modal closed.');
    } else if (savedAttendanceData) {
      // 如果有已保存的數據，恢復到已保存的狀態
      setTodayAttendance({ ...savedAttendanceData.attendance });
      setStudentFeedbacks({ ...savedAttendanceData.feedbacks });
      setIsEditing(false);
      console.log('Edit cancelled. Restored saved data.');
    } else {
      // 如果沒有已保存的數據，關閉模態框並清空狀態
      setIsEditing(false);
      setSavedAttendanceData(null);
      setShowModal(false);
      setSelectedSessionForAttendance(null);
      setTodayAttendance({});
      setStudentFeedbacks({});
      console.log('Edit cancelled. Modal closed.');
    }
  };

  // 新增：保存編輯功能
  const handleSaveEdit = async () => {
    try {
      console.log('=== SAVING EDITED DATA ===');
      console.log('Session ID:', selectedSessionForAttendance.id);
      console.log('Edited attendance data:', todayAttendance);
      console.log('Edited feedback data:', studentFeedbacks);

      // 準備要保存的數據
      const attendanceData = {
        sessionId: selectedSessionForAttendance.id,
        attendance: todayAttendance,
        feedbacks: studentFeedbacks
      };

      console.log('Sending edited data to backend:', attendanceData);

      // 調用後端 API 保存編輯後的數據
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081'}/api/coach/session/${selectedSessionForAttendance.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(attendanceData)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Edited data saved successfully:', result);
        
        // 更新保存的數據
        setSavedAttendanceData({
          sessionId: selectedSessionForAttendance.id,
          attendance: { ...todayAttendance },
          feedbacks: { ...studentFeedbacks }
        });
        
        // 退出編輯模式
        setIsEditing(false);
        
        // 顯示成功提示
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        // 刷新classes数据以更新出席率显示
        try {
          console.log('Refreshing classes data to update attendance rate...');
          await fetchMyClasses();
        } catch (refreshError) {
          console.error('Error refreshing classes data:', refreshError);
        }
        
        console.log('Edited data saved successfully. Edit mode disabled.');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to save edited data:', errorData);
        alert('Failed to save edited data: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error saving edited data:', error);
      alert('Failed to save edited data: ' + error.message);
    }
  };


  const getClassStudents = (classId) => students.filter(s => s.classId === classId);

  const getAttendanceRate = (classStudents) => {
    if (classStudents.length === 0) return 0;
    
    // 计算该课程的实际出席率
    let totalAttendanceRecords = 0;
    let presentRecords = 0;
    
    // 遍历该课程的所有sessions来统计出席记录
    const classItem = classes.find(c => c.recurringGroupId === classStudents[0]?.classId);
    if (classItem && classItem.sessions) {
      console.log(`🔍 Calculating attendance rate for class: ${classItem.name}`);
      console.log(`📊 Total sessions: ${classItem.sessions.length}`);
      console.log(`🎯 Class item:`, classItem);
      
      for (const session of classItem.sessions) {
        console.log(`  📅 Session ${session.id}:`, {
          title: session.title,
          status: session.status,
          registrationsCount: session.registrations?.length || 0,
          registrations: session.registrations
        });
        
        if (session.registrations) {
          console.log(`    📋 All registrations for session ${session.id}:`, session.registrations);
          for (const reg of session.registrations) {
            console.log(`    👤 Registration:`, {
              id: reg.id,
              memberId: reg.memberId,
              attendanceStatus: reg.attendanceStatus,
              hasStatus: !!reg.attendanceStatus,
              fullRegistration: reg
            });
            
            if (reg.attendanceStatus) {
              totalAttendanceRecords++;
              if (reg.attendanceStatus === 'PRESENT') {
                presentRecords++;
              }
            }
          }
        } else {
          console.log(`    ❌ No registrations found for session ${session.id}`);
        }
      }
      
      console.log(`📈 Attendance calculation:`, {
        totalRecords: totalAttendanceRecords,
        presentRecords: presentRecords,
        rate: totalAttendanceRecords > 0 ? ((presentRecords / totalAttendanceRecords) * 100).toFixed(1) : 0
      });
    } else {
      console.log(`❌ Class item not found for classStudents:`, classStudents);
    }
    
    return totalAttendanceRecords > 0 ? ((presentRecords / totalAttendanceRecords) * 100).toFixed(1) : 0;
  };

  // 分頁處理函數
  const handleNextPage = () => {
    const maxPage = Math.ceil(classes.length / classesPerPage) - 1;
    if (currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getCurrentPageClasses = () => {
    const startIndex = currentPage * classesPerPage;
    return classes.slice(startIndex, startIndex + classesPerPage);
  };

  const totalPages = Math.ceil(classes.length / classesPerPage);

  const StarRating = ({ rating, size = 'small' }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} fontSize={size} sx={{ color: '#FFD600' }} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} fontSize={size} sx={{ color: '#FFE082' }} />);
      } else {
        stars.push(<Star key={i} fontSize={size} sx={{ color: '#E0E0E0' }} />);
      }
    }
    return <Box display="flex">{stars}</Box>;
  };

  // --- Class Overview Tab ---
  const ClassOverview = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(0);

    // 在 ClassOverview 內部定義 handleTakeAttendance 函數
    const handleTakeAttendance = (classItem) => {
      setAttendanceSessionId(classItem.recurringGroupId);
      setModalType('selectSession');
      setShowModal(true);
    };

    // 在 ClassOverview 內部定義分頁處理函數
    const handleNextPage = () => {
      const maxPage = Math.ceil(filteredClasses.length / classesPerPage) - 1;
      if (currentPage < maxPage) {
        setCurrentPage(currentPage + 1);
      }
    };

    const handlePrevPage = () => {
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    };

    // 在 ClassOverview 內部定義 getCurrentPageClasses 函數
    const getCurrentPageClasses = () => {
      const startIndex = currentPage * classesPerPage;
      return filteredClasses.slice(startIndex, startIndex + classesPerPage);
    };

    // 篩選課程
    const filteredClasses = classes.filter(classItem => {
      const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      
      const classStatus = (() => {
        if (classItem.sessions && classItem.sessions.length > 0) {
          const now = new Date();
          const futureSessions = classItem.sessions.filter(s => 
            s.startTime && new Date(s.startTime) > now
          );
          const pastSessions = classItem.sessions.filter(s => 
            s.startTime && new Date(s.startTime) <= now
          );
          
          if (futureSessions.length > 0 && pastSessions.length > 0) {
            return 'ongoing';
          } else if (futureSessions.length > 0) {
            return 'upcoming';
          } else {
            return 'completed';
          }
        }
        return 'unknown';
      })();
      
      return matchesSearch && classStatus === statusFilter;
    });

    // 如果沒有課程，顯示空狀態
    if (classes.length === 0) {
      return (
        <Box>
          <Typography variant="h5" fontWeight={700} mb={2}>Class Overview</Typography>
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={1}>
              No Classes Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You haven't created any classes yet. Create your first class to get started.
            </Typography>
          </Card>
        </Box>
      );
    }

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={700}>Class Overview</Typography>
          <Typography variant="body2" color="text.secondary">
            {(() => {
              const filtered = classes.filter(classItem => {
                const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase());
                
                if (statusFilter === 'all') return matchesSearch;
                
                const classStatus = (() => {
                  if (classItem.sessions && classItem.sessions.length > 0) {
                    const now = new Date();
                    const futureSessions = classItem.sessions.filter(s => 
                      s.startTime && new Date(s.startTime) > now
                    );
                    const pastSessions = classItem.sessions.filter(s => 
                      s.startTime && new Date(s.startTime) <= now
                    );
                    
                    if (futureSessions.length > 0 && pastSessions.length > 0) {
                      return 'ongoing';
                    } else if (futureSessions.length > 0) {
                      return 'upcoming';
                    } else {
                      return 'completed';
                    }
                  }
                  return 'unknown';
                })();
                
                return matchesSearch && classStatus === statusFilter;
              });
              
              return `Showing ${filtered.length} of ${classes.length} total classes`;
            })()}
          </Typography>
        </Box>

        {/* 未記錄出席提醒 */}
        {unattendedClassesCount > 0 && (
          <Card sx={{ mb: 3, backgroundColor: '#d1ecf1', border: '1px solid #bee5eb' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle sx={{ color: '#0c5460' }} />
                    <Typography variant="h6" sx={{ color: '#0c5460', fontWeight: 'bold' }}>
                      Attendance Not Recorded ({unattendedClassesCount})
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  variant="contained" 
                  color="info"
                  onClick={() => setActiveTab(0)} // 保持在 Class Overview 標籤
                >
                  Take Attendance
                </Button>
              </Box>
              <Typography variant="body2" sx={{ color: '#0c5460', mt: 1 }}>
                You have {unattendedClassesCount} class{unattendedClassesCount > 1 ? 'es' : ''} in the next 7 days that need attendance to be recorded.
              </Typography>
              {/* 顯示具體的課程信息 */}
              <Box sx={{ mt: 2 }}>
                {unattendedClasses.slice(0, 3).map((session, index) => {
                  const studentCount = session.registrations ? session.registrations.length : 0;
                  const unrecordedCount = session.registrations ? 
                    session.registrations.filter(reg => 
                      !reg.attendanceStatus || reg.attendanceStatus === 'NOT_RECORDED' || reg.attendanceStatus === null
                    ).length : 0;
                  
                  const dateLabel = session.isToday ? 'Today' : 
                    new Date(session.sessionDate).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                  
                  return (
                    <Typography key={index} variant="body2" sx={{ color: '#0c5460', opacity: 0.8 }}>
                      • {dateLabel} {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {session.className || session.title || 'Class Session'} ({unrecordedCount}/{studentCount} students)
                    </Typography>
                  );
                })}
                {unattendedClasses.length > 3 && (
                  <Typography variant="body2" sx={{ color: '#0c5460', opacity: 0.8 }}>
                    • ... and {unattendedClasses.length - 3} more
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
        
        {/* 搜索和篩選 */}
        <Card sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({classes.length})
                </Button>
                <Button
                  variant={statusFilter === 'ongoing' ? 'contained' : 'outlined'}
                  size="small"
                  color="info"
                  onClick={() => setStatusFilter('ongoing')}
                >
                  Ongoing ({classes.filter(c => {
                    if (c.sessions && c.sessions.length > 0) {
                      const now = new Date();
                      const futureSessions = c.sessions.filter(s => s.startTime && new Date(s.startTime) > now);
                      const pastSessions = c.sessions.filter(s => s.startTime && new Date(s.startTime) <= now);
                      return futureSessions.length > 0 && pastSessions.length > 0;
                    }
                    return false;
                  }).length})
                </Button>
                <Button
                  variant={statusFilter === 'upcoming' ? 'contained' : 'outlined'}
                  size="small"
                  color="warning"
                  onClick={() => setStatusFilter('upcoming')}
                >
                  Upcoming ({classes.filter(c => {
                    if (c.sessions && c.sessions.length > 0) {
                      const now = new Date();
                      const futureSessions = c.sessions.filter(s => s.startTime && new Date(s.startTime) > now);
                      const pastSessions = c.sessions.filter(s => s.startTime && new Date(s.startTime) <= now);
                      return futureSessions.length > 0 && pastSessions.length === 0;
                    }
                    return false;
                  }).length})
                </Button>
                <Button
                  variant={statusFilter === 'completed' ? 'contained' : 'outlined'}
                  size="small"
                  color="success"
                  onClick={() => setStatusFilter('completed')}
                >
                  Completed ({classes.filter(c => {
                    if (c.sessions && c.sessions.length > 0) {
                      const now = new Date();
                      const pastSessions = c.sessions.filter(s => s.startTime && new Date(s.startTime) <= now);
                      return pastSessions.length > 0;
                    }
                    return false;
                  }).length})
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Card>
        
        {error && (
          <Card sx={{ p: 2, mb: 3, bgcolor: '#ffebee', border: '1px solid #f44336' }}>
            <Typography color="error" variant="body2">
              Error: {error}
            </Typography>
          </Card>
        )}

        {/* 如果篩選後沒有結果 */}
        {(() => {
          const filtered = classes.filter(classItem => {
            const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (statusFilter === 'all') return matchesSearch;
            
            const classStatus = (() => {
              if (classItem.sessions && classItem.sessions.length > 0) {
                const now = new Date();
                const futureSessions = classItem.sessions.filter(s => 
                  s.startTime && new Date(s.startTime) > now
                );
                const pastSessions = classItem.sessions.filter(s => 
                  s.startTime && new Date(s.startTime) <= now
                );
                
                if (futureSessions.length > 0 && pastSessions.length > 0) {
                  return 'ongoing';
                } else if (futureSessions.length > 0) {
                  return 'upcoming';
                } else {
                  return 'completed';
                }
              }
              return 'unknown';
            })();
            
            return matchesSearch && classStatus === statusFilter;
          });
          
          return filtered.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" mb={1}>
                No classes match your search criteria
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search terms or filters
              </Typography>
            </Card>
          ) : null;
        })()}

        <Grid container spacing={3} mb={3} sx={{ justifyContent: 'flex-start' }}>
          {(() => {
            // 先篩選課程
            const filtered = classes.filter(classItem => {
              const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase());
              
              if (statusFilter === 'all') return matchesSearch;
              
              const classStatus = (() => {
                if (classItem.sessions && classItem.sessions.length > 0) {
                  const now = new Date();
                  const futureSessions = classItem.sessions.filter(s => 
                    s.startTime && new Date(s.startTime) > now
                  );
                  const pastSessions = classItem.sessions.filter(s => 
                    s.startTime && new Date(s.startTime) <= now
                  );
                  
                  if (futureSessions.length > 0 && pastSessions.length > 0) {
                    return 'ongoing';
                  } else if (futureSessions.length > 0) {
                    return 'upcoming';
                  } else {
                    return 'completed';
                  }
                }
                return 'unknown';
              })();
              
              return matchesSearch && classStatus === statusFilter;
            });

            // 然後分頁
            const startIndex = currentPage * classesPerPage;
            const paginatedClasses = filtered.slice(startIndex, startIndex + classesPerPage);

            return paginatedClasses.map((classItem) => {
              // 計算學生數與出席率
              const classStudents = students.filter(s => s.classId === classItem.recurringGroupId);
              const attendanceRate = getAttendanceRate(classStudents);
              
              // 處理星期幾顯示
              let weekDays = '-';
              try {
                if (classItem.sessions && classItem.sessions.length > 0) {
                  // 先嘗試 daysOfWeek
                  const allDays = classItem.sessions.flatMap(s => s.daysOfWeek || []);
                  const uniqueDays = Array.from(new Set(allDays));
                  const dayMap = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun' };
                  if (uniqueDays.length > 0) {
                    weekDays = uniqueDays.map(d => dayMap[d] || d).join('/');
                  } else {
                    // fallback: 用第一堂課的 startTime 算出星期幾
                    const first = classItem.sessions[0];
                    if (first.startTime) {
                      const dayIdx = new Date(first.startTime).getDay();
                      const dayArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      if (dayIdx >= 0 && dayIdx < dayArr.length) {
                        weekDays = dayArr[dayIdx];
                      }
                    }
                  }
                }
              } catch (error) {
                console.error('Error calculating weekDays:', error);
                weekDays = '-';
              }

              // 計算已完成堂數
              const completedCount = classItem.sessions
                ? classItem.sessions.filter(s => {
                    // 检查session是否已完成（有多种判断方式）
                    const isCompleted = s.status === 'COMPLETED' || 
                                       s.status === 'completed' || 
                                       s.attendanceTaken === true ||
                                       (s.registrations && s.registrations.some(reg => reg.attendanceStatus));
                    
                    console.log(`🔍 Session ${s.id} completion check:`, {
                      title: s.title,
                      status: s.status,
                      attendanceTaken: s.attendanceTaken,
                      hasRegistrations: !!(s.registrations && s.registrations.length > 0),
                      hasAttendanceStatus: s.registrations && s.registrations.some(reg => reg.attendanceStatus),
                      isCompleted: isCompleted
                    });
                    
                    return isCompleted;
                  }).length
                : 0;

              // 計算課程狀態
              const getClassStatus = () => {
                try {
                  if (classItem.sessions && classItem.sessions.length > 0) {
                    const now = new Date();
                    const futureSessions = classItem.sessions.filter(s => 
                      s.startTime && new Date(s.startTime) > now
                    );
                    const pastSessions = classItem.sessions.filter(s => 
                      s.startTime && new Date(s.startTime) <= now
                    );
                    
                    if (futureSessions.length > 0 && pastSessions.length > 0) {
                      return 'ongoing';
                    } else if (futureSessions.length > 0) {
                      return 'upcoming';
                    } else {
                      return 'completed';
                    }
                  }
                  return 'unknown';
                } catch (error) {
                  console.error('Error in getClassStatus:', error);
                  return 'unknown';
                }
              };

              const classStatus = getClassStatus();
              const statusColor = {
                ongoing: 'primary',
                upcoming: 'info',
                completed: 'success',
                unknown: 'default'
              }[classStatus];

              return (
                <Grid item xs={12} sm={6} lg={4} key={classItem.recurringGroupId} sx={{ minWidth: 0 }}>
                  <Card sx={{ 
                    height: '100%', 
                    minWidth: 0,
                    transition: '0.2s',
                    '&:hover': { 
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* 課程標題和狀態 */}
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="h6" sx={{ wordBreak: 'break-word', flex: 1, mr: 1 }}>
                          {classItem.name}
                        </Typography>
                        <Chip 
                          label={classStatus && classStatus.length > 0 ? classStatus.charAt(0).toUpperCase() + classStatus.slice(1) : 'Unknown'} 
                          color={statusColor} 
                          size="small" 
                        />
                      </Box>

                      {/* 課程時間和日期 */}
                      <Typography variant="body2" color="text.secondary" mb={1} sx={{ wordBreak: 'break-word', fontSize: '0.875rem' }}>
                        {(() => {
                          let dateStr = '-';
                          let timeStr = '-';
                          if (classItem.sessions && classItem.sessions.length > 0) {
                            const startDates = classItem.sessions.map(s => s.startTime ? new Date(s.startTime) : null).filter(Boolean);
                            const endDates = classItem.sessions.map(s => s.endTime ? new Date(s.endTime) : null).filter(Boolean);
                            if (startDates.length && endDates.length) {
                              const minStart = new Date(Math.min(...startDates.map(d => d.getTime())));
                              const maxEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
                              const format = d => `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
                              
                              // 如果只有一個日期，只顯示一個日期
                              if (minStart.getTime() === maxEnd.getTime()) {
                                dateStr = format(minStart);
                              } else {
                                dateStr = `${format(minStart)} - ${format(maxEnd)}`;
                              }
                              
                              const first = classItem.sessions[0];
                              if (first.startTime && first.endTime) {
                                const start = new Date(first.startTime);
                                const end = new Date(first.endTime);
                                timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                              }
                            }
                          }
                          return `${dateStr} | ${timeStr} | ${weekDays}`;
                        })()}
                      </Typography>

                      {/* 場館和球場資訊 */}
                      <Typography variant="body2" color="text.secondary" mb={1} sx={{ wordBreak: 'break-word', fontSize: '0.875rem' }}>
                        {(() => {
                          if (classItem.sessions && classItem.sessions.length > 0) {
                            const first = classItem.sessions[0];
                            const venue = first.venueName || (first.venue && first.venue.name) || '-';
                            const state = first.venueState || (first.venue && first.venue.state) || '-';
                            return `Venue: ${venue} | State: ${state}`;
                          }
                          return 'Venue: - | State: -';
                        })()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1} sx={{ wordBreak: 'break-word', fontSize: '0.875rem' }}>
                        {(() => {
                          if (classItem.sessions && classItem.sessions.length > 0) {
                            const first = classItem.sessions[0];
                            // 更健壯的場地信息獲取邏輯
                            let court = '-';
                            
                            // 嘗試多種可能的場地信息來源
                            if (first.courtName) {
                              court = first.courtName;
                            } else if (first.court && first.court.name) {
                              court = first.court.name;
                            } else if (first.court && typeof first.court === 'string') {
                              court = first.court;
                            } else if (first.court && first.court.id) {
                              court = `Court ${first.court.id}`;
                            }
                            
                            // 調試信息
                            console.log('Court debug for session', first.id, ':', {
                              courtName: first.courtName,
                              court: first.court,
                              courtType: typeof first.court,
                              finalCourt: court
                            });
                            
                            return `Court: ${court}`;
                          }
                          return 'Court: -';
                        })()}
                      </Typography>

                      {/* 學生數量進度條 */}
                      <Box mb={1}>
                        <Typography variant="body2" display="flex" justifyContent="space-between">
                          <span>Students</span>
                          <span>{classItem.totalStudents || 0} / {classItem.capacity}</span>
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={classItem.capacity > 0 ? (classItem.totalStudents / classItem.capacity) * 100 : 0}
                          sx={{ height: 8, borderRadius: 5, my: 0.5 }}
                          color={classItem.totalStudents >= classItem.capacity ? 'error' : 'primary'}
                        />
                      </Box>

                      {/* 課程進度條 */}
                      <Box mb={1}>
                        <Typography variant="body2" display="flex" justifyContent="space-between">
                          <span>Sessions</span>
                          <span>{completedCount} / {classItem.sessions ? classItem.sessions.length : 0}</span>
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={
                            (classItem.sessions && classItem.sessions.length > 0)
                              ? (completedCount / classItem.sessions.length) * 100
                              : 0
                          }
                          sx={{ height: 8, borderRadius: 5, my: 0.5 }}
                          color="secondary"
                        />
                      </Box>

                      {/* 出席率進度條 */}
                      <Box mb={2}>
                        <Typography variant="body2" display="flex" justifyContent="space-between">
                          <span>Attendance Rate</span>
                          <span>{attendanceRate}%</span>
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={parseFloat(attendanceRate)} 
                          sx={{ height: 8, borderRadius: 5, my: 0.5 }} 
                          color={parseFloat(attendanceRate) >= 80 ? 'success' : parseFloat(attendanceRate) >= 60 ? 'warning' : 'error'}
                        />
                      </Box>

                      {/* 操作按鈕 */}
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          fullWidth
                          onClick={() => handleTakeAttendance(classItem)}
                          disabled={classStatus === 'completed'}
                        >
                          TAKE ATTENDANCE
                        </Button>
                        {/* 出席記錄按鈕 */}
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setAttendanceSessionId(classItem.recurringGroupId);
                            setModalType('selectSession');
                            setShowModal(true);
                          }}
                          sx={{
                            borderColor: '#1976d2',
                            color: '#1976d2',
                            '&:hover': {
                              borderColor: '#1565c0',
                              backgroundColor: 'rgba(25, 118, 210, 0.04)'
                            },
                            minWidth: '120px'
                          }}
                        >
                          Record Attendance
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            });
          })()}
        </Grid>
        
        {/* 分頁導航 */}
        {(() => {
          const filtered = classes.filter(classItem => {
            const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (statusFilter === 'all') return matchesSearch;
            
            const classStatus = (() => {
              if (classItem.sessions && classItem.sessions.length > 0) {
                const now = new Date();
                const futureSessions = classItem.sessions.filter(s => 
                  s.startTime && new Date(s.startTime) > now
                );
                const pastSessions = classItem.sessions.filter(s => 
                  s.startTime && new Date(s.startTime) <= now
                );
                
                if (futureSessions.length > 0 && pastSessions.length > 0) {
                  return 'ongoing';
                } else if (futureSessions.length > 0) {
                  return 'upcoming';
                } else {
                  return 'completed';
                }
              }
              return 'unknown';
            })();
            
            return matchesSearch && classStatus === statusFilter;
          });
          
          const filteredTotalPages = Math.ceil(filtered.length / classesPerPage);
          
          return filteredTotalPages > 1 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                sx={{ borderRadius: 2 }}
              >
                Previous
              </Button>
              <Typography variant="body2" sx={{ px: 2 }}>
                Page {currentPage + 1} of {filteredTotalPages}
              </Typography>
              <Button
                variant="outlined"
                onClick={handleNextPage}
                disabled={currentPage === filteredTotalPages - 1}
                sx={{ borderRadius: 2 }}
              >
                Next
              </Button>
            </Box>
          ) : null;
        })()}
      </Box>
    );
  };

  // --- Student List Tab ---
  const StudentList = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>All Students</Typography>
      </Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {students.map((student) => {
          // 計算學生註冊的課程數量
          const registeredClasses = classes.filter(c => 
            c.sessions.some(s => 
              s.registrations && s.registrations.some(reg => 
                (reg.memberId || reg.id) === student.memberId
              )
            )
          );
          
          // 計算學生的session統計
          let totalSessions = 0;
          let completedSessions = 0;
          let presentSessions = 0;
          
          classes.forEach(classItem => {
            if (classItem.sessions) {
              classItem.sessions.forEach(session => {
                if (session.registrations) {
                  const studentRegistration = session.registrations.find(reg => 
                    (reg.memberId || reg.id) === student.memberId
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
                    // 检查学生是否出席
                    if (studentRegistration.attendanceStatus === 'PRESENT') {
                      presentSessions++;
                    }
                  }
                }
              });
            }
          });
          
          const progress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
          const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;
          
          return (
            <Card
              key={student.memberId}
              sx={{ minWidth: 280, cursor: 'pointer', transition: '0.2s', '&:hover': { boxShadow: 6 } }}
              onClick={() => {
                setSelectedStudent(student);
                setModalType('studentDetail');
                setShowModal(true);
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {(student.name || student.username || 'S').charAt(0)}
                  </Avatar>
                  <Box flex={1}>
                    <Typography fontWeight={600}>
                      {student.username || student.name || 'Unknown Student'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {registeredClasses.length} class{registeredClasses.length !== 1 ? 'es' : ''} registered
                    </Typography>
                  </Box>
                  <Chip
                    label={student.status || 'active'}
                    color={(student.status || 'active') === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Box mb={1}>
                  <Typography variant="body2">Sessions: {completedSessions}/{totalSessions}</Typography>
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 5, my: 0.5 }} />
                </Box>
                <Box mb={1}>
                  <Typography variant="body2">Attendance Rate: {attendanceRate.toFixed(0)}%</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={attendanceRate} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3, 
                      my: 0.5,
                      backgroundColor: 'rgba(156, 39, 176, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'purple'
                      }
                    }} 
                  />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <StarRating rating={student.rating || 0} />
                    <Typography variant="body2" color="text.secondary">{student.rating || 0}</Typography>
                  </Box>
                  {(student.missedSessions || 0) > 0 && (
                    <Box display="flex" alignItems="center" gap={0.5} color="error.main">
                      <AccessTime fontSize="small" />
                      <Typography variant="body2">{student.missedSessions || 0}</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );

  // --- Session Selection Modal ---
  const SessionSelectionModal = () => {
    const classItem = classes.find(c => c.recurringGroupId === attendanceSessionId);
    if (!classItem) return null;

    return (
      <Dialog open={showModal && modalType === 'selectSession'} onClose={() => setShowModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select Session for Attendance</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select which specific session you want to take attendance for:
          </Typography>
          <Stack spacing={2}>
            {classItem.sessions.map((session) => (
              <Card key={session.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}>
                <CardContent onClick={async () => {
                  try {
                    console.log('Loading attendance data for session:', session.id);
                    
                    // 重置狀態
                    setTodayAttendance({});
                    setStudentFeedbacks({});
                    setSavedAttendanceData(null);
                    setIsEditing(false);
                    
                    // 嘗試從後端獲取已保存的考勤數據
                    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081'}/api/coach/session/${session.id}/attendance`, {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                      }
                    });
                    
                    if (response.ok) {
                      const attendanceData = await response.json();
                      console.log('Loaded attendance data:', attendanceData);
                      
                      if (attendanceData.hasAttendanceData) {
                        // 如果有已保存的數據，設置到狀態中
                        const savedAttendance = attendanceData.attendance || {};
                        const savedFeedbacks = attendanceData.feedbacks || {};
                        
                        setTodayAttendance(savedAttendance);
                        setStudentFeedbacks(savedFeedbacks);
                        setSavedAttendanceData({
                          sessionId: session.id,
                          attendance: savedAttendance,
                          feedbacks: savedFeedbacks
                        });
                        setIsEditing(false); // 确保是查看模式
                        console.log('Restored saved attendance data:', {
                          attendance: savedAttendance,
                          feedbacks: savedFeedbacks
                        });
                      } else {
                        // 没有已保存的数据，重置状态
                        setTodayAttendance({});
                        setStudentFeedbacks({});
                        setSavedAttendanceData(null);
                        setIsEditing(false);
                        console.log('No saved data found, starting fresh');
                      }
                    } else {
                      console.log('No saved attendance data found for this session');
                      // 重置状态
                      setTodayAttendance({});
                      setStudentFeedbacks({});
                      setSavedAttendanceData(null);
                      setIsEditing(false);
                    }
                  } catch (error) {
                    console.error('Error loading attendance data:', error);
                    // 即使加載失敗，也繼續打開考勤模態框
                  }
                  
                  setSelectedSessionForAttendance(session);
                  setModalType('attendance');
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{session.title || classItem.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {session.startTime ? new Date(session.startTime).toLocaleDateString() : ''} | 
                        {session.startTime ? new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} - 
                        {session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Venue: {session.venue?.name || session.venueName || '-'} | 
                        Court: {session.court?.name || session.courtName || '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Students: {session.registrations ? session.registrations.length : 0}
                      </Typography>
                    </Box>
                    <Chip 
                      label={session.status || 'Scheduled'} 
                      color={session.status === 'COMPLETED' ? 'success' : 'primary'} 
                      size="small" 
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // --- Attendance Modal ---
  const AttendanceModal = useCallback(() => {
    if (!selectedSessionForAttendance) return null;
    
    // 只顯示這個具體 session 的學生
    const sessionStudents = selectedSessionForAttendance.registrations || [];

    // 檢查是否到了課程日期
    const isSessionDateReached = (() => {
      if (!selectedSessionForAttendance?.startTime) return false;
      const sessionDate = new Date(selectedSessionForAttendance.startTime);
      const today = new Date();
      const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      return sessionDateOnly <= todayOnly;
    })();

    // 移除 canTakeAttendance 限制，讓出席記錄始終可用
    const canTakeAttendance = true;

    return (
      <Dialog open={showModal && modalType === 'attendance'} onClose={() => setShowModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Take Attendance - {selectedSessionForAttendance.title || 'Session'}
          {savedAttendanceData && (
            <Chip 
              label={isEditing ? "Editing" : "Saved"} 
              color={isEditing ? "warning" : "success"} 
              size="small" 
              sx={{ ml: 2 }}
              icon={isEditing ? <Edit /> : <CheckCircle />}
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={2} p={2} bgcolor="#f8f9fa" borderRadius={1}>
            <Typography variant="body2" color="text.secondary">
              Date: {selectedSessionForAttendance.startTime ? new Date(selectedSessionForAttendance.startTime).toLocaleDateString() : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Time: {selectedSessionForAttendance.startTime ? new Date(selectedSessionForAttendance.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} - 
              {selectedSessionForAttendance.endTime ? new Date(selectedSessionForAttendance.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Venue: {selectedSessionForAttendance.venue?.name || selectedSessionForAttendance.venueName || '-'} | 
              Court: {selectedSessionForAttendance.court?.name || selectedSessionForAttendance.courtName || '-'}
            </Typography>
            {isEditing && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                ✏️ Edit Mode: You can now modify attendance and feedback
              </Typography>
            )}
            {savedAttendanceData && !isEditing && (
              <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                ✅ Data saved successfully. Click "Edit" to make changes.
              </Typography>
            )}
          </Box>
          <Stack spacing={2}>
            {sessionStudents.length === 0 ? (
              <Typography color="text.secondary">No students registered for this session.</Typography>
            ) : (
              sessionStudents.map((student) => {
                console.log('Student data in attendance modal:', student);
                const stableKey = `student-${student.registrationId || student.memberId || student.id || 'unknown'}`;
                return (
                  <Box key={stableKey} display="flex" flexDirection="column" p={2} bgcolor="#f5f5f5" borderRadius={2} mb={2}>
                    {/* 學生基本資訊和點名按鈕 */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                          {student.name?.charAt(0) || student.username?.charAt(0) || 'S'}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={500}>
                            {student.username || student.name || 'Unknown Student'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {student.name && student.username && student.name !== student.username ? student.name : ''}
                            {student.phone ? (student.name && student.username && student.name !== student.username ? ' | ' : '') + student.phone : ''}
                            {student.email && !student.username && !student.name ? student.email : ''}
                          </Typography>
                          {isEditing && (
                            <Typography variant="caption" color="warning.main" sx={{ fontWeight: 'bold' }}>
                              ✏️ Editing enabled
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant={(() => {
                            const studentId = String(student.memberId || student.id || '').trim();
                            if (studentId) {
                              // 優先使用當前編輯的數據
                              if (todayAttendance[studentId] !== undefined) {
                                return todayAttendance[studentId] === true ? 'contained' : 'outlined';
                              }
                              // 如果沒有當前編輯數據，使用已保存的數據
                              if (savedAttendanceData && savedAttendanceData.attendance[studentId] !== undefined) {
                                return savedAttendanceData.attendance[studentId] === true ? 'contained' : 'outlined';
                              }
                            }
                            return 'outlined';
                          })()}
                          color="success"
                          disabled={!isEditing && savedAttendanceData} // 非编辑模式下禁用
                          onClick={() => {
                            const studentId = String(student.memberId || student.id || '').trim();
                            if (studentId && (isEditing || !savedAttendanceData)) {
                              console.log('Marking student', studentId, 'as present');
                              handleAttendanceCheck(studentId, true);
                            }
                          }}
                        >
                          Present
                        </Button>
                        <Button
                          size="small"
                          variant={(() => {
                            const studentId = String(student.memberId || student.id || '').trim();
                            if (studentId) {
                              // 優先使用當前編輯的數據
                              if (todayAttendance[studentId] !== undefined) {
                                return todayAttendance[studentId] === false ? 'contained' : 'outlined';
                              }
                              // 如果沒有當前編輯數據，使用已保存的數據
                              if (savedAttendanceData && savedAttendanceData.attendance[studentId] !== undefined) {
                                return savedAttendanceData.attendance[studentId] === false ? 'contained' : 'outlined';
                              }
                            }
                            return 'outlined';
                          })()}
                          color="error"
                          disabled={!isEditing && savedAttendanceData} // 非编辑模式下禁用
                          onClick={() => {
                            const studentId = String(student.memberId || student.id || '').trim();
                            if (studentId && (isEditing || !savedAttendanceData)) {
                              console.log('Marking student', studentId, 'as absent');
                              handleAttendanceCheck(studentId, false);
                            }
                          }}
                        >
                          Absent
                        </Button>
                      </Stack>
                    </Box>
                    
                    {/* Feedback 輸入框 - 支持編輯模式 */}
                    <TextField
                      label="Feedback for this student"
                      placeholder="Enter feedback, comments, or suggestions..."
                      defaultValue={(() => {
                        const studentId = String(student.memberId || student.id || '').trim();
                        if (studentId && savedAttendanceData && savedAttendanceData.feedbacks[studentId]) {
                          return savedAttendanceData.feedbacks[studentId];
                        }
                        return '';
                      })()}
                      onBlur={(e) => {
                        try {
                          const studentId = String(student.memberId || student.id || '').trim();
                          if (studentId) {
                            console.log('Saving feedback for student', studentId, ':', e.target.value);
                            setStudentFeedbacks(prev => ({
                              ...prev,
                              [studentId]: e.target.value
                            }));
                          }
                        } catch (error) {
                          console.error('Error updating feedback:', error);
                        }
                      }}
                      multiline
                      rows={2}
                      fullWidth
                      disabled={!isEditing && savedAttendanceData} // 非编辑模式下禁用输入
                      sx={{
                        '& .MuiInputBase-root': {
                          backgroundColor: isEditing ? 'white' : '#f5f5f5'
                        },
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)', // 保持文字颜色
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    />
                  </Box>
                );
              })
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          {isEditing ? (
            // 編輯模式：顯示 Cancel 和 Save Edit 按鈕
            <>
              <Button onClick={() => handleCancelEdit(false)} color="inherit">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                variant="contained"
                color="primary"
              >
                Save Edit
              </Button>
            </>
          ) : savedAttendanceData ? (
            // 已保存狀態：顯示 Edit 和 Close 按鈕
            <>
              <Button onClick={() => handleCancelEdit(true)} color="inherit">
                Close
              </Button>
              <Button 
                onClick={handleEdit}
                variant="outlined"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            // 初始狀態：顯示 Cancel 和 Save 按鈕
            <>
              <Button onClick={() => handleCancelEdit(true)} color="inherit">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAttendanceAndFeedback}
                variant="contained"
                color="primary"
              >
                Save Attendance & Feedback
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    );
  }, [selectedSessionForAttendance, showModal, modalType, todayAttendance, studentFeedbacks, handleAttendanceCheck, handleSaveAttendanceAndFeedback, isEditing, savedAttendanceData, handleCancelEdit, handleSaveEdit, handleEdit]);

  // --- Student Detail Modal ---
  const StudentDetailModal = () => {
    if (!selectedStudent) return null;
    const studentEvaluations = evaluations.filter(e => e.studentId === selectedStudent.memberId);
    
    // 获取学生参加的所有class sessions
    const studentSessions = [];
    classes.forEach(classItem => {
      if (classItem.sessions) {
        classItem.sessions.forEach(session => {
          if (session.registrations) {
            const studentRegistration = session.registrations.find(reg => 
              (reg.memberId || reg.id) === selectedStudent.memberId
            );
            if (studentRegistration) {
              studentSessions.push({
                ...session,
                className: classItem.name,
                classId: classItem.recurringGroupId,
                registration: studentRegistration
              });
            }
          }
        });
      }
    });
    
    // 计算学生统计
    let totalSessions = studentSessions.length;
    let completedSessions = studentSessions.filter(s => 
      s.status === 'COMPLETED' || 
      s.status === 'completed' || 
      s.attendanceTaken === true ||
      (s.registrations && s.registrations.some(reg => reg.attendanceStatus))
    ).length;
    let presentSessions = studentSessions.filter(s => 
      s.registration && s.registration.attendanceStatus === 'PRESENT'
    ).length;
    let absentSessions = studentSessions.filter(s => 
      s.registration && s.registration.attendanceStatus === 'ABSENT'
    ).length;
    
    const progress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;
    
    return (
      <Dialog open={showModal && modalType === 'studentDetail'} onClose={() => setShowModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Student Details</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" alignItems="center" gap={3} mb={3}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 32 }}>
              {(selectedStudent.name || selectedStudent.username || 'S').charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedStudent.username || selectedStudent.name || 'Unknown Student'}
              </Typography>
              <Typography color="text.secondary">{selectedStudent.level || 'Beginner'}</Typography>
            </Box>
          </Box>
          
          {/* 统计卡片 */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mb={3}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
                  <Person fontSize="small" /> Basic Information
                </Typography>
                <Typography variant="body2">
                  <Phone fontSize="small" sx={{ mr: 0.5 }} /> {selectedStudent.phone || 'No phone'}
                </Typography>
                <Typography variant="body2">
                  <Email fontSize="small" sx={{ mr: 0.5 }} /> {selectedStudent.email || 'No email'}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
                  <TrendingUp fontSize="small" /> Progress Statistics
                </Typography>
                <Typography variant="body2">Completed: {completedSessions}/{totalSessions} sessions</Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 5, my: 0.5 }} />
                <Typography variant="body2">Attendance Rate: {attendanceRate.toFixed(0)}%</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={attendanceRate} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3, 
                    my: 0.5,
                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'purple'
                    }
                  }} 
                />
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
                  <CheckCircle fontSize="small" /> Attendance Summary
                </Typography>
                <Typography variant="body2" color="success.main">Present: {presentSessions}</Typography>
                <Typography variant="body2" color="error.main">Absent: {absentSessions}</Typography>
                <Typography variant="body2" color="text.secondary">Not Recorded: {totalSessions - presentSessions - absentSessions}</Typography>
              </CardContent>
            </Card>
          </Stack>
          
          {/* Class Sessions 列表 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                <School fontSize="small" /> Class Sessions ({studentSessions.length})
              </Typography>
              {studentSessions.length > 0 ? (
                <Stack spacing={2}>
                  {studentSessions.map((session, index) => {
                    const sessionDate = new Date(session.startTime);
                    const isCompleted = session.status === 'COMPLETED' || 
                                       session.status === 'completed' || 
                                       session.attendanceTaken === true ||
                                       (session.registrations && session.registrations.some(reg => reg.attendanceStatus));
                    
                    return (
                      <Card key={session.id} variant="outlined" sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography fontWeight={600} variant="body2">
                              {session.className || session.title || 'Class'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {sessionDate.toLocaleDateString()} {sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {session.courtName || session.court?.name || 'Court'} • {session.venueName || session.venue?.name || 'Venue'}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                              label={isCompleted ? 'Completed' : 'Scheduled'} 
                              color={isCompleted ? 'success' : 'default'} 
                              size="small" 
                            />
                            {session.registration?.attendanceStatus && (
                              <Chip 
                                label={session.registration.attendanceStatus} 
                                color={session.registration.attendanceStatus === 'PRESENT' ? 'success' : 'error'} 
                                size="small" 
                              />
                            )}
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              ) : (
                <Typography color="text.secondary">No class sessions found for this student.</Typography>
              )}
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
                <Book fontSize="small" /> Coach Notes
              </Typography>
              <Typography variant="body2">{selectedStudent.notes || 'No notes available'}</Typography>
            </CardContent>
          </Card>
          
          <Stack direction="row" spacing={2} mb={3}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AccessTime />}
              onClick={() => {
                setModalType('makeup');
              }}
            >
              Request Makeup
            </Button>
          </Stack>
          {studentEvaluations.length > 0 && (
            <Box>
              <Typography fontWeight={600} mb={1}>Recent Evaluations</Typography>
              <Stack spacing={1}>
                {studentEvaluations.slice(-3).map((evaluation) => (
                  <Card key={evaluation.id} variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">{evaluation.date}</Typography>
                        <StarRating rating={evaluation.rating} />
                      </Box>
                      <Typography variant="body2">{evaluation.comments}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // --- Evaluation Modal ---
  const EvaluationModal = () => {
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');
    const [skills, setSkills] = useState({
      forehand: 0,
      backhand: 0,
      serve: 0,
      footwork: 0
    });
    return (
      <Dialog open={showModal && modalType === 'evaluation'} onClose={() => setShowModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Session Evaluation - {selectedStudent?.name}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography fontWeight={600} mb={1}>Overall Rating</Typography>
              <Box display="flex" gap={1}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconButton key={star} onClick={() => setRating(star)}>
                    <Star sx={{ color: star <= rating ? '#FFD600' : '#E0E0E0' }} />
                  </IconButton>
                ))}
              </Box>
            </Box>
            <Box>
              <Typography fontWeight={600} mb={1}>Skill Assessment</Typography>
              {Object.entries(skills).map(([skill, value]) => (
                <Box key={skill} mb={1}>
                  <Typography variant="body2" mb={0.5}>
                    {skill && skill.length > 0 ? skill.charAt(0).toUpperCase() + skill.slice(1) : skill}
                  </Typography>
                  <Box display="flex" gap={1}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IconButton key={star} onClick={() => setSkills(prev => ({ ...prev, [skill]: star }))}>
                        <Star sx={{ color: star <= value ? '#FFD600' : '#E0E0E0' }} fontSize="small" />
                      </IconButton>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
            <TextField
              label="Comments & Notes"
              multiline
              minRows={3}
              value={comments}
              onChange={e => setComments(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
          <Button
            onClick={() => handleAddEvaluation({ rating, comments, skills })}
            variant="contained"
            disabled={rating === 0}
          >
            Save Evaluation
          </Button>
        </DialogActions>
      </Dialog>
    );
  };



  return (
    <Box sx={{ p: { xs: 1, md: 4 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box maxWidth="lg" mx="auto">
        <Typography variant="h4" fontWeight={700} mb={3}>Student Management System</Typography>
        
        {/* 成功提示 */}
        {showSuccessMessage && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="success" onClose={() => setShowSuccessMessage(false)}>
              ✅ Attendance and feedback saved successfully! The data has been saved to the database.
            </Alert>
          </Box>
        )}
        
        <AppBar position="static" color="default" sx={{ borderRadius: 2, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            indicatorColor="primary"
            textColor="primary"
            variant="standard"
          >
            <Tab label="Class Overview" />
            <Tab label="All Students" />
          </Tabs>
        </AppBar>
        {activeTab === 0 && <ClassOverview />}
        {activeTab === 1 && <StudentList />}
        {showModal && modalType === 'selectSession' && <SessionSelectionModal />}
        {showModal && modalType === 'attendance' && <AttendanceModal />}
        {showModal && modalType === 'studentDetail' && <StudentDetailModal />}
        {showModal && modalType === 'evaluation' && <EvaluationModal />}
      </Box>
    </Box>
  );
};

export default StudentManagementSystem; 