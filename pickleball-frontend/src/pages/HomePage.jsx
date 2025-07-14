import React from 'react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { currentUser, isAuthenticated } = useAuth();

  return (
    <div style={{ textAlign: 'center', marginTop: '60px' }}>
      <h2>Welcome to the Pickleball App!</h2>
      {isAuthenticated() && currentUser ? (
        <p style={{ fontSize: '1.2rem', color: '#4caf50' }}>
          Hello, <b>{currentUser.username}</b>! You are logged in.
        </p>
      ) : (
        <p style={{ fontSize: '1.1rem', color: '#888' }}>
          Please log in to access your profile and bookings.
        </p>
      )}
    </div>
  );
};

export default HomePage;