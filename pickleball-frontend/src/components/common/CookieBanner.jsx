import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useCookieConsent } from '../../context/CookieConsentContext';

const CookieBanner = () => {
  const { prefs, acceptAll, rejectNonEssential, isReady } = useCookieConsent();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isReady) return null;
  const hasMadeChoice = prefs.lastUpdated !== null;
  if (hasMadeChoice || dismissed) return null;

  return (
    <Paper elevation={6} sx={{
      position: 'fixed',
      bottom: 16,
      left: 16,
      right: 16,
      zIndex: 2000,
      p: 2.5,
      borderRadius: 3,
      backdropFilter: 'blur(10px)'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ flex: 1 }}>
          We use cookies to enhance your experience. Manage preferences in Cookies Policy.
        </Typography>
        <Button variant="outlined" onClick={rejectNonEssential} sx={{ mr: 1 }}>Reject</Button>
        <Button variant="contained" onClick={acceptAll}>Accept</Button>
        <Button size="small" onClick={() => setDismissed(true)} sx={{ ml: 1, color: 'text.secondary' }}>Later</Button>
      </Box>
    </Paper>
  );
};

export default CookieBanner;


