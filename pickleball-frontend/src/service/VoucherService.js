import api from './api';

export const VoucherService = {
  // 獲取用戶的可用voucher
  getActiveVouchers: async () => {
    try {
      const response = await api.get('/voucher-redemption/my-active-redemptions');
      return response.data;
    } catch (error) {
      console.error('Error fetching active vouchers:', error);
      throw error;
    }
  },

  // 獲取可兌換的vouchers（用於payment頁面）
  getRedeemableVouchers: async () => {
    try {
      const response = await api.get('/member/dashboard');
      return response.data.redeemableVouchers || [];
    } catch (error) {
      console.error('Error fetching redeemable vouchers:', error);
      throw error;
    }
  },

  // 兌換voucher
  redeemVoucher: async (voucherId) => {
    try {
      const response = await api.post(`/voucher-redemption/redeem/${voucherId}`);
      return response.data;
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      throw error;
    }
  },

  // 獲取用戶的所有voucher兌換記錄
  getMyRedemptions: async () => {
    try {
      const response = await api.get('/voucher-redemption/my-redemptions');
      return response.data;
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      throw error;
    }
  },

  // 使用voucher
  useVoucher: async (redemptionId) => {
    try {
      const response = await api.post(`/voucher-redemption/use/${redemptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error using voucher:', error);
      throw error;
    }
  },

  // 檢查是否可以兌換特定voucher
  canRedeemVoucher: async (voucherId) => {
    try {
      const response = await api.get(`/voucher-redemption/can-redeem/${voucherId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking voucher redeemability:', error);
      throw error;
    }
  }
};

export default VoucherService; 