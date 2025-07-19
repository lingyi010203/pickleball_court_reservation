import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box,
  Grid, Button, TextField, CircularProgress, Chip, Divider, Avatar
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import { getStatusChip } from './statusConfig';

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatSlotDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (time) => {
  if (!time) return '-';
  return new Date(`2000-01-01 ${time}`).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ModernBookingDetailsDialog = ({
  open,
  onClose,
  booking = {},
  adminRemark = '',
  onAdminRemarkChange = () => {},
  loading = false,
  editableRemark = false,
  cancellationRequest = null,
}) => {
  const safeBooking = booking || {};
  const safeCancellation = cancellationRequest || safeBooking.cancellationRequest || {};

  // 处理多 slot 预订的时间显示
  const getTimeDisplay = () => {
    if (safeBooking.bookingSlots && safeBooking.bookingSlots.length > 0) {
      // 多 slot 预订
      const slots = safeBooking.bookingSlots.sort((a, b) => 
        new Date(a.slot.startTime) - new Date(b.slot.startTime)
      );
      const firstSlot = slots[0].slot;
      const lastSlot = slots[slots.length - 1].slot;
      
      return {
        date: formatSlotDate(firstSlot.date),
        timeRange: `${formatTime(firstSlot.startTime)} - ${formatTime(lastSlot.endTime)}`,
        duration: `${slots.length} hour(s)`,
        isMultiSlot: true,
        allSlots: slots.map(bs => ({
          date: formatSlotDate(bs.slot.date),
          time: `${formatTime(bs.slot.startTime)} - ${formatTime(bs.slot.endTime)}`,
          duration: `${bs.slot.durationHours || 1} hour(s)`
        }))
      };
    } else if (safeBooking.slotDate && safeBooking.startTime && safeBooking.endTime) {
      // 单 slot 预订
      return {
        date: formatSlotDate(safeBooking.slotDate),
        timeRange: `${formatTime(safeBooking.startTime)} - ${formatTime(safeBooking.endTime)}`,
        duration: safeBooking.durationHours ? `${safeBooking.durationHours} hour(s)` : '1 hour(s)',
        isMultiSlot: false
      };
    } else {
      // 回退到预订日期
      return {
        date: formatDate(safeBooking.bookingDate),
        timeRange: 'No slot info',
        duration: '-',
        isMultiSlot: false
      };
    }
  };

  const timeInfo = getTimeDisplay();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, p: 0, background: '#f8f9fa' }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 22, pb: 1, background: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        Booking Details
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {/* 预订信息 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            Booking Info
          </Typography>
          <Box sx={{ position: 'relative', mb: 2 }}>
            {/* ID 和 Status */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 1 }}>
                #{safeBooking.id || '-'}
              </Typography>
              <Box sx={{ minWidth: 120 }}>
                {getStatusChip(safeBooking.status, { size: 'medium', sx: { fontSize: 18, px: 2, py: 1 } })}
              </Box>
            </Box>
            
            {/* 日期和时间 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <EventIcon color="primary" sx={{ mr: 0.5 }} />
              <Typography variant="body1" fontWeight={500}>
                {timeInfo.date} {timeInfo.timeRange}
              </Typography>
            </Box>

            {/* 多 slot 详细信息 */}
            {timeInfo.isMultiSlot && timeInfo.allSlots && (
              <Box sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                  All Time Slots:
                </Typography>
                {timeInfo.allSlots.map((slot, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    • {slot.date} {slot.time} ({slot.duration})
                  </Typography>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Court:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {safeBooking.courtName || '-'}
              </Typography>
              {safeBooking.courtLocation && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  @ {safeBooking.courtLocation}
                </Typography>
              )}
            </Box>
            
            {/* Duration, Total, Payment */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Duration</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {timeInfo.duration}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {safeBooking.totalAmount != null ? `RM ${safeBooking.totalAmount.toFixed(2)}` : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {safeBooking.paymentMethod || '-'}
                </Typography>
              </Box>
            </Box>
            
            {/* Additional Payment Information */}
            {(safeBooking.paymentType || safeBooking.paymentStatus || safeBooking.transactionId) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mt: 1 }}>
                {safeBooking.paymentType && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Payment Type</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {safeBooking.paymentType}
                    </Typography>
                  </Box>
                )}
                {safeBooking.paymentStatus && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {safeBooking.paymentStatus}
                    </Typography>
                  </Box>
                )}
                {safeBooking.transactionId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {safeBooking.transactionId}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        
        {/* Booking Details */}
        {(safeBooking.purpose || safeBooking.numberOfPlayers || safeBooking.numPaddles || safeBooking.buyBallSet) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              Booking Details
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {safeBooking.purpose && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Purpose</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {safeBooking.purpose}
                  </Typography>
                </Box>
              )}
              {safeBooking.numberOfPlayers && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Number of Players</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {safeBooking.numberOfPlayers}
                  </Typography>
                </Box>
              )}
              {safeBooking.numPaddles > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Paddles Rented</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {safeBooking.numPaddles} (RM{safeBooking.numPaddles * 5})
                  </Typography>
                </Box>
              )}
              {safeBooking.buyBallSet && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Ball Set</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    Yes (RM12)
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
        
        {/* 会员信息 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            Member Info
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#5d3587', width: 48, height: 48 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="body1" fontWeight={500}>
                {safeBooking.memberName || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {safeBooking.memberPhone ? safeBooking.memberPhone : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {safeBooking.memberEmail ? safeBooking.memberEmail : 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        {/* 取消信息 */}
        {safeCancellation.reason && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              Cancellation Reason
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {safeCancellation.reason}
            </Typography>
          </Box>
        )}
        {/* 管理员备注，仅有时显示 */}
        {safeCancellation.adminRemark && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              Admin Remark
            </Typography>
            {editableRemark ? (
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={adminRemark}
                onChange={e => onAdminRemarkChange(e.target.value)}
                placeholder="Enter admin remark..."
                disabled={loading}
              />
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {safeCancellation.adminRemark}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ background: '#fff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
        {loading && <CircularProgress size={24} sx={{ mr: 2 }} />}
        <Button onClick={onClose} color="primary" variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
  };
  
  export default ModernBookingDetailsDialog;