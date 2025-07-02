import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

class HelpdeskService {
  static async askQuestion(question) {
    const token = localStorage.getItem('authToken');
    try {
      const response = await axios.post(
        `${API_URL}/api/helpdesk/ask`,
        question,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'text/plain'
          }
        }
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message ||
        error.response?.data ||
        "Failed to ask question";
      throw new Error(message);
    }
  }

  static async escalateToHumanSupport(queryId) {
    const token = localStorage.getItem('authToken');
    try {
      const response = await axios.post(
        `${API_URL}/api/helpdesk/escalate/${queryId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
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