import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import StarRating from './StarRating';
import { format } from 'date-fns';

const FeedbackPage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [targetType, setTargetType] = useState('COURT');
  const [targetId, setTargetId] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [availableTargets, setAvailableTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch available targets based on selected type
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        setLoading(true);
        let endpoint = '';
        
        switch(targetType) {
          case 'COURT':
            endpoint = '/api/member/courts';
            break;
          case 'EVENT':
            endpoint = '/api/events';
            break;
          case 'COACH':
            endpoint = '/api/coaches';
            break;
          default:
            return;
        }

        const response = await axios.get(endpoint);
        setAvailableTargets(response.data);
      } catch (err) {
        setError('Failed to fetch available targets');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated()) {
      fetchTargets();
    }
  }, [targetType, isAuthenticated]);

  // Fetch feedback data when target changes
  useEffect(() => {
    const fetchFeedbackData = async () => {
      if (!targetId || !isAuthenticated()) return;
      
      try {
        setLoading(true);
        
        // Fetch feedback list
        const feedbackResponse = await axios.get('/api/feedback', {
          params: { targetType, targetId }
        });
        setFeedbackList(feedbackResponse.data);
        
        // Fetch stats
        const statsResponse = await axios.get('/api/feedback/stats', {
          params: { targetType, targetId }
        });
        setStats(statsResponse.data);
        
        // Check if current user has existing feedback
        const userFeedback = feedbackResponse.data.find(
          feedback => feedback.userName === currentUser.username
        );
        setEditingFeedback(userFeedback || null);
        
      } catch (err) {
        setError('Failed to load feedback data');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated()) {
      fetchFeedbackData();
    }
  }, [targetId, targetType, isAuthenticated, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      setError('Please log in to submit feedback');
      return;
    }
    
    if (!rating) {
      setError('Please select a rating before submitting');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      const feedbackData = {
        targetType,
        targetId,
        rating,
        review,
        tags: [] // Add tags if implemented
      };
      
      let response;
      
      if (editingFeedback) {
        // Update existing feedback
        response = await axios.put(
          `/api/feedback/${editingFeedback.id}`, 
          feedbackData
        );
        setSuccessMessage('Review updated successfully!');
      } else {
        // Create new feedback
        response = await axios.post('/api/feedback', feedbackData);
        setSuccessMessage('Feedback submitted successfully!');
      }
      
      // Update local state with new/updated feedback
      if (editingFeedback) {
        setFeedbackList(feedbackList.map(fb => 
          fb.id === response.data.id ? response.data : fb
        ));
      } else {
        setFeedbackList([response.data, ...feedbackList]);
      }
      
      // Reset form
      setRating(0);
      setReview('');
      setEditingFeedback(null);
      
      // Refresh stats
      const statsResponse = await axios.get('/api/feedback/stats', {
        params: { targetType, targetId }
      });
      setStats(statsResponse.data);
      
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!isAuthenticated()) {
      setError('Please log in to delete feedback');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/feedback/${feedbackId}`);
      
      // Update state
      setFeedbackList(feedbackList.filter(fb => fb.id !== feedbackId));
      setEditingFeedback(null);
      setRating(0);
      setReview('');
      
      // Refresh stats
      const statsResponse = await axios.get('/api/feedback/stats', {
        params: { targetType, targetId }
      });
      setStats(statsResponse.data);
      
      setSuccessMessage('Review deleted successfully');
    } catch (err) {
      setError('Failed to delete review');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (feedback) => {
    setEditingFeedback(feedback);
    setRating(feedback.rating);
    setReview(feedback.review || '');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Rate and Review</h1>
      
      {/* Selection Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Target</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">Target Type</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="COURT">Court</option>
              <option value="EVENT">Event</option>
              <option value="COACH">Coach</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">
              {targetType === 'COURT' ? 'Court' : 
               targetType === 'EVENT' ? 'Event' : 'Coach'}
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading || !isAuthenticated()}
            >
              <option value="">Select {targetType.toLowerCase()}</option>
              {availableTargets.map(target => (
                <option key={target.id} value={target.id}>
                  {target.name || target.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      {targetId && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Rating Overview</h2>
          <div className="flex items-center">
            <div className="text-4xl font-bold mr-4">
              {stats.averageRating.toFixed(1)}
            </div>
            <div>
              <StarRating rating={stats.averageRating} />
              <p className="text-gray-600 mt-1">
                {stats.totalReviews} reviews
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Feedback Form */}
      {targetId && isAuthenticated() && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingFeedback ? 'Edit Your Review' : 'Write a Review'}
          </h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <StarRating 
                rating={rating} 
                editable={true} 
                onRatingChange={setRating} 
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Review</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full p-2 border rounded"
                rows="4"
                placeholder="Share your experience..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {editingFeedback ? 'Update Review' : 'Submit Review'}
              </button>
              
              {editingFeedback && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingFeedback.id)}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Delete Review
                </button>
              )}
              
              {(editingFeedback || rating || review) && (
                <button
                  type="button"
                  onClick={() => {
                    setRating(0);
                    setReview('');
                    setEditingFeedback(null);
                  }}
                  className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}
      
      {targetId && !isAuthenticated() && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-yellow-700">
                You need to <a href="/login" className="text-blue-600 underline">log in</a> to submit reviews
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Reviews List */}
      {targetId && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Reviews ({feedbackList.length})
          </h2>
          
          {loading ? (
            <p>Loading reviews...</p>
          ) : feedbackList.length === 0 ? (
            <p>No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-6">
              {feedbackList.map(feedback => (
                <div 
                  key={feedback.id} 
                  className="border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{feedback.userName}</h3>
                      <p className="text-gray-500 text-sm">
                        {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    
                    {currentUser && currentUser.username === feedback.userName && (
                      <button
                        onClick={() => startEditing(feedback)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <StarRating rating={feedback.rating} />
                  </div>
                  
                  {feedback.review && (
                    <p className="text-gray-700">{feedback.review}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;