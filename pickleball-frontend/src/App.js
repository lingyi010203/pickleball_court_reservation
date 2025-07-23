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
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />

          {/* Profile section */}
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Rewards section */}
          <Route path="profile/rewards" element={
            <ProtectedRoute>
              <RewardsPage />
            </ProtectedRoute>
          } />

          {/* Booking history */}
          <Route path="profile/my-bookings" element={
            <ProtectedRoute>
              <BookingHistory />
            </ProtectedRoute>
          } />

          {/* Feedback routes */}
          <Route path="profile/my-feedback" element={
            <ProtectedRoute>
              <MyFeedbackPage />
            </ProtectedRoute>
          } />

          {/* Feedback form page */}
          <Route path="feedback" element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          } />

          {/* Court listing */}
          <Route path="courts" element={
            <ProtectedRoute>
              <CourtListPage />
            </ProtectedRoute>
          } />

          {/* Court details */}
          <Route path="courts/:id" element={
            <ProtectedRoute>
              <CourtDetailPage />
            </ProtectedRoute>
          } />

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
        
        {/* Wallet top-up page */}
        <Route path="wallet/topup" element={
          <ProtectedRoute>
            <WalletTopUpPage />
          </ProtectedRoute>
        } />

          {/* Booking confirmation page */}
          <Route path="booking/confirmation" element={
            <ProtectedRoute>
              <BookingConfirmationPage />
            </ProtectedRoute>
          } />

          {/* Event listing */}
          <Route path="events" element={
            <ProtectedRoute>
              <EventPage />
            </ProtectedRoute>
          } />

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
          <Route path="friendly-match" element={
            <ProtectedRoute>
              <FriendlyMatchPage />
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
      </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;