import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './components/profile/ProfilePage';
import RewardsPage from './components/profile/RewardsPage';
import FeedbackPage from './components/feedback/FeedbackPage'; // Feedback form page
import MyFeedbackPage from './components/feedback/MyFeedbackPage'; // New import for user's feedback list
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

const ProtectedRoute = ({ children }) => {
  const { authToken } = useAuth();
  return authToken ? children : <Navigate to="/login" replace />;
};

const AdminProtectedRoute = ({ children }) => {
  return UserService.isAdminLoggedIn() ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
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

        {/* Feedback routes - CORRECTED */}
        <Route path="profile/my-feedback" element={
          <ProtectedRoute>
            <MyFeedbackPage /> {/* Changed to MyFeedbackPage */}
          </ProtectedRoute>
        } />

        {/* Feedback form page */}
        <Route path="feedback" element={
          <ProtectedRoute>
            <FeedbackPage /> {/* Feedback form page */}
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
        
        {/* Booking confirmation page */}
        <Route path="booking/confirmation" element={
          <ProtectedRoute>
            <BookingConfirmationPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      } />
      
      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;