import api from './api';

class FeedbackService {
  static getFeedbackStats(targetType, targetId) {
    return api.get(`/feedback/stats`, {
      params: { targetType, targetId }
    });
  }

  static getFeedbackForTarget(targetType, targetId) {
    return api.get(`/feedback`, {
      params: { targetType, targetId }
    });
  }

  static createFeedback(feedbackData) {
    return api.post('/feedback', feedbackData);
  }

  static updateFeedback(id, feedbackData) {
    return api.put(`/feedback/${id}`, feedbackData);
  }

  static deleteFeedback(id) {
    return api.delete(`/feedback/${id}`);
  }

  static getReviewableItems() {
    return api.get('/feedback/reviewable-items');
  }
}

export default FeedbackService;