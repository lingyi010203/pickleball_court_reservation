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
  Chip
} from '@mui/material';
import { LocalOffer as VoucherIcon } from '@mui/icons-material';
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
        const response = await fetch('http://localhost:8081/api/member/redeem-history', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch redemption history');
        }
        
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError('Failed to load redemption history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

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
    <Paper sx={{ 
      p: 3, 
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      background: theme.palette.background.paper
    }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Your Redeemed Vouchers
      </Typography>
      <List>
        {history.map((voucher, index) => (
          <React.Fragment key={voucher.id}>
            <ListItem>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    <VoucherIcon sx={{ color: theme.palette.primary.main, mr: 2 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {voucher.code}
                    </Typography>
                    <Chip 
                      label={`${voucher.discountAmount}% OFF`}
                      color="primary"
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Box>
                }
                secondary={
                  <Box mt={1}>
                    <Typography variant="body2" color="text.primary">
                      Points used: {voucher.requestPoints}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      Expires: {new Date(voucher.expiryDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < history.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default RedeemHistory;