import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './components/profile/ProfilePage';
import RewardsPage from './components/profile/RewardsPage';
import FeedbackPage from './components/feedback/FeedbackPage';
import MyFeedbackPage from './components/feedback/MyFeedbackPage';

import AdminLogin from './components/admin/AdminLogin';
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
import MessagingPage from './components/messaging/MessagingPage';
import HelpdeskPage from './components/helpdesk/HelpdeskPage';
import { SocketProvider } from './context/SocketContext';
import AdminManageUsers from './components/admin/AdminManageUsers';
import AdminManageTiers from './components/admin/AdminManageTiers';
import AdminManageCourts from './components/admin/AdminManageCourts';
import AdminManageBookings from './components/admin/AdminManageBookings';
import AdminSettings from './components/admin/AdminSettings';
import CourtAvailabilityPage from './components/court/CourtAvailabilityPage';
import ProfileOverview from './components/profile/ProfileOverview';
import EditProfileForm from './components/profile/EditProfileForm';
import AdminModerationDashboard from './components/admin/AdminModerationDashboard';

const ProtectedRoute = ({ children }) => {
  const { authToken } = useAuth();
  return authToken ? children : <Navigate to="/login" replace />;
};

const AdminProtectedRoute = ({ children }) => {
  return UserService.isAdminLoggedIn() ? children : <Navigate to="/admin/login" replace />;
};

function AdminDashboardLayout() {
  return <AdminDashboard><Outlet /></AdminDashboard>;
}

function App() {
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
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected user routes with layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="profile" element={<ProfilePage />}>
            <Route index element={<ProfileOverview />} />
            <Route path="my-bookings" element={<BookingHistory />} />
            <Route path="edit-profile" element={null} />
            <Route path="notifications" element={null} />
            {/* 其它 profile 子页面可继续添加 */}
          </Route>
          <Route path="profile/rewards" element={<RewardsPage />} />
          <Route path="profile/my-feedback" element={<MyFeedbackPage />} />
          <Route path="profile/wallet" element={<WalletPage />} />
          <Route path="profile/wallet/transactions" element={<WalletTransactionHistory />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="courts" element={<CourtListPage />} />
          <Route path="courts/:id" element={<CourtDetailPage />} />
          <Route path="booking/:courtId" element={<BookingPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="wallet/topup" element={<WalletTopUpPage />} />
          <Route path="booking/confirmation" element={<BookingConfirmationPage />} />
          <Route path="events" element={<EventPage />} />
          <Route path="events/create" element={<EventCreatePage />} />
          <Route path="events/edit/:eventId" element={<EventEditPage />} />
          <Route path="friendly-match" element={<FriendlyMatchPage />} />
          <Route path="messages" element={<MessagingPage />} />
          <Route path="helpdesk" element={<HelpdeskPage />} />
          <Route path="court-availability" element={<CourtAvailabilityPage />} />
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
          <Route path="bookings" element={<AdminManageBookings />} />
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