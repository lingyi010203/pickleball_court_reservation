import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box,
  Grid, Button, TextField, CircularProgress, Chip, Divider, Avatar, Snackbar, Alert,
  Menu, MenuItem, ListItemIcon, ListItemText, FormControl, InputLabel, Select
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShareIcon from '@mui/icons-material/Share';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { getStatusChip } from './statusConfig';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axiosConfig';

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
  isAdmin = false,
}) => {
  const { t } = useLanguage();
  usePageTheme('admin'); // 设置页面类型为admin
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [shareMenuAnchor, setShareMenuAnchor] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [shareRecipient, setShareRecipient] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const safeBooking = booking || {};
  const safeCancellation = cancellationRequest || safeBooking.cancellationRequest || {};

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleShareMenuOpen = (event) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareMenuClose = () => {
    setShareMenuAnchor(null);
  };

  // 创建分享文本
  const createShareText = () => {
    return `🏓 My Pickleball Booking\n\nCourt: ${safeBooking.courtName}\nLocation: ${safeBooking.courtLocation}\nDate: ${timeInfo.date}\nTime: ${timeInfo.timeRange}\nDuration: ${timeInfo.duration}\nPurpose: ${safeBooking.purpose}\nPlayers: ${safeBooking.numberOfPlayers}${safeBooking.numPaddles > 0 ? `\nPaddles: ${safeBooking.numPaddles}` : ''}${safeBooking.buyBallSet ? '\nBall Set: Yes' : ''}\n\nTotal: RM ${safeBooking.totalAmount?.toFixed(2)}`;
  };

  // 复制到剪贴板
  const copyToClipboard = () => {
    const shareText = createShareText();
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareText).then(() => {
        showSnackbar(t('admin.bookingDetailsCopiedToClipboard'), 'success');
      }).catch(() => {
        // 如果剪贴板API失败，使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSnackbar(t('admin.bookingDetailsCopiedToClipboard'), 'success');
      });
    } else {
      // 传统方法
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSnackbar(t('admin.bookingDetailsCopiedToClipboard'), 'success');
    }
    handleShareMenuClose();
  };

  // 分享到WhatsApp
  const shareToWhatsApp = () => {
    const shareText = createShareText();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
    showSnackbar('Opening WhatsApp... 📱', 'success');
    handleShareMenuClose();
  };

  // 获取朋友列表
  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends/accepted');
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  // 搜索用户
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/users/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 选择用户
  const selectUser = (username) => {
    setShareRecipient(username);
    setSearchQuery(username);
    setShowSearchResults(false);
  };

  // 生成分享消息内容
  const generateShareMessage = () => {
    let priceInfo = '';
    
    if (safeBooking.voucherUsed) {
      priceInfo = `💰 Original: RM${safeBooking.originalAmount?.toFixed(2) || '0.00'}
🎫 Voucher: ${safeBooking.voucherCode || 'Voucher'}
💸 Discount: -RM${safeBooking.discountAmount?.toFixed(2) || '0.00'}
✅ Final: RM${safeBooking.totalAmount?.toFixed(2) || '0.00'}`;
    } else {
      priceInfo = `💰 Total: RM${safeBooking.totalAmount?.toFixed(2) || '0.00'}`;
    }
    
    return `🏓 My Pickleball Booking

📅 Date: ${timeInfo.date}
⏰ Time: ${timeInfo.timeRange}
🏟️ Court: ${safeBooking.courtName || 'Court'}
📍 Location: ${safeBooking.courtLocation || 'Location'}
👥 Players: ${safeBooking.numberOfPlayers || 2}
⏱️ Duration: ${timeInfo.duration}
${safeBooking.purpose ? `🎯 Purpose: ${safeBooking.purpose}\n` : ''}${safeBooking.numPaddles > 0 ? `🏓 Paddles: ${safeBooking.numPaddles} (RM5 each)\n` : ''}${safeBooking.buyBallSet ? '🏐 Ball Set: Yes (RM12)\n' : ''}
${priceInfo}

Join me for a great game! 🏓`;
  };

  // 处理分享
  const handleShare = () => {
    setShareMessage(generateShareMessage());
    setShareDialogOpen(true);
  };

  // 发送分享消息
  const handleSendShare = async () => {
    if (!shareRecipient.trim()) {
      showSnackbar('Please enter a recipient username', 'error');
      return;
    }

    setIsSharing(true);
    try {
      const params = new URLSearchParams({
        recipient: shareRecipient.trim(),
        content: shareMessage
      });

      await api.post(`/messages/send?${params.toString()}`);
      showSnackbar('Message sent successfully!', 'success');
      setShareDialogOpen(false);
      setShareRecipient('');
      setShareMenuAnchor(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      showSnackbar('Failed to send message: ' + (error.response?.data || error.message), 'error');
    } finally {
      setIsSharing(false);
    }
  };

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
        timeRange: t('admin.noSlotInfo'),
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
        {isAdmin ? t('admin.bookingDetailsAdminView') : t('admin.myBookingDetails')}
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {/* 预订信息 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            {t('admin.bookingInfo')}
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
            
            {/* 管理员可以看到的额外信息 */}
            {isAdmin && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  {t('admin.adminInformation')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('admin.bookingDate')}</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(safeBooking.bookingDate)}
                    </Typography>
                  </Box>
                  {safeBooking.paymentId && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Payment ID</Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {safeBooking.paymentId}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            
            {/* 日期和时间 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <EventIcon color="primary" sx={{ mr: 0.5 }} />
              <Typography variant="body1" fontWeight={500}>
                {timeInfo.date} {timeInfo.timeRange}
              </Typography>
            </Box>

            {/* 多 slot 详细信息 - 只在多slot预订时显示 */}
            {timeInfo.isMultiSlot && timeInfo.allSlots && timeInfo.allSlots.length > 1 && (
              <Box sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                  {t('admin.allTimeSlots')}
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
                {t('admin.court')}:
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
                <Typography variant="caption" color="text.secondary">{t('admin.duration')}</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {timeInfo.duration}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t('admin.totalAmount')}</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {safeBooking.totalAmount != null ? `RM ${safeBooking.totalAmount.toFixed(2)}` : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t('admin.paymentMethod')}</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {safeBooking.paymentMethod === 'WALLET' ? t('admin.wallet') : (safeBooking.paymentMethod || '-')}
                </Typography>
              </Box>
            </Box>
            
            {/* Additional Payment Information */}
            {(safeBooking.paymentType || safeBooking.paymentStatus || safeBooking.transactionId) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mt: 1 }}>
                {safeBooking.paymentType && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('admin.paymentType')}</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {safeBooking.paymentType}
                    </Typography>
                  </Box>
                )}
                {safeBooking.paymentStatus && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('admin.paymentStatus')}</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {safeBooking.paymentStatus}
                    </Typography>
                  </Box>
                )}
                {isAdmin && safeBooking.paymentId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('admin.paymentId')}</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {safeBooking.paymentId}
                    </Typography>
                  </Box>
                )}
                {isAdmin && safeBooking.transactionId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('admin.transactionId')}</Typography>
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
              {t('admin.bookingDetails')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {safeBooking.purpose && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('admin.purpose')}</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {safeBooking.purpose}
                  </Typography>
                </Box>
              )}
              {safeBooking.numberOfPlayers && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('admin.numberOfPlayers')}</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {safeBooking.numberOfPlayers}
                  </Typography>
                </Box>
              )}
              {safeBooking.numPaddles > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('admin.paddlesRented')}</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {safeBooking.numPaddles} (RM{safeBooking.numPaddles * 5})
                  </Typography>
                </Box>
              )}
              {safeBooking.buyBallSet && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('admin.ballSet')}</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    Yes (RM12)
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Cost Breakdown - 仅用户端显示 */}
        {!isAdmin && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              {t('admin.costBreakdown')}
            </Typography>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.courtRental')} ({timeInfo.duration})
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  RM {(safeBooking.totalAmount - (safeBooking.numPaddles * 5) - (safeBooking.buyBallSet ? 12 : 0)).toFixed(2)}
                </Typography>
              </Box>
              {safeBooking.numPaddles > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.paddles')} ({safeBooking.numPaddles} × RM5)
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    RM {(safeBooking.numPaddles * 5).toFixed(2)}
                  </Typography>
                </Box>
              )}
              {safeBooking.buyBallSet && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.ballSet')}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    RM 12.00
                  </Typography>
                </Box>
              )}
              
              {/* Voucher/Discount Information */}
              {safeBooking.voucherUsed && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Original Amount
                    </Typography>
                    <Typography variant="body2" fontWeight={500} color="#757575">
                      RM {safeBooking.originalAmount?.toFixed(2) || safeBooking.totalAmount?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Voucher Applied
                    </Typography>
                    <Typography variant="body2" fontWeight={500} color="#ff9800">
                      {safeBooking.voucherCode || 'Voucher'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Discount Amount
                    </Typography>
                    <Typography variant="body2" fontWeight={500} color="#4caf50">
                      -RM {safeBooking.discountAmount?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                </>
              )}
              
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" fontWeight={600}>
                  {safeBooking.voucherUsed ? 'Final Amount' : t('admin.total')}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="primary">
                  RM {safeBooking.totalAmount?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* 会员信息 - 仅管理员可见 */}
        {isAdmin && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              {t('admin.memberInformation')}
          </Typography>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: '#5d3587', width: 48, height: 48 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="body1" fontWeight={500}>
                {safeBooking.memberName || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                    {t('admin.memberId')}: {safeBooking.memberId || 'N/A'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t('admin.phone')}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {safeBooking.memberPhone || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t('admin.email')}
              </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {safeBooking.memberEmail || 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Box>
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        {/* 取消信息 */}
        {safeCancellation.reason && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              {t('admin.cancellationReason')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {safeCancellation.reason}
            </Typography>
          </Box>
        )}

        {/* Booking Notes - 仅用户端显示 */}
        {!isAdmin && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              {t('admin.bookingNotes')}
            </Typography>
            <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #bbdefb' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • {t('admin.pleaseArrive10MinutesBefore')} ({timeInfo.timeRange})
              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • {t('admin.bringYourOwnWaterBottle')}
                </Typography>
              {safeBooking.numPaddles > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • {safeBooking.numPaddles} {t('admin.paddlesWillBeAvailable')}
                </Typography>
              )}
              {safeBooking.buyBallSet && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • {t('admin.ballSetWillBeProvided')}
                </Typography>
              )}
              {safeBooking.numberOfPlayers && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • {t('admin.bookingIsForPlayers').replace('player(s)', `${safeBooking.numberOfPlayers} player${safeBooking.numberOfPlayers > 1 ? 's' : ''}`)}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                • {t('admin.forAnyIssuesContactSupport')}
              </Typography>
            </Box>
          </Box>
        )}
        {/* 管理员备注，仅管理员可见 */}
        {isAdmin && safeCancellation.adminRemark && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              {t('admin.adminRemark')}
            </Typography>
            {editableRemark ? (
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={adminRemark}
                onChange={e => onAdminRemarkChange(e.target.value)}
                placeholder={t('admin.enterAdminRemark')}
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
      <DialogActions sx={{ background: '#fff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, flexDirection: 'column', alignItems: 'stretch', p: 2 }}>
        {/* Quick Actions - 仅用户端显示 */}
        {!isAdmin && safeBooking.status === 'CONFIRMED' && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              {t('admin.quickActions')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<CalendarTodayIcon />}
                onClick={() => {
                  // 创建日历事件数据
                  const eventTitle = `Pickleball Booking - ${safeBooking.courtName}`;
                  const eventDescription = `Court: ${safeBooking.courtName}\nLocation: ${safeBooking.courtLocation}\nPurpose: ${safeBooking.purpose}\nPlayers: ${safeBooking.numberOfPlayers}`;
                  
                  // 解析日期和时间
                  const bookingDate = new Date(safeBooking.slotDate || safeBooking.bookingDate);
                  const startTime = safeBooking.startTime || '15:00';
                  const endTime = safeBooking.endTime || '16:00';
                  
                  const [startHour, startMinute] = startTime.split(':');
                  const [endHour, endMinute] = endTime.split(':');
                  
                  const startDateTime = new Date(bookingDate);
                  startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0);
                  
                  const endDateTime = new Date(bookingDate);
                  endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0);
                  
                  // 创建日历URL
                  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventDescription)}&dates=${startDateTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDateTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&location=${encodeURIComponent(safeBooking.courtLocation || '')}`;
                  
                  // 打开Google Calendar
                  window.open(calendarUrl, '_blank');
                  showSnackbar(t('admin.calendarEventCreated'), 'success');
                }}
              >
                {t('admin.addToCalendar')}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<ShareIcon />}
                onClick={handleShareMenuOpen}
              >
                {t('admin.share')}
              </Button>
            </Box>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        {loading && <CircularProgress size={24} sx={{ mr: 2 }} />}
        <Button onClick={onClose} color="primary" variant="outlined">
          {t('admin.close')}
        </Button>
        </Box>
      </DialogActions>

      {/* Share Menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={handleShareMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={shareToWhatsApp}>
          <ListItemIcon>
            <WhatsAppIcon sx={{ color: '#25D366' }} />
          </ListItemIcon>
          <ListItemText primary={t('admin.shareViaWhatsApp')} />
        </MenuItem>
        <MenuItem onClick={copyToClipboard}>
          <ListItemIcon>
            <ContentCopyIcon />
          </ListItemIcon>
          <ListItemText primary={t('admin.copyToClipboard')} />
        </MenuItem>
        <MenuItem onClick={handleShare}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Share to Friend" />
        </MenuItem>
      </Menu>
      
      {/* Share Dialog */}
      <Dialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Share Confirmation
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select Friend or Search User:
            </Typography>
            
            {/* 朋友列表下拉框 */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Select from Friends</InputLabel>
              <Select
                value=""
                onChange={(e) => selectUser(e.target.value)}
                label="Select from Friends"
                onClick={fetchFriends}
              >
                {friends.map((friend) => (
                  <MenuItem key={friend.id} value={friend.username}>
                    {friend.username} {friend.name && `(${friend.name})`}
                  </MenuItem>
                ))}
                {friends.length === 0 && (
                  <MenuItem disabled>No friends found</MenuItem>
                )}
              </Select>
            </FormControl>

            {/* 搜索用户 */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username"
                variant="outlined"
                size="small"
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button
                variant="contained"
                onClick={searchUsers}
                disabled={isSearching || !searchQuery.trim()}
                sx={{ minWidth: '80px' }}
              >
                {isSearching ? '...' : 'Search'}
              </Button>
            </Box>

            {/* 搜索結果 */}
            {showSearchResults && (
              <Box sx={{ mb: 2, maxHeight: 150, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                {searchResults.map((user) => (
                  <Box
                    key={user.id}
                    onClick={() => selectUser(user.username)}
                    sx={{
                      p: 1,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {user.username}
                    </Typography>
                    {user.name && (
                      <Typography variant="body2" color="text.secondary">
                        {user.name}
                      </Typography>
                    )}
                  </Box>
                ))}
                {searchResults.length === 0 && (
                  <Box sx={{ p: 1, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No users found
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* 選中的用戶 */}
            {shareRecipient && (
              <Box sx={{ mb: 2, p: 1, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected: <strong>{shareRecipient}</strong>
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Message Preview:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendShare}
            variant="contained"
            disabled={isSharing || !shareRecipient.trim()}
            sx={{
              backgroundColor: '#2196f3',
              '&:hover': {
                backgroundColor: '#1976d2'
              }
            }}
          >
            {isSharing ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ModernBookingDetailsDialog;