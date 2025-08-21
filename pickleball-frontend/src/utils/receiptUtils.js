import api from '../service/api';

export const downloadReceipt = async (receiptData) => {
  try {
    const response = await api.post('/receipt/generate', receiptData, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Create blob and download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename
    const filename = `receipt_${receiptData.bookingId}_${receiptData.bookingDate?.substring(0, 10) || new Date().toISOString().split('T')[0]}.pdf`;
    link.setAttribute('download', filename);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to download receipt:', error);
    throw new Error('Failed to download receipt. Please try again.');
  }
};

export const prepareReceiptData = (booking, court, slot) => {
  return {
    bookingId: booking.id?.toString() || '',
    bookingType: booking.purpose === 'FRIENDLY_MATCH' ? 'FRIENDLY_MATCH' : 'COURT_BOOKING',
    courtName: court?.name || booking.courtName || 'Pickleball Court',
    location: court?.location || booking.courtLocation || 'Location',
    date: slot?.date || booking.slotDate || '',
    startTime: slot?.startTime || booking.startTime || '',
    endTime: slot?.endTime || booking.endTime || '',
    duration: booking.durationHours || 1,
    numberOfPlayers: booking.numberOfPlayers || 1,
    numPaddles: booking.numPaddles || 0,
    buyBallSet: booking.buyBallSet || false,
    originalAmount: booking.originalAmount || booking.totalAmount || 0,
    discountAmount: booking.discountAmount || 0,
    totalAmount: booking.totalAmount || 0,
    paymentMethod: booking.payment?.paymentMethod || 'WALLET',
    paymentStatus: booking.payment?.status || booking.paymentStatus || 'COMPLETED',
    voucherCode: booking.voucherCode || '',
    pointsEarned: booking.pointsEarned || 0,
    bookingDate: booking.bookingDate || new Date().toISOString()
  };
};
