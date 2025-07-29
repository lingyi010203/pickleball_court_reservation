import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  useTheme,
  CircularProgress,
  Chip,
  alpha,
  Avatar,
  Divider
} from '@mui/material';
import { 
  Receipt,
  AttachMoney,
  AccountBalance,
  CalendarToday,
  CheckCircle,
  Schedule,
  Error,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api';

const RecentInvoices = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 获取预订历史（包含支付信息）
      const bookingsResponse = await api.get('/member/bookings');
      const bookings = bookingsResponse.data || [];
      
      // 获取钱包交易历史
      const walletResponse = await api.get('/member/wallet/transactions?page=0&size=20');
      const walletTransactions = walletResponse.data?.transactions || [];
      
      // 合并和规范化支付数据
      const allPayments = [];
      
      // 从预订中提取支付信息
      bookings.forEach(booking => {
        if (booking.payment) {
          allPayments.push({
            id: booking.payment.id || `booking-${booking.id}`,
            type: 'BOOKING',
            amount: booking.totalAmount || booking.amount,
            status: booking.payment.status || 'COMPLETED',
            date: booking.bookingDate || booking.payment.paymentDate,
            description: `Court booking - ${booking.courtName || 'Pickleball Court'}`,
            paymentMethod: booking.payment.paymentMethod || 'WALLET',
            transactionId: booking.payment.transactionId,
            referenceId: booking.id,
            category: 'Sports & Recreation'
          });
        }
      });
      
      // 从钱包交易中提取充值信息
      walletTransactions.forEach(transaction => {
        if (transaction.transactionType === 'DEPOSIT') {
          allPayments.push({
            id: `wallet-${transaction.id}`,
            type: 'TOP_UP',
            amount: transaction.amount,
            status: transaction.status || 'COMPLETED',
            date: transaction.createdAt,
            description: `Wallet top-up via ${transaction.description?.includes('via') ? 
              transaction.description.split('via ')[1] : 'payment method'}`,
            paymentMethod: 'WALLET_TOPUP',
            transactionId: transaction.referenceId,
            referenceId: transaction.id,
            category: 'Wallet Management'
          });
        }
      });
      
      // 按日期排序，取最近的5个
      const recentPayments = allPayments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      
      setPayments(recentPayments);
      
      // 计算总支出（只计算预订支付）
      const totalSpentAmount = allPayments
        .filter(p => p.type === 'BOOKING' && p.status === 'COMPLETED')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      setTotalSpent(totalSpentAmount);
      
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (type) => {
    switch (type) {
      case 'BOOKING':
        return <Receipt sx={{ color: theme.palette.primary.main, fontSize: 18 }} />;
      case 'TOP_UP':
        return <AccountBalance sx={{ color: theme.palette.success.main, fontSize: 18 }} />;
      default:
        return <AttachMoney sx={{ color: theme.palette.grey[500], fontSize: 18 }} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 16 }} />;
      case 'PENDING':
        return <Schedule sx={{ color: theme.palette.warning.main, fontSize: 16 }} />;
      case 'FAILED':
        return <Error sx={{ color: theme.palette.error.main, fontSize: 16 }} />;
      default:
        return <Error sx={{ color: theme.palette.grey[500], fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount || 0);
  };

  const handleViewAll = () => {
    navigate('/profile/wallet/transactions');
  };

  const handleBookNow = () => {
    navigate('/courts');
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexShrink: 0
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 'bold',
          fontSize: { xs: '1.1rem', lg: '1.25rem' }
        }}>
          My Invoices
        </Typography>
        <Button 
          size="small" 
          onClick={handleViewAll}
          sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '0.85rem',
            minWidth: 'auto',
            px: 1,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          See all
        </Button>
      </Box>
      
      {/* Content */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {loading ? (
          <Box sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 2
          }}>
            <Error sx={{ 
              fontSize: 48, 
              color: theme.palette.error.main, 
              mb: 2 
            }} />
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchPaymentHistory}
              sx={{ fontSize: '0.8rem' }}
            >
              Retry
            </Button>
          </Box>
        ) : payments.length > 0 ? (
          <Box sx={{ 
            flex: 1,
            overflowY: 'auto',
            pr: 1
          }}>
            {payments.map((payment, index) => (
              <Box 
                key={payment.id} 
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, 
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`
                  }
                }}
              >
                {/* Payment Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      mr: 1.5,
                      backgroundColor: alpha(
                        payment.type === 'BOOKING' ? theme.palette.primary.main : theme.palette.success.main, 
                        0.1
                      ),
                      color: payment.type === 'BOOKING' ? theme.palette.primary.main : theme.palette.success.main
                    }}
                  >
                    {getPaymentIcon(payment.type)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {payment.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      fontSize: '0.75rem'
                    }}>
                      {payment.category}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getStatusIcon(payment.status)}
                    label={payment.status?.replace('_', ' ')}
                    size="small"
                    color={getStatusColor(payment.status)}
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.7rem',
                      height: 24,
                      '& .MuiChip-icon': { ml: 0.5 }
                    }}
                  />
                </Box>

                {/* Date & Amount */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ 
                      fontSize: 14, 
                      color: theme.palette.text.secondary, 
                      mr: 1 
                    }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(payment.date)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {payment.type === 'TOP_UP' ? (
                      <TrendingUp sx={{ 
                        fontSize: 14, 
                        color: theme.palette.success.main, 
                        mr: 0.5 
                      }} />
                    ) : (
                      <TrendingDown sx={{ 
                        fontSize: 14, 
                        color: theme.palette.error.main, 
                        mr: 0.5 
                      }} />
                    )}
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600,
                      color: payment.type === 'TOP_UP' ? theme.palette.success.main : theme.palette.error.main,
                      fontSize: '0.8rem'
                    }}>
                      {payment.type === 'TOP_UP' ? '+' : '-'}{formatAmount(payment.amount)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            flex: 1,
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            px: 2
          }}>
            <Typography variant="h3" sx={{ 
              fontWeight: 'bold', 
              textAlign: 'center',
              mb: 1,
              fontSize: { xs: '2rem', lg: '2.5rem' },
              color: theme.palette.text.primary
            }}>
              {formatAmount(totalSpent)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              textAlign: 'center',
              mb: 3,
              fontSize: '0.9rem'
            }}>
              spent on sports this year
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" sx={{ 
              fontWeight: 500,
              textAlign: 'center',
              mb: 2,
              fontSize: '0.9rem',
              lineHeight: 1.4,
              color: theme.palette.text.primary
            }}>
              Claim up to RM1,000 in tax relief while staying active and healthy!
            </Typography>
            
            <Button 
              variant="text"
              size="small"
              onClick={handleBookNow}
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                textTransform: 'none',
                alignSelf: 'center',
                fontSize: '0.85rem',
                '&:hover': { 
                  backgroundColor: 'transparent',
                  textDecoration: 'underline'
                }
              }}
            >
              Start booking now →
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RecentInvoices;