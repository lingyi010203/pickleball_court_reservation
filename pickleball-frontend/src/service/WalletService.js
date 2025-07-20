import api from './api';

export const getWalletBalance = async () => {
  try {
    const { data } = await api.get('/member/wallet/balance');
    return data.balance;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw new Error('Failed to fetch wallet balance: ' + 
      (error?.response?.data?.error || error?.message || 'Unknown error'));
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
      (error?.response?.data?.error || error?.message || 'Unknown error'));
  }
};

export const getWalletTransactions = async (page = 0, size = 10) => {
  try {
    const { data } = await api.get('/member/wallet/transactions', {
      params: { page, size }
    });
    return data;
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    throw new Error('Failed to fetch wallet transactions: ' + 
      (error?.response?.data?.error || error?.message || 'Unknown error'));
  }
};

export const getWalletDetails = async () => {
  try {
    const { data } = await api.get('/member/wallet/details');
    return data;
  } catch (error) {
    console.error('Error fetching wallet details:', error);
    throw new Error('Failed to fetch wallet details: ' + 
      (error?.response?.data?.error || error?.message || 'Unknown error'));
  }
};

export const processRefund = async (paymentId, amount, reason) => {
  try {
    const { data } = await api.post('/member/wallet/refund', null, {
      params: { paymentId, amount, reason }
    });
    return data;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund: ' + 
      (error?.response?.data?.error || error?.message || 'Unknown error'));
  }
};

export const initializeWallet = async () => {
  try {
    // This will create a wallet if it doesn't exist
    const balance = await getWalletBalance();
    return balance;
  } catch (error) {
    console.error('Error initializing wallet:', error);
    throw new Error('Failed to initialize wallet: ' + 
      (error?.response?.data?.error || error?.message || 'Unknown error'));
  }
};