import api from './api';

class HelpdeskService {
  static async askQuestion(question) {
    try {
      const response = await api.post('/helpdesk/ask', question, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message ||
        error.response?.data ||
        "Failed to ask question";
      throw new Error(message);
    }
  }

  static async escalateToHumanSupport(queryId) {
    try {
      const response = await api.post(`/helpdesk/escalate/${queryId}`, {});
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message ||
        error.response?.data ||
        "Failed to escalate query";
      throw new Error(message);
    }
  }
}

export default HelpdeskService; 