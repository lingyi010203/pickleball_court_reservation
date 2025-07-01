import React from 'react';
import { Box } from '@mui/material';

const StarRating = ({ rating, size = 'medium' }) => {
  const iconSize = size === 'small' ? '1rem' : '1.5rem';
  
  return (
    <Box sx={{ display: 'flex' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Box
          key={star}
          sx={{
            fontSize: iconSize,
            color: rating >= star ? '#ffc107' : '#e0e0e0',
            lineHeight: 1,
            mr: 0.5
          }}
        >
          {rating >= star ? '★' : '☆'}
        </Box>
      ))}
    </Box>
  );
};

export default StarRating;