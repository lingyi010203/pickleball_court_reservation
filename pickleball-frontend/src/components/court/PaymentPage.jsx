import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel as MuiFormControlLabel
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SportsIcon from '@mui/icons-material/Sports';
import GroupIcon from '@mui/icons-material/Group';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import api from '../../api/axiosConfig.js';
import { getWalletBalance, initializeWallet } from '../../service/WalletService';
import { VoucherService } from '../../service/VoucherService';
import { useAuth } from '../../context/AuthContext';
import ThemedCard from '../common/ThemedCard';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingDetails = location.state?.bookingDetails;
  const sessionGroup = location.state?.sessionGroup;
  const session = location.state?.session;
  const eventDetails = location.state?.eventDetails;
  const paymentType = location.state?.paymentType;

  // 檢查是否有 replacement session 支付數據
  const replacementSessionPayment = localStorage.getItem('replacementSessionPayment');
  const replacementData = replacementSessionPayment ? JSON.parse(replacementSessionPayment) : null;

  // 確定支付數據來源
  const paymentData = bookingDetails || sessionGroup || session || replacementData || eventDetails;

  // 調試信息
  console.log('=== PaymentPage Debug ===');
  console.log('location.state:', location.state);
  console.log('bookingDetails:', bookingDetails);
  console.log('sessionGroup:', sessionGroup);
  console.log('session:', session);
  console.log('eventDetails:', eventDetails);
  console.log('paymentType:', paymentType);
  console.log('replacementData:', replacementData);
  console.log('paymentData:', paymentData);

  // 詳細檢查 session 對象
  if (session) {
    console.log('Session details:');
    console.log('- id:', session.id);
    console.log('- title:', session.title);
    console.log('- price:', session.price);
    console.log('- startTime:', session.startTime);
    console.log('- endTime:', session.endTime);
    console.log('- startTime type:', typeof session.startTime);
    console.log('- endTime type:', typeof session.endTime);
    if (session.startTime) {
      console.log('- startTime parsed:', new Date(session.startTime));
      console.log('- startTime valid:', !isNaN(new Date(session.startTime).getTime()));
    }
    if (session.endTime) {
      console.log('- endTime parsed:', new Date(session.endTime));
      console.log('- endTime valid:', !isNaN(new Date(session.endTime).getTime()));
    }
    console.log('- coach:', session.coach);
    console.log('- coachName:', session.coachName);
    console.log('- court:', session.court);
    console.log('- venue:', session.venue);
    console.log('- venueName:', session.venueName);
    console.log('- All session keys:', Object.keys(session));
  }

  if (sessionGroup) {
    console.log('SessionGroup details:');
    console.log('- length:', sessionGroup.length);
    console.log('- first session:', sessionGroup[0]);
  }

  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useVoucher, setUseVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);

  // Class session 設備選項
  const [numPaddles, setNumPaddles] = useState(0);
  const [buyBallSet, setBuyBallSet] = useState(false);

  const { authToken } = useAuth();

  // 定義常量
  const PADDLE_PRICE = 5;
  const BALL_SET_PRICE = 12;

  // 計算初始金額
  const getInitialAmount = () => {
    let baseAmount = 0;

    if (sessionGroup) {
      // 對於 sessionGroup，計算所有課程的總價
      baseAmount = sessionGroup.reduce((sum, sess) => sum + (sess.price || 0), 0);
    } else if (session) {
      // 對於單個 session，使用其價格
      baseAmount = session.price || 0;
    } else if (replacementData) {
      // 對於 replacement session，使用 amount
      baseAmount = replacementData.amount || 0;
    } else if (eventDetails) {
      // 對於事件註冊，使用事件費用
      baseAmount = eventDetails.feeAmount || 0;
    } else if (paymentData) {
      // 對於其他情況，使用 price 或 amount
      baseAmount = paymentData.price || paymentData.amount || 0;
    }

    // 添加設備費用（只在 class session 時）
    if (sessionGroup || session) {
      const paddleCost = numPaddles * PADDLE_PRICE;
      const ballCost = buyBallSet ? BALL_SET_PRICE : 0;
      baseAmount += paddleCost + ballCost;
    }

    return baseAmount;
  };

  const [discountedAmount, setDiscountedAmount] = useState(getInitialAmount());

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch wallet balance
        let balance;
        try {
          balance = await getWalletBalance();
        } catch (getError) {
          console.warn('Wallet not found, initializing...', getError);
          try {
            await initializeWallet();
            balance = await getWalletBalance();
          } catch (initError) {
            console.error('Failed to initialize wallet:', initError);
            balance = 0; // 設置默認餘額為 0
          }
        }
        setWalletBalance(balance || 0);

        // Fetch available vouchers
        try {
          const vouchers = await VoucherService.getActiveVouchers();
          console.log('=== PaymentPage Debug ===');
          console.log('Fetched active vouchers:', vouchers);
          setAvailableVouchers(vouchers);
        } catch (voucherError) {
          console.warn('Failed to fetch active vouchers:', voucherError);
          console.error('Voucher error details:', voucherError.response?.data);
          setAvailableVouchers([]);
        }

      } catch (err) {
        console.error('Data loading error:', err);
        setError('Failed to load data: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate discounted amount when voucher selection changes
  useEffect(() => {
    if (useVoucher && selectedVoucherId) {
      const selectedVoucher = availableVouchers.find(v => v.id === selectedVoucherId);
      if (selectedVoucher) {
        let originalPrice = getInitialAmount();
        let newAmount = originalPrice;
        if (selectedVoucher.discountType === 'percentage') {
          newAmount = originalPrice * (1 - selectedVoucher.discountValue / 100);
        } else {
          newAmount = Math.max(0, originalPrice - selectedVoucher.discountValue);
        }
        setDiscountedAmount(newAmount);
      }
    } else {
      setDiscountedAmount(getInitialAmount());
    }
  }, [useVoucher, selectedVoucherId, availableVouchers, sessionGroup, session, replacementData, paymentData, numPaddles, buyBallSet]);

  const handlePayment = async () => {
    if (!paymentData) {
      setError('Payment details missing');
      return;
    }

    try {
      setIsProcessing(true);

      // 根據支付類型構建請求
      let apiEndpoint = '/member/bookings';
      let requestData = {};

      if (replacementData) {
        // Replacement session payment
        apiEndpoint = '/member/replacement-session-payment';
        requestData = {
          sessionId: replacementData.sessionId,
          amount: replacementData.amount,
          useWallet: paymentMethod === 'wallet',
          useVoucher: useVoucher,
          voucherRedemptionId: selectedVoucherId
        };
      } else if (sessionGroup || session) {
        // Class session registration
        if (sessionGroup) {
          // 對於 sessionGroup，使用批量註冊端點
          apiEndpoint = '/class-sessions/register-multi';
          requestData = {
            sessionIds: sessionGroup.map(s => s.id),
            paymentMethod: paymentMethod === 'wallet' ? 'wallet' : 'card',
            numPaddles: numPaddles,
            buyBallSet: buyBallSet
          };
        } else {
          // 對於單個 session
          apiEndpoint = `/class-sessions/${session.id}/register`;
          requestData = {
            useWallet: paymentMethod === 'wallet',
            useVoucher: useVoucher,
            voucherRedemptionId: selectedVoucherId,
            numPaddles: numPaddles,
            buyBallSet: buyBallSet
          };
        }
      } else if (eventDetails) {
        // Event registration payment - 事件註冊不使用 voucher
        apiEndpoint = '/event-registration/register';
        requestData = {
          eventId: eventDetails.id,
          useWallet: paymentMethod === 'wallet'
        };
      } else {
        // Regular court booking
        requestData = {
          slotIds: paymentData.slotIds,
          purpose: paymentData.purpose,
          numberOfPlayers: paymentData.numberOfPlayers,
          numPaddles: paymentData.numPaddles,
          buyBallSet: paymentData.buyBallSet,
          durationHours: paymentData.durationHours,
          useWallet: paymentMethod === 'wallet',
          useVoucher: useVoucher,
          voucherRedemptionId: selectedVoucherId
        };
      }

      console.log('=== PaymentPage Debug ===');
      console.log('Payment Method:', paymentMethod);
      console.log('Use Wallet:', paymentMethod === 'wallet');
      console.log('Use Voucher:', useVoucher);
      console.log('Selected Voucher ID:', selectedVoucherId);
      console.log('Request Data:', requestData);
      console.log('API Endpoint:', apiEndpoint);
      console.log('Available Vouchers:', availableVouchers);
      if (selectedVoucherId) {
        const selectedVoucher = availableVouchers.find(v => v.id === selectedVoucherId);
        console.log('Selected Voucher Details:', selectedVoucher);
      }

      const response = await api.post(apiEndpoint, requestData);

      console.log('=== PaymentPage Debug ===');
      console.log('API Response:', response.data);
      console.log('Booking Details:', bookingDetails);

      // 根據支付類型決定導航目標
      if (replacementData) {
        // Replacement session - 清除 localStorage 並導航到教練儀表板
        localStorage.removeItem('replacementSessionPayment');
        navigate('/coach/dashboard', {
          state: {
            message: 'Replacement session payment completed successfully!',
            paymentResult: response.data
          }
        });
      } else if (sessionGroup || session) {
        // Class session - 導航到課程確認頁面
        navigate('/booking/confirmation', {
          state: {
            booking: {
              type: 'class-session',
              sessions: sessionGroup || [session],
              totalAmount: response.data.totalAmount,
              pointsEarned: response.data.pointsEarned,
              numPaddles: numPaddles,
              buyBallSet: buyBallSet,
              registrationDate: new Date().toISOString(),
              currentTierPointBalance: response.data.currentTierPointBalance,
              currentRewardPointBalance: response.data.currentRewardPointBalance,
              paymentMethod: paymentMethod === 'wallet' ? 'WALLET' : 'CREDIT_CARD',
              paymentStatus: 'COMPLETED'
            }
          }
        });
      } else if (eventDetails) {
        // Event registration - 導航到確認頁面
        navigate('/booking/confirmation', {
          state: {
            type: 'event-registration',
            eventDetails: eventDetails,
            registrationResult: response.data,
            totalAmount: response.data.feeAmount || eventDetails.feeAmount,
            paymentMethod: paymentMethod === 'wallet' ? 'WALLET' : 'CREDIT_CARD',
            paymentStatus: 'COMPLETED'
          }
        });
      } else {
        // Regular court booking
        navigate('/booking/confirmation', {
          state: {
            booking: {
              ...response.data,
              slotDate: paymentData.date,
              startTime: paymentData.startTime,
              endTime: paymentData.endTime,
              durationHours: paymentData.durationHours,
              totalAmount: response.data.totalAmount,
              price: paymentData.price,
              numPaddles: paymentData.numPaddles,
              buyBallSet: paymentData.buyBallSet,
              numberOfPlayers: paymentData.numberOfPlayers,
              courtName: paymentData.courtName,
              courtLocation: paymentData.courtLocation,
              venueName: paymentData.venueName,
              venueLocation: paymentData.venueLocation,
              pointsEarned: response.data.pointsEarned,
              currentTierPointBalance: response.data.currentTierPointBalance,
              currentRewardPointBalance: response.data.currentRewardPointBalance
            }
          }
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Payment failed. Please try again.';

      if (errorMessage.includes('Insufficient wallet balance')) {
        setError('Your wallet balance is insufficient. Please switch to credit card payment or top up your wallet.');
        // 自動切換到信用卡支付
        setPaymentMethod('card');
      } else {
        setError(errorMessage);
      }

      setIsProcessing(false);
    }
  };

  if (!paymentData) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Payment information not available
        </Typography>
        <Button variant="contained" onClick={() => navigate('/courts')}>
          Browse Courts
        </Button>
      </Container>
    );
  }

  const formatTime = (time) => {
    return new Date(`1970-01-01T${time}:00`).toLocaleTimeString([],
      { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <PaymentIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          {eventDetails ? 'Event Registration Payment' : 'Complete Payment'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {eventDetails ? 'Review your event registration and choose payment method' : 'Review your booking and choose payment method'}
        </Typography>
      </Box>

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        minHeight: '600px'
      }}>
        {/* Left Column - Booking Summary */}
        <Box sx={{ flex: { xs: 'none', md: 1 } }}>
          <ThemedCard sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
                📋 {eventDetails ? 'Event Registration Summary' : 'Booking Summary'}
              </Typography>

              {/* Court & Venue Info - 只在非 class session 且非 event 時顯示 */}
              {!sessionGroup && !session && !eventDetails && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SportsIcon sx={{ color: '#1976d2', mr: 1, fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {replacementData ? replacementData.courtName :
                        paymentData.courtName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {replacementData ? replacementData.venueName :
                        paymentData.venueName}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Date & Time - 只在非 class session 且非 event 時顯示 */}
              {!sessionGroup && !session && !eventDetails && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <AccessTimeIcon sx={{ color: '#1976d2', mr: 1, fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {replacementData ? new Date(replacementData.startTime).toLocaleDateString() :
                        paymentData.date}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {replacementData ?
                        `${new Date(replacementData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(replacementData.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${replacementData.duration}h)` :
                        `${formatTime(paymentData.startTime)} - ${formatTime(paymentData.endTime)} (${paymentData.durationHours}h)`}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Players & Equipment - 只在 court booking 時顯示，不包括 event */}
              {!replacementData && !sessionGroup && !session && !eventDetails && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#424242' }}>
                    👥 Players & Equipment
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                        <GroupIcon sx={{ color: '#1976d2', fontSize: 32, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {paymentData.numberOfPlayers}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Players
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                        <SportsIcon sx={{ color: '#9c27b0', fontSize: 32, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {paymentData.numPaddles}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Paddles (RM{PADDLE_PRICE} each)
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                        <SportsIcon sx={{ color: '#4caf50', fontSize: 32, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {paymentData.buyBallSet ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ball Set (RM{BALL_SET_PRICE})
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Class Session Info - 只在 class session 時顯示 */}
              {(sessionGroup || session) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#424242' }}>
                    🎓 Class Session Details
                  </Typography>

                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {sessionGroup ? sessionGroup[0]?.title || sessionGroup[0]?.type : session.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {sessionGroup ? sessionGroup[0]?.description : session.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                      Coach: {sessionGroup ? sessionGroup[0]?.coach?.name || sessionGroup[0]?.coachName : session.coach?.name || session.coachName}
                    </Typography>

                    {/* 顯示場地和場館信息 */}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Venue: {sessionGroup ?
                        (sessionGroup[0]?.venue?.name || sessionGroup[0]?.venueName || sessionGroup[0]?.venue || 'Not specified') :
                        (session.venue?.name || session.venueName || session.venue || 'Not specified')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Court: {sessionGroup ?
                        (sessionGroup[0]?.court?.name || sessionGroup[0]?.courtName || sessionGroup[0]?.court || 'Not specified') :
                        (session.court?.name || session.courtName || session.court || 'Not specified')}
                    </Typography>

                    {/* 顯示日期和時間信息 */}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Date: {sessionGroup ?
                        (sessionGroup[0]?.startTime ? new Date(sessionGroup[0].startTime).toLocaleDateString() :
                          sessionGroup[0]?.date ? sessionGroup[0].date : 'Not specified') :
                        (session.startTime ? new Date(session.startTime).toLocaleDateString() :
                          session.date ? session.date : 'Not specified')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Time: {sessionGroup ?
                        (sessionGroup[0]?.startTime && sessionGroup[0]?.endTime ?
                          `${new Date(sessionGroup[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(sessionGroup[0].endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                          sessionGroup[0]?.time ? sessionGroup[0].time : 'Not specified') :
                        (session.startTime && session.endTime ?
                          `${new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                          session.time ? session.time : 'Not specified')}
                    </Typography>
                  </Box>

                  {/* Class Session 設備選項 */}
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#424242' }}>
                    🏓 Equipment Options
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Paddles (RM{PADDLE_PRICE} each)
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            size="small"
                            variant={numPaddles > 0 ? "contained" : "outlined"}
                            onClick={() => setNumPaddles(Math.max(0, numPaddles - 1))}
                          >
                            -
                          </Button>
                          <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                            {numPaddles}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => setNumPaddles(numPaddles + 1)}
                          >
                            +
                          </Button>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Ball Set (RM{BALL_SET_PRICE})
                        </Typography>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={buyBallSet}
                              onChange={(e) => setBuyBallSet(e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Add ball set"
                        />
                      </Box>
                    </Grid>
                  </Grid>

                  {/* 設備費用摘要 */}
                  {(numPaddles > 0 || buyBallSet) && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Equipment Summary:
                      </Typography>
                      {numPaddles > 0 && (
                        <Typography variant="body2">
                          Paddles: {numPaddles} × RM{PADDLE_PRICE} = RM{(numPaddles * PADDLE_PRICE).toFixed(2)}
                        </Typography>
                      )}
                      {buyBallSet && (
                        <Typography variant="body2">
                          Ball Set: RM{BALL_SET_PRICE.toFixed(2)}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                        Total Equipment: RM{((numPaddles * PADDLE_PRICE) + (buyBallSet ? BALL_SET_PRICE : 0)).toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {/* Event Details - 只在事件註冊時顯示 */}
              {eventDetails && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#424242' }}>
                    🎉 Event Details
                  </Typography>

                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {eventDetails.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {eventDetails.eventType}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2">
                        {new Date(eventDetails.startTime).toLocaleDateString()} {new Date(eventDetails.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(eventDetails.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2">
                        {eventDetails.location || eventDetails.venueLocation || 'Location TBD'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <GroupIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2">
                        Capacity: {eventDetails.currentParticipants || 0}/{eventDetails.capacity} participants
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocalOfferIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        Fee: RM{eventDetails.feeAmount || 0}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}

              {/* Replacement Session Info - 只在 replacement session 時顯示 */}
              {replacementData && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#424242' }}>
                    🔄 Replacement Session Details
                  </Typography>

                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {replacementData.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                      Student Count: {replacementData.studentCount}
                    </Typography>
                    {replacementData.studentName && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Student: {replacementData.studentName}
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </ThemedCard>
        </Box>

        {/* Right Column - Payment */}
        <Box sx={{ flex: { xs: 'none', md: 1 } }}>
          <ThemedCard sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 3 }}>
                💳 Payment Details
              </Typography>

              {/* Total Amount */}
              <Paper
                elevation={0}
                sx={{
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  border: '2px solid #4caf50'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Total Amount:
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    RM{discountedAmount.toFixed(2)}
                  </Typography>
                </Box>

                {/* 費用明細 - 只在 class session 時顯示 */}
                {(sessionGroup || session) && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <span>Class Fee:</span>
                      <span>RM{(sessionGroup ? sessionGroup.reduce((sum, sess) => sum + (sess.price || 0), 0) : session.price || 0).toFixed(2)}</span>
                    </Typography>
                    {numPaddles > 0 && (
                      <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <span>Paddles ({numPaddles}):</span>
                        <span>RM{(numPaddles * PADDLE_PRICE).toFixed(2)}</span>
                      </Typography>
                    )}
                    {buyBallSet && (
                      <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <span>Ball Set:</span>
                        <span>RM{BALL_SET_PRICE.toFixed(2)}</span>
                      </Typography>
                    )}
                  </Box>
                )}
                {useVoucher && selectedVoucherId && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Original Price:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                      RM{(paymentData?.price || paymentData?.amount || 0).toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Payment Method Selection */}
              <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', color: '#424242' }}>
                  Select Payment Method
                </FormLabel>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {/* Wallet Option */}
                  <ThemedCard
                    variant="outlined"
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      border: paymentMethod === 'wallet' ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      backgroundColor: paymentMethod === 'wallet' ? '#f3f8ff' : 'transparent'
                    }}
                  >
                    <FormControlLabel
                      value="wallet"
                      control={<Radio color="primary" />}
                      label={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', p: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccountBalanceWalletIcon sx={{ color: '#1976d2', mr: 1 }} />
                            <Typography sx={{ fontWeight: 'bold' }}>SuperBadge Wallet</Typography>
                          </Box>
                          {isLoading ? (
                            <CircularProgress size={20} />
                          ) : error ? (
                            <Typography color="error">Error</Typography>
                          ) : (
                            <Typography fontWeight="bold" color="#1976d2">
                              RM{walletBalance.toFixed(2)}
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{ p: 2, width: '100%' }}
                    />
                  </ThemedCard>

                  {/* Credit Card Option */}
                  <ThemedCard
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      border: paymentMethod === 'card' ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      backgroundColor: paymentMethod === 'card' ? '#f3f8ff' : 'transparent'
                    }}
                  >
                    <FormControlLabel
                      value="card"
                      control={<Radio color="primary" />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                          <CreditCardIcon sx={{ color: '#1976d2', mr: 1 }} />
                          <Typography sx={{ fontWeight: 'bold' }}>Credit/Debit Card</Typography>
                        </Box>
                      }
                      sx={{ p: 2, width: '100%' }}
                    />
                  </ThemedCard>
                </RadioGroup>
              </FormControl>

                             {/* Voucher Selection - 只在 court booking 時顯示，不包括 event */}
               {!replacementData && !sessionGroup && !session && !eventDetails && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#424242' }}>
                    <LocalOfferIcon sx={{ mr: 1, color: '#ff9800' }} />
                    Vouchers & Discounts
                  </Typography>

                  {/* Available Active Vouchers */}
                  {availableVouchers.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: '#2e7d32' }}>
                        Your Active Vouchers ({availableVouchers.length})
                      </Typography>
                      <MuiFormControlLabel
                        control={
                          <Checkbox
                            checked={useVoucher}
                            onChange={(e) => {
                              setUseVoucher(e.target.checked);
                              if (!e.target.checked) {
                                setSelectedVoucherId(null);
                              }
                            }}
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 'bold' }}>Use Active Voucher</Typography>
                          </Box>
                        }
                      />

                      {useVoucher && (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                          <Select
                            value={selectedVoucherId || ''}
                            onChange={(e) => setSelectedVoucherId(e.target.value)}
                            displayEmpty
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="" disabled>
                              Choose an active voucher...
                            </MenuItem>
                            {availableVouchers.map((voucher) => (
                              <MenuItem key={voucher.id} value={voucher.id}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                      {voucher.voucherTitle || `Voucher ${voucher.voucherCode}`}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {voucher.discountType === 'percentage'
                                        ? `${voucher.discountValue}% off`
                                        : `RM${voucher.discountValue} off`}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={`Expires: ${new Date(voucher.expiryDate).toLocaleDateString()}`}
                                    size="small"
                                    color="warning"
                                  />
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Box>
                  )}

                  {/* No Active Vouchers - Show Browse Button */}
                  {availableVouchers.length === 0 && (
                    <Box sx={{ textAlign: 'center', p: 3, backgroundColor: '#fff3e0', borderRadius: 2, border: '1px solid #ffb74d' }}>
                      <LocalOfferIcon sx={{ fontSize: 48, color: '#ff9800', mb: 2 }} />
                      <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        No active vouchers
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        You don't have any active vouchers to use for this booking.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/profile/redeem-voucher')}
                        sx={{
                          backgroundColor: '#ff9800',
                          '&:hover': {
                            backgroundColor: '#f57c00'
                          }
                        }}
                      >
                        Browse & Redeem Vouchers
                      </Button>
                    </Box>
                  )}

                  {/* Always show browse button if user has active vouchers */}
                  {availableVouchers.length > 0 && (
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          console.log('Browse More Vouchers button clicked');
                          console.log('Navigating to /profile/redeem-voucher');
                          navigate('/profile/redeem-voucher');
                        }}
                        sx={{
                          borderColor: '#ff9800',
                          color: '#ff9800',
                          '&:hover': {
                            borderColor: '#f57c00',
                            backgroundColor: '#fff3e0'
                          }
                        }}
                      >
                        Browse More Vouchers
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Class Session Notice - 只在 class session 時顯示 */}
              {(sessionGroup || session) && (
                <Box sx={{ mb: 3 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Note:</strong> Vouchers cannot be used for class session bookings.
                    </Typography>
                  </Alert>
                </Box>
              )}

                             {/* Event Registration Notice - 只在事件註冊時顯示 */}
               {eventDetails && (
                 <Box sx={{ mb: 3 }}>
                   <Alert severity="info" sx={{ mb: 2 }}>
                     <Typography variant="body2">
                       <strong>Note:</strong> Vouchers cannot be used for event registrations.
                     </Typography>
                   </Alert>
                 </Box>
               )}

               {/* Replacement Session Notice - 只在 replacement session 時顯示 */}
               {replacementData && (
                 <Box sx={{ mb: 3 }}>
                   <Alert severity="info" sx={{ mb: 2 }}>
                     <Typography variant="body2">
                       <strong>Note:</strong> Vouchers cannot be used for replacement session payments.
                     </Typography>
                   </Alert>
                 </Box>
               )}

              {/* Insufficient Balance Warning */}
              {paymentMethod === 'wallet' && (walletBalance < discountedAmount || walletBalance === 0) && !isLoading && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {walletBalance === 0 
                      ? 'Your wallet is empty. Please top up your wallet or switch to credit card payment.'
                      : `Insufficient wallet balance. You need RM${(discountedAmount - walletBalance).toFixed(2)} more.`
                    }
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate('/wallet/topup')}
                    sx={{
                      backgroundColor: '#ff9800',
                      '&:hover': {
                        backgroundColor: '#f57c00'
                      }
                    }}
                  >
                    Top Up Wallet
                  </Button>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handlePayment}
                  disabled={
                    isProcessing ||
                    (paymentMethod === 'wallet' && (walletBalance < discountedAmount || walletBalance === 0)) ||
                    isLoading ||
                    (!replacementData && !sessionGroup && !session && !eventDetails && useVoucher && !selectedVoucherId)
                  }
                  sx={{
                    py: 2,
                    backgroundColor: '#4caf50',
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#2e7d32'
                    },
                    '&:disabled': {
                      backgroundColor: '#e0e0e0'
                    }
                  }}
                >
                  {isProcessing ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    eventDetails ? `Register & Pay RM${discountedAmount.toFixed(2)}` : `Pay RM${discountedAmount.toFixed(2)}`
                  )}
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => navigate(-1)}
                  sx={{
                    py: 2,
                    borderRadius: 2,
                    borderColor: '#757575',
                    color: '#757575',
                    '&:hover': {
                      borderColor: '#424242',
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  Back to Booking
                </Button>
              </Box>
            </CardContent>
          </ThemedCard>
        </Box>
      </Box>
    </Container>
  );
};

export default PaymentPage;