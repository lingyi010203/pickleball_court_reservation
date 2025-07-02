import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Box, Typography, CircularProgress, Alert, Button, Grid, Card, CardContent } from '@mui/material';
import StarRating from './StarRating';

const MyFeedbackPage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) return;

    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/feedback/user');
        setFeedbackList(response.data);
      } catch (err) {
        setError('Failed to load your feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [isAuthenticated]);

  if (!isAuthenticated()) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          You need to log in to view your feedback.
        </Alert>
        <Button variant="contained" href="/login">
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        My Feedback
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : feedbackList.length === 0 ? (
        <Typography>You haven't submitted any feedback yet.</Typography>
      ) : (
        <Grid container spacing={2}>
          {feedbackList.map(feedback => (
            <Grid item xs={12} sm={6} key={feedback.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{feedback.targetName}</Typography>
                  <Typography color="textSecondary">
                    {feedback.targetType} • {new Date(feedback.createdAt).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ my: 1 }}>
                    <StarRating rating={feedback.rating} />
                  </Box>
                  <Typography>{feedback.review}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyFeedbackPage;