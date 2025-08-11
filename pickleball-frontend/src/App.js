import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CookiesPage from './pages/CookiesPage';
import AccessibilityPage from './pages/AccessibilityPage';

import ProfilePage from './components/profile/ProfilePage';
import RewardsPage from './components/profile/RewardsPage';
import FeedbackPage from './components/feedback/FeedbackPage';
import MyFeedbackPage from './components/feedback/MyFeedbackPage';


import AdminDashboard from './components/admin/AdminDashboard';
import MainLayout from './components/layout/MainLayout';
import UserService from './service/UserService';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResetPasswordEmailSent from './pages/ResetPasswordEmailSent';
import ResetPasswordSuccess from './pages/ResetPasswordSuccess';
import { AuthProvider, useAuth } from './context/AuthContext';
import CourtListPage from './components/court/CourtListPage';
import CourtDetailPage from './components/court/CourtDetailPage'; 
import BookingPage from './components/court/BookingPage'; 
import BookingHistory from './components/court/BookingHistory';
import BookingConfirmationPage from './components/court/BookingConfirmationPage'; 
import PaymentPage from './components/court/PaymentPage';
import WalletTopUpPage from './components/profile/WalletTopUpPage';
import WalletPage from './components/profile/WalletPage';
import WalletTransactionHistory from './components/profile/WalletTransactionHistory';
import EventPage from './components/event/EventPage';
import EventCreatePage from './components/event/EventCreatePage';
import EventEditPage from './components/event/EventEditPage';
import FriendlyMatchPage from './components/event/FriendlyMatchPage';
import FriendlyMatchCreatePage from './components/event/FriendlyMatchCreatePage';
import MessagingPage from './components/messaging/MessagingPage';
import HelpdeskPage from './components/helpdesk/HelpdeskPage';
import { SocketProvider } from './context/SocketContext';
import AdminManageUsers from './components/admin/AdminManageUsers';
import AdminManageTiers from './components/admin/AdminManageTiers';
import AdminManageCourts from './components/admin/AdminManageCourts';
import AdminManageVenues from './components/admin/AdminManageVenues';
import AdminManageBookings from './components/admin/AdminManageBookings';
import CoachScheduleManagement from './components/coach/CoachScheduleManagement';
import BrowseClassPage from './components/class/BrowseClassPage';
import ClassSessionRegisterPage from './components/class/ClassSessionRegisterPage';
import CoachingDashboard from './components/coach/CoachingDashboard';
import StudentManagementSystem from './components/coach/StudentManagementSystem';
import MyClassSessionsPage from './components/profile/MyClassSessionsPage';
import RedeemVoucherPage from './components/profile/RedeemVoucherPage';
import AdminSettings from './components/admin/AdminSettings';
import CourtAvailabilityPage from './components/court/CourtAvailabilityPage';
import ProfileOverview from './components/profile/ProfileOverview';
import EditProfileForm from './components/profile/EditProfileForm';
import AdminModerationDashboard from './components/admin/AdminModerationDashboard';
import EventOrganizerDashboard from './components/event/EventOrganizerDashboard';


const ProtectedRoute = ({ children }) => {
  const { authToken } = useAuth();
  return authToken ? children : <Navigate to="/login" replace />;
};

const AdminProtectedRoute = ({ children }) => {
  const { authToken, currentUser } = useAuth();
  
  // Check multiple ways admin could be logged in:
  // 1. UserService admin token (for admin-specific login)
  // 2. AuthContext token with admin role/userType
  // 3. Check if currentUser exists and has admin role
  const isAdminLoggedIn = UserService.isAdminLoggedIn() || 
    (authToken && currentUser && (
      currentUser.userType === 'Admin' || 
      currentUser.userType === 'ADMIN' || 
      currentUser.role === 'Admin' || 
      currentUser.role === 'ADMIN'
    ));
  
  console.log('AdminProtectedRoute check:', {
    userServiceAdmin: UserService.isAdminLoggedIn(),
    authToken: !!authToken,
    currentUser: !!currentUser,
    userType: currentUser?.userType,
    role: currentUser?.role,
    isAdminLoggedIn
  });
  
  return isAdminLoggedIn ? children : <Navigate to="/login" replace />;
};

function AdminDashboardLayout() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <AdminDashboard><Outlet /></AdminDashboard>
    </div>
  );
}

function HomeRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <HomePage />;
  if (currentUser.userType === 'Coach' || currentUser.userType === 'COACH') {
    return <Navigate to="/coaching" replace />;
  }
  if (currentUser.userType === 'EventOrganizer' || currentUser.userType === 'EVENTORGANIZER') {
    return <Navigate to="/event-organizer" replace />;
  }
  return <HomePage />;
}

