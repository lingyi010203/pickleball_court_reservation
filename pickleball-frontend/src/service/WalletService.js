import axios from 'axios';

export const getWalletBalance = async () => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('/api/member/wallet/balance', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Full wallet response:', response.data);
        
        // Check if response has expected structure
        if (response.data && typeof response.data.balance === 'number') {
            return response.data.balance;
        }
        
        // Handle unexpected response structure
        console.error('Unexpected wallet response structure:', response.data);
        throw new Error('Unexpected response from server');
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        throw new Error('Failed to fetch wallet balance: ' + (error.response?.data?.message || error.message));
    }
};

export const initializeWallet = async () => {
  try {
    const token = localStorage.getItem('token');
    await axios.post('/api/member/wallet/init', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    console.error('Error initializing wallet:', error);
    throw error;
  }
};