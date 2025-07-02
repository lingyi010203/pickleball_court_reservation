import React from 'react';
import { Box } from '@mui/material';

const StarRating = ({ rating, size = 'medium', interactive = false, onRatingChange }) => {
  const iconSize = size === 'small' ? '1rem' : '1.5rem';
  
  return (
    <Box sx={{ display: 'flex', cursor: interactive ? 'pointer' : 'default' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Box
          key={star}
          sx={{
            fontSize: iconSize,
            color: rating >= star ? '#ffc107' : '#e0e0e0',
            lineHeight: 1,
            mr: 0.5,
            transition: 'color 0.2s',
            cursor: interactive ? 'pointer' : 'default',
            userSelect: 'none'
          }}
          onClick={() => interactive && onRatingChange && onRatingChange(star)}
          onKeyDown={e => {
            if (interactive && (e.key === 'Enter' || e.key === ' ')) {
              onRatingChange && onRatingChange(star);
            }
          }}
          tabIndex={interactive ? 0 : -1}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `Set rating to ${star}` : undefined}
        >
          {rating >= star ? '★' : '☆'}
        </Box>
      ))}
    </Box>
  );
};

export default StarRating;