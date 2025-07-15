import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const EmptyState = ({
  icon = null,
  title = 'No Data Found',
  description = '',
  action = null,
  actionLabel = '',
  onAction = null,
  sx = {}
}) => (
  <Box sx={{ textAlign: 'center', py: 8, ...sx }}>
    {icon && (
      <Box sx={{
        width: 120,
        height: 120,
        bgcolor: '#e3f2fd',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 3
      }}>
        {icon}
      </Box>
    )}
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
      {title}
    </Typography>
    {description && (
      <Typography color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
        {description}
      </Typography>
    )}
    {action && (
      <Button variant="outlined" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState; 