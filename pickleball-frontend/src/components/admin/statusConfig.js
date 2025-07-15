// 统一 status 配置和 Chip 渲染
import { Chip } from '@mui/material';

export const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',   color: '#ff9800', bg: '#fff8e1' },
  CONFIRMED:  { label: 'Confirmed', color: '#4caf50', bg: '#e8f5e9' },
  CANCELLED:  { label: 'Cancelled', color: '#f44336', bg: '#ffebee' },
  COMPLETED:  { label: 'Completed', color: '#2196f3', bg: '#e3f2fd' },
  CANCELLATION_REQUESTED: { label: 'Cancel Requested', color: '#9c27b0', bg: '#f3e5f5' }
};

export const getStatusChip = (status) => {
  const config = STATUS_CONFIG[status] || { label: status, color: '#9e9e9e', bg: '#f5f5f5' };
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 600,
        borderRadius: '4px',
        textTransform: 'capitalize',
        fontSize: 14
      }}
    />
  );
}; 