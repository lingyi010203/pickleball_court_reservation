import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  useTheme,
  alpha,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { useTheme as useCustomTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowBack as BackIcon,
  Clear as ClearIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { getWalletBalance, topUpWallet } from '../../service/WalletService';

const WalletTopUpPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const customTheme = useCustomTheme();
  const [amount, setAmount] = useState('');
  const [paymentSource, setPaymentSource] = useState(() => {
    // 从 localStorage 获取上次选择的支付方式，默认为 BANK_CARD
    return localStorage.getItem('wallet_payment_source') || 'BANK_CARD';
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingStates, setLoadingStates] = useState({
    balance: true,    // 余额加载状态
    topUp: false      // 充值处理状态
  });
  const [errors, setErrors] = useState({
    balance: null,    // 余额加载错误
    topUp: null       // 充值处理错误
  });
  const [success, setSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState(0);

  // 金额限制
  const MIN_AMOUNT = 1;
  const MAX_AMOUNT = 2000;
  const LARGE_AMOUNT_THRESHOLD = 1000;

  // 加载状态管理函数
  const setLoadingState = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const setErrorState = useCallback((key, value) => {
    setErrors(prev => ({ ...prev, [key]: value }));
  }, []);

  // 获取余额
  const fetchWalletBalance = useCallback(async () => {
    try {
      setLoadingState('balance', true);
      setErrorState('balance', null);
      const balance = await getWalletBalance();
      setWalletBalance(balance);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      setErrorState('balance', 'Failed to load wallet balance');
    } finally {
      setLoadingState('balance', false);
    }
  }, [setLoadingState, setErrorState]);

  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  // 格式化金额显示 - 使用 useCallback 缓存
  const formatAmount = useCallback((value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  // 验证金额 - 使用 useCallback 缓存
  const validateAmount = useCallback((value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < MIN_AMOUNT) {
      return `Minimum amount is RM${MIN_AMOUNT.toFixed(2)}`;
    }
    if (num > MAX_AMOUNT) {
      return `Maximum amount is RM${MAX_AMOUNT.toLocaleString()}`;
    }
    return null;
  }, []);

  // 处理金额输入 - 使用 useCallback 缓存
  const handleAmountChange = useCallback((e) => {
    const value = e.target.value;
    // 只允许数字和小数点
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setAmount(value);
      setErrorState('topUp', null); // 清除充值错误
    }
  }, [setErrorState]);

  // 预定义金额 - 使用 useMemo 缓存
  const predefinedAmounts = useMemo(() => [20, 50, 100, 200, 500], []);

  // 计算属性 - 使用 useMemo 缓存
  // 解析后的金额数值 - 使用 useMemo 缓存
  const parsedAmount = useMemo(() => {
    if (!amount) return 0;
    const num = parseFloat(amount);
    return isNaN(num) ? 0 : num;
  }, [amount]);

  const isAmountValid = useMemo(() => {
    return parsedAmount >= MIN_AMOUNT && parsedAmount <= MAX_AMOUNT;
  }, [parsedAmount]);

  const isLargeAmount = useMemo(() => {
    return parsedAmount >= LARGE_AMOUNT_THRESHOLD;
  }, [parsedAmount]);

  const isAmountPositive = useMemo(() => {
    return parsedAmount > 0;
  }, [parsedAmount]);

  const formattedAmount = useMemo(() => {
    return formatAmount(amount);
  }, [amount, formatAmount]);

  const validationError = useMemo(() => {
    return validateAmount(amount);
  }, [amount, validateAmount]);

  // 确认金额的格式化 - 使用 useMemo 缓存
  const formattedConfirmAmount = useMemo(() => {
    return formatAmount(confirmAmount);
  }, [confirmAmount, formatAmount]);

  // 获取支付方式图标 - 使用 useMemo 缓存所有图标映射
  const paymentIcons = useMemo(() => ({
    BANK_CARD: <CardIcon />,
    BANK_TRANSFER: <BankIcon />,
    E_WALLET: <WalletIcon />
  }), []);

  const getPaymentIcon = useCallback((type) => {
    return paymentIcons[type] || <CardIcon />;
  }, [paymentIcons]);

  // 获取支付方式显示名称 - 使用 useMemo 缓存所有名称映射
  const paymentDisplayNames = useMemo(() => ({
    BANK_CARD: 'Credit/Debit Card',
    BANK_TRANSFER: 'Bank Transfer',
    E_WALLET: 'E-Wallet'
  }), []);

  const getPaymentDisplayName = useCallback((type) => {
    return paymentDisplayNames[type] || type;
  }, [paymentDisplayNames]);

  const processTopUp = useCallback(async (numAmount) => {
    try {
      setLoadingState('topUp', true);
      setErrorState('topUp', null);
      
      await topUpWallet(numAmount, paymentSource);
      
      setSuccess(true);
      // Refresh wallet balance
      await fetchWalletBalance();
      
      // Redirect back to payment page after 2 seconds
      setTimeout(() => {
        navigate(-1);
      }, 2000);
      
    } catch (error) {
      setErrorState('topUp', error.message || 'Top-up failed. Please try again.');
    } finally {
      setLoadingState('topUp', false);
      setShowConfirmDialog(false);
    }
  }, [paymentSource, navigate, setLoadingState, setErrorState, fetchWalletBalance]);

  const handleTopUp = useCallback(async () => {
    if (validationError) {
      setErrorState('topUp', validationError);
      return;
    }
    
    // 大额充值需要确认
    if (isLargeAmount) {
      setConfirmAmount(parsedAmount);
      setShowConfirmDialog(true);
      return;
    }

    await processTopUp(parsedAmount);
  }, [validationError, isLargeAmount, parsedAmount, processTopUp, setErrorState]);

  // 处理键盘事件 - 使用 useCallback 缓存
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !loadingStates.topUp && isAmountValid) {
      handleTopUp();
    }
  }, [loadingStates.topUp, isAmountValid, handleTopUp]);

  // 处理支付方式选择 - 使用 useCallback 缓存
  const handlePaymentSourceChange = useCallback((event) => {
    const newPaymentSource = event.target.value;
    setPaymentSource(newPaymentSource);
    // 保存到 localStorage 中
    localStorage.setItem('wallet_payment_source', newPaymentSource);
  }, []);

  // 清除支付方式历史记录 - 使用 useCallback 缓存
  const clearPaymentHistory = useCallback(() => {
    localStorage.removeItem('wallet_payment_source');
    setPaymentSource('BANK_CARD'); // 重置为默认值
  }, []);

  // 清除金额 - 使用 useCallback 缓存
  const clearAmount = useCallback(() => {
    setAmount('');
    setErrorState('topUp', null); // 清除充值错误
  }, [setErrorState]);

  if (loadingStates.balance) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2, color: theme.palette.text.secondary }}>
          Loading wallet balance...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button
        variant="text"
        onClick={() => navigate(-1)}
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: 'translateX(-4px)'
          },
          transition: 'all 0.3s ease'
        }}
        startIcon={<BackIcon />}
      >
        Back
      </Button>

      <Card sx={{
        borderRadius: 3,
        boxShadow: `0 8px 28px ${alpha(theme.palette.common.black, 0.1)}`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.background.paper, 0.8)})`
      }}>
        <CardContent sx={{ p: 5 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1
              }}
            >
            Top Up Wallet
          </Typography>
          
            <Typography variant="body1" sx={{ fontSize: '1.1rem', color: theme.palette.text.secondary }}>
            Add money to your wallet for easy payments
          </Typography>
          </Box>

          {/* Current Balance */}
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            backgroundColor: theme.palette.primary.main,
            borderRadius: 2,
            border: `0.5px solid ${alpha(theme.palette.success.main, 0.1)}`,
            textAlign: 'center',
            boxShadow: theme.shadows[1],
            position: 'relative'
          }}>
            {loadingStates.balance && (
              <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}>
                <CircularProgress size={20} sx={{ color: theme.palette.common.white }} />
              </Box>
            )}
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: theme.palette.common.white, 
              mb: 0.5,
              opacity: loadingStates.balance ? 0.5 : 1
            }}>
              Current Balance： RM{walletBalance.toFixed(2)}
            </Typography>
            
            {/* 余额加载错误时显示重试按钮 */}
            {errors.balance && !loadingStates.balance && (
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={fetchWalletBalance}
                  sx={{ 
                    color: theme.palette.common.white, 
                    borderColor: theme.palette.common.white,
                    '&:hover': {
                      borderColor: theme.palette.common.white,
                      backgroundColor: alpha(theme.palette.common.white, 0.1)
                    }
                  }}
                >
                  Retry
                </Button>
              </Box>
            )}
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Top-up successful! Redirecting back to payment...
            </Alert>
          )}

          {errors.balance && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.balance}
            </Alert>
          )}

          {errors.topUp && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.topUp}
            </Alert>
          )}

          {/* Amount Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
              Select Amount
            </Typography>
            
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
              {predefinedAmounts.map((predefinedAmount) => (
                <Grid item xs={4} sm={2} key={predefinedAmount}>
                  <Button
                    fullWidth
                    variant={amount === predefinedAmount.toString() ? "contained" : "outlined"}
                    onClick={() => setAmount(predefinedAmount.toString())}
                    sx={{
                      py: 1.5,
                      borderRadius: 1.5,
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease',
                      ...(amount === predefinedAmount.toString() && {
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.common.white,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                      }),
                      '&:hover': {
                        backgroundColor: amount === predefinedAmount.toString() ? 
                          theme.palette.primary.dark : 
                          alpha(theme.palette.primary.main, 0.08),
                        transform: 'translateY(-1px)',
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
                      }
                    }}
                  >
                    RM{predefinedAmount}
                  </Button>
                </Grid>
              ))}
            </Grid>

            <TextField
              fullWidth
              label="Custom Amount (RM)"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              onKeyPress={handleKeyPress}
              placeholder={`Enter amount (RM${MIN_AMOUNT.toFixed(2)} - RM${MAX_AMOUNT.toLocaleString()})`}
              error={!!validationError}
              helperText={validationError || `Amount range: RM${MIN_AMOUNT.toFixed(2)} - RM${MAX_AMOUNT.toLocaleString()}`}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  }
                }
              }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, fontWeight: 600, color: theme.palette.primary.main }}>RM</Typography>,
                endAdornment: amount && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={clearAmount}
                      edge="end"
                      size="small"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* 显示格式化金额 */}
            {isAmountPositive && (
              <Box sx={{ 
                mt: 0.5, 
                p: 2, 
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}>
                <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
                  You will add: RM{formattedAmount}
                </Typography>
                {isLargeAmount && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <WarningIcon sx={{ fontSize: 16, color: theme.palette.warning.main, mr: 0.5 }} />
                    <Typography variant="caption" color="warning.main">
                      Large amount - confirmation required
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Payment Source */}
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Payment Method
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                Your choice will be remembered
              </Typography>
            </Box>
            
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: 500 }}>Payment Source</InputLabel>
              <Select
                value={paymentSource}
                onChange={handlePaymentSourceChange}
                label="Payment Source"
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.divider, 0.3)
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  }
                }}
              >
                <MenuItem value="BANK_CARD">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CardIcon sx={{ fontSize: 20 }} />
                    Credit/Debit Card
                  </Box>
                </MenuItem>
                <MenuItem value="BANK_TRANSFER">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BankIcon sx={{ fontSize: 20 }} />
                    Bank Transfer
                  </Box>
                </MenuItem>
                <MenuItem value="E_WALLET">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WalletIcon sx={{ fontSize: 20 }} />
                    E-Wallet
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* 显示选中的支付方式 */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
              <Chip
                icon={getPaymentIcon(paymentSource)}
                label={getPaymentDisplayName(paymentSource)}
                variant="outlined"
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  fontWeight: 500
                }}
              />
              
              {/* 重置支付方式历史记录按钮 */}
              {localStorage.getItem('wallet_payment_source') && (
                <Button
                  size="small"
                  variant="text"
                  onClick={clearPaymentHistory}
                  sx={{
                    fontSize: '0.75rem',
                    color: theme.palette.text.secondary,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.text.secondary, 0.08)
                    }
                  }}
                >
                  Reset History
                </Button>
              )}
            </Box>
          </Box>

          {/* Top Up Button */}
          <Button
            fullWidth
            variant="contained"
            size="medium"
            onClick={handleTopUp}
            disabled={loadingStates.topUp || !isAmountValid}
            sx={{
              py: 2,
              px: 3,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '1rem',
              backgroundColor: theme.palette.primary.main,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                boxShadow: `0 3px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: theme.palette.grey[300],
                color: theme.palette.grey[500],
                boxShadow: 'none',
                transform: 'none'
              },
              transition: 'all 0.2s ease'
            }}
          >
                          {loadingStates.topUp ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Top Up RM${formattedAmount || '0.00'}`
              )}
          </Button>
        </CardContent>
      </Card>

      {/* 确认对话框 */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: theme.palette.warning.main 
        }}>
          <WarningIcon />
          Confirm Large Amount Top-up
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are about to top up your wallet with:
          </Typography>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: theme.palette.primary.main,
            textAlign: 'center',
            mb: 2
          }}>
            RM{formattedConfirmAmount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please confirm this amount is correct before proceeding.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowConfirmDialog(false)}
            variant="outlined"
            sx={{ px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => processTopUp(confirmAmount)}
            variant="contained"
            sx={{ px: 3 }}
            disabled={loadingStates.topUp}
          >
            {loadingStates.topUp ? <CircularProgress size={20} /> : 'Confirm Top-up'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WalletTopUpPage; 