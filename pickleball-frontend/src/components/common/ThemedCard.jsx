import React from 'react';
import { Card } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ThemedCard = ({ children, sx = {}, ...props }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[2],
        borderRadius: '12px',
        overflow: 'hidden',
        ...sx
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

export default ThemedCard; 