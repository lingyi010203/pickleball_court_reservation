import React from 'react';
import { Box, Typography } from '@mui/material';

const DetailItem = ({ label, value }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
};

export default DetailItem;