import React from 'react';
import { 
  Card, CardContent, Typography, Chip, Button, 
  Box, useTheme, Grid
} from '@mui/material';
import { ConfirmationNumber as VoucherIcon } from '@mui/icons-material';

const RedeemedVoucherCard = ({ voucher }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      height: '100%',
      borderRadius: 3,
      overflow: 'hidden',
      boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
      border: `1px solid ${theme.palette.success.light}`,
      background: theme.palette.success.light + '20'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2
        }}>
          <Box>
            <Typography variant="body1" color="text.secondary">
              Voucher Code
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.success.dark }}>
              {voucher.voucherCode}
            </Typography>
          </Box>
          <VoucherIcon sx={{ color: theme.palette.success.main, fontSize: 32 }} />
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Discount
            </Typography>
            <Chip 
              label={`${voucher.discountAmount}% OFF`} 
              color="success"
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Points Used
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {voucher.requestPoints} pts
            </Typography>
          </Grid>
        </Grid>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Redeemed On
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {new Date(voucher.redemptionDate).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Expires On
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {new Date(voucher.expiryDate).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default RedeemedVoucherCard;