import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Paper,
  Alert,
  useTheme,
  Chip,
  Grid,
  Card,
  CardContent,
  alpha
} from '@mui/material';
import { 
  LocalOffer as VoucherIcon,
  CheckCircle as UsedIcon,
  Schedule as ActiveIcon,
  Warning as ExpiredIcon
} from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';

const RedeemHistory = () => {
  const theme = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = UserService.getToken();
        const response = await axios.get('http://localhost:8081/api/voucher-redemption/my-redemptions', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setHistory(response.data);
      } catch (err) {
        setError('Failed to load redemption history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <ActiveIcon sx={{ color: theme.palette.success.main }} />;
      case 'USED':
        return <UsedIcon sx={{ color: theme.palette.info.main }} />;
      case 'EXPIRED':
        return <ExpiredIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return <VoucherIcon sx={{ color: theme.palette.text.disabled }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return theme.palette.success.main;
      case 'USED':
        return theme.palette.info.main;
      case 'EXPIRED':
        return theme.palette.error.main;
      default:
        return theme.palette.text.disabled;
    }
  };

  const getStatusBackground = (status) => {
    switch (status) {
      case 'ACTIVE':
        return alpha(theme.palette.success.main, 0.1);
      case 'USED':
        return alpha(theme.palette.info.main, 0.1);
      case 'EXPIRED':
        return alpha(theme.palette.error.main, 0.1);
      default:
        return alpha(theme.palette.text.disabled, 0.1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiry date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Box mt={4} textAlign="center">
        <VoucherIcon sx={{ fontSize: 60, color: theme.palette.text.disabled, mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          No redemption history found
        </Typography>
        <Typography variant="body1" color="textSecondary" mt={1}>
          You haven't redeemed any vouchers yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Redemption History
      </Typography>
      
      <Grid container spacing={3}>
        {history.map((redemption) => (
          <Grid item xs={12} md={6} lg={4} key={redemption.id}>
            <Card sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <VoucherIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {redemption.voucherCode}
                    </Typography>
                  </Box>
                  {getStatusIcon(redemption.status)}
                </Box>

                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                  {redemption.voucherTitle}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {redemption.voucherDescription}
                </Typography>

                <Box sx={{ 
                  backgroundColor: getStatusBackground(redemption.status),
                  p: 2,
                  borderRadius: 2,
                  mb: 2
                }}>
                  <Chip 
                    label={redemption.status}
                    size="small"
                    sx={{ 
                      backgroundColor: getStatusColor(redemption.status),
                      color: 'white',
                      fontWeight: 'bold',
                      mb: 1
                    }}
                  />
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Redeemed:</strong> {formatDate(redemption.redemptionDate)}
                  </Typography>
                  
                  {redemption.expiryDate && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Expires:</strong> {formatDate(redemption.expiryDate)}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pt: 1,
                  borderTop: `1px solid ${theme.palette.divider}`
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Discount: {redemption.discountType === 'percentage' ? 
                      `${redemption.discountValue}%` : 
                      `RM${redemption.discountValue}`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RedeemHistory;