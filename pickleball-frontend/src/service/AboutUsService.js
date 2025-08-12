import api from '../api/axiosConfig';

class AboutUsService {
    async getAboutUsStatistics() {
        try {
            const response = await api.get('/about-us/statistics');
            return response.data;
        } catch (error) {
            console.error('Error fetching About Us statistics:', error);
            // 返回默認值以防錯誤
            return {
                activeCourts: 0,
                totalMembers: 0,
                averageRating: 0.0,
                matchesPlayed: 0
            };
        }
    }
}

export default new AboutUsService();
