import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#333',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        marginTop: 'auto',
      }}
    >
      <Typography variant="body2">
        &copy; {new Date().getFullYear()} Pickleball App. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
