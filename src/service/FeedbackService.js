import axios from 'axios';

class FeedbackService {
  static getFeedbackStats(targetType, targetId) {
    return axios.get(`/api/feedback/stats`, {
      params: { targetType, targetId }
    });
  }

  static getFeedbackForTarget(targetType, targetId) {
    return axios.get(`/api/feedback`, {
      params: { targetType, targetId }
    });
  }

  static createFeedback(feedbackData) {
    return axios.post('/api/feedback', feedbackData);
  }

  static updateFeedback(id, feedbackData) {
    return axios.put(`/api/feedback/${id}`, feedbackData);
  }

  static deleteFeedback(id) {
    return axios.delete(`/api/feedback/${id}`);
  }
}

export default FeedbackService;