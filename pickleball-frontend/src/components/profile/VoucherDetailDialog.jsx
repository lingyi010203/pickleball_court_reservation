import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Chip,
    Box,
    useTheme,
    Grid // Add this import
} from '@mui/material';
import { ConfirmationNumber as VoucherIcon } from '@mui/icons-material';

const VoucherDetailDialog = ({ open, voucher, onClose }) => {
    const theme = useTheme();

    if (!voucher) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                <Box display="flex" alignItems="center">
                    <VoucherIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">Voucher Details</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        Voucher Code
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                        {voucher.voucherCode}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {voucher.redemptionDate && !isNaN(new Date(voucher.redemptionDate)) ?
                            new Date(voucher.redemptionDate).toLocaleDateString() :
                            'Date not available'}
                    </Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                        <Typography variant="body1" color="text.secondary">
                            Discount
                        </Typography>
                        <Chip
                            label={`${voucher.discountAmount}% OFF`}
                            color="primary"
                            size="medium"
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body1" color="text.secondary">
                            Points Used
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {voucher.requestPoints} pts
                        </Typography>
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography variant="body1" color="text.secondary">
                            Redeemed On
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {new Date(voucher.redemptionDate).toLocaleDateString()}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body1" color="text.secondary">
                            Expires On
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {new Date(voucher.expiryDate).toLocaleDateString()}
                        </Typography>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.grey[100], borderRadius: 2 }}>
                    <Typography variant="body2">
                        This voucher can be applied during checkout to receive your discount.
                        Simply enter the voucher code at the payment step.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VoucherDetailDialog;