import api from '../api/axiosConfig';

export const getWalletBalance = async () => {
  try {
    const { data } = await api.get('/member/wallet/balance');
    return data.balance;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw new Error('Failed to fetch wallet balance: ' + 
      (error?.response?.data?.message || error?.message || 'Unknown error'));
  }
};

export const initializeWallet = async () => {
  try {
    await api.post('/member/wallet/init', {});
  } catch (error) {
    console.error('Error initializing wallet:', error);
    throw new Error('Failed to initialize wallet: ' + 
      (error?.response?.data?.message || error?.message || 'Unknown error'));
  }
};

export const topUpWallet = async (amount, source = 'BANK_CARD') => {
  try {
    const { data } = await api.post('/member/wallet/topup', {
      amount,
      source
    });
    return data;
  } catch (error) {
    console.error('Error topping up wallet:', error);
    throw new Error('Failed to top up wallet: ' + 
      (error?.response?.data?.message || error?.message || 'Unknown error'));
  }
};