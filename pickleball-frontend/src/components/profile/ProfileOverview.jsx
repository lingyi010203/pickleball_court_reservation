import React from 'react';
import { Box, Grid } from '@mui/material';
import ProfileStats from './ProfileStats';
import RecentBookings from './RecentBookings';
import RecentInvoices from './RecentInvoices';

const ProfileOverview = ({ profile }) => {
  return (
    <>
      {/* Activity Overview Section */}
      <Box sx={{
        backgroundColor: 'white',
        borderRadius: '16px',
        p: 5,
        mb: 1
      }}>
        <ProfileStats profile={profile} />
      </Box>

      {/* Recent Activity Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Box sx={{
            height: 'auto',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            p: 3
          }}>
            <RecentBookings />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{
            height: 'auto',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            p: 3
          }}>
            <RecentInvoices />
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default ProfileOverview;