function App() {
  const { currentUser } = useAuth();

  // Coach 專屬路由：只顯示 CoachScheduleManagement
  if (currentUser?.userType === 'Coach' || currentUser?.userType === 'COACH') {
    return (
      <SocketProvider>
        <Routes>
          <Route path="/coaching" element={<CoachingDashboard />} />
          <Route path="/coaching/schedulemanagement" element={<CoachScheduleManagement />} />
          <Route path="/coaching/students" element={<StudentManagementSystem />} />
          <Route path="/messages" element={<MessagingPage />} />
          <Route path="*" element={<Navigate to="/coaching" replace />} />
        </Routes>
      </SocketProvider>
    );
  }

  // EventOrganizer 專屬路由
  if (currentUser?.userType === 'EventOrganizer' || currentUser?.userType === 'EVENTORGANIZER') {
    return (
      <SocketProvider>
        <Routes>
          <Route path="/event-organizer" element={<EventOrganizerDashboard />} />
          <Route path="/event-organizer/create" element={<EventOrganizerDashboard />} />
          <Route path="/events/create" element={<EventCreatePage />} />
          <Route path="/events/edit/:eventId" element={<EventEditPage />} />
          <Route path="/messages" element={<MessagingPage />} />
          <Route path="*" element={<Navigate to="/event-organizer" replace />} />
        </Routes>
      </SocketProvider>
    );
  }

  // 其他 user 正常顯示 MainLayout
  return (
    <SocketProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password-email-sent" element={<ResetPasswordEmailSent />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/reset-password-success" element={<ResetPasswordSuccess />} />



        {/* Protected user routes with layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          
          {/* Profile routes */}
          <Route path="profile" element={<ProfilePage />}>
            <Route index element={<ProfileOverview />} />
            <Route path="rewards" element={
              <ProtectedRoute>
                <RewardsPage />
              </ProtectedRoute>
            } />
            <Route path="my-bookings" element={
              <ProtectedRoute>
                <BookingHistory />
              </ProtectedRoute>
            } />
            <Route path="my-feedback" element={
              <ProtectedRoute>
                <MyFeedbackPage />
              </ProtectedRoute>
            } />
            <Route path="my-class-sessions" element={
              <ProtectedRoute>
                <MyClassSessionsPage />
              </ProtectedRoute>
            } />
            <Route path="wallet" element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            } />
            <Route path="wallet/transactions" element={
              <ProtectedRoute>
                <WalletTransactionHistory />
              </ProtectedRoute>
            } />
            <Route path="edit-profile" element={
              <ProtectedRoute>
                <EditProfileForm />
              </ProtectedRoute>
            } />
            <Route path="redeem-voucher" element={
              <ProtectedRoute>
                <RedeemVoucherPage />
              </ProtectedRoute>
            } />
            <Route path="notifications" element={null} />
            <Route path="my-games" element={null} />
            <Route path="my-invoices" element={null} />
          </Route>

          {/* Feedback form page */}
          <Route path="feedback" element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          } />

          {/* Court listing */}
          <Route path="courts" element={<CourtListPage />} />

          {/* Court details */}
          <Route path="courts/:id" element={<CourtDetailPage />} />

          {/* Booking flow */}
          <Route path="booking/:courtId" element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } />

          {/* Payment page */}
          <Route path="payment" element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          } />

          {/* Booking confirmation page */}
          <Route path="booking/confirmation" element={
            <ProtectedRoute>
              <BookingConfirmationPage />
            </ProtectedRoute>
          } />

          {/* Wallet top-up page */}
          <Route path="wallet/topup" element={
            <ProtectedRoute>
              <WalletTopUpPage />
            </ProtectedRoute>
          } />

          {/* Event listing */}
          <Route path="events" element={<EventPage />} />

          {/* Event creation */}
          <Route path="events/create" element={
            <ProtectedRoute>
              <EventCreatePage />
            </ProtectedRoute>
          } />

          {/* Event editing */}
          <Route path="events/edit/:eventId" element={
            <ProtectedRoute>
              <EventEditPage />
            </ProtectedRoute>
          } />

          {/* Friendly Match page */}
          <Route path="friendly-matches" element={<FriendlyMatchPage />} />

          {/* Friendly Match create page */}
          <Route path="friendly-matches/create" element={
            <ProtectedRoute>
              <FriendlyMatchCreatePage />
            </ProtectedRoute>
          } />

          {/* Messaging page */}
          <Route path="messages" element={
            <ProtectedRoute>
              <MessagingPage />
            </ProtectedRoute>
          } />

          {/* Helpdesk page */}
          <Route path="helpdesk" element={
            <ProtectedRoute>
              <HelpdeskPage />
            </ProtectedRoute>
          } />

          <Route path="court-availability" element={<CourtAvailabilityPage />} />

          {/* User-side: Browse available coaching sessions */}
          <Route path="coaching/browse" element={<BrowseClassPage />} />
          <Route path="class/:id" element={<ClassSessionRegisterPage />} />
          <Route path="class/:id/register" element={<ClassSessionRegisterPage />} />

          {/* Footer Links - Public Pages */}
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          {/* sitemap removed */}
          <Route path="cookies" element={<CookiesPage />} />
          <Route path="accessibility" element={<AccessibilityPage />} />
          {/* community removed */}
        </Route>

        {/* Admin routes with nested structure */}
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <AdminDashboardLayout />
          </AdminProtectedRoute>
        }>
          <Route path="dashboard" element={<div />} /> {/* Dashboard home, content handled in AdminDashboard */}
          <Route path="users" element={<AdminManageUsers />} />
          <Route path="tiers" element={<AdminManageTiers />} />
          <Route path="courts" element={<AdminManageCourts />} />
          <Route path="venues" element={<AdminManageVenues />} />
          <Route path="bookings" element={<AdminManageBookings />} />
          <Route path="booking/:courtId" element={<BookingPage />} />
          <Route path="feedback" element={<AdminModerationDashboard />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;