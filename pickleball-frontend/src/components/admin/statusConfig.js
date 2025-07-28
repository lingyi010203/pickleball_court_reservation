// 统一 status 配置和 Chip 渲染
import { Chip } from '@mui/material';

export const STATUS_CONFIG = {
  // Booking/Request Status
  PENDING:    { label: 'Pending',   color: '#c0392b', bg: '#ffebee' },
  CONFIRMED:  { label: 'Confirmed', color: '#4caf50', bg: '#e8f5e9' },
  CANCELLED:  { label: 'Cancelled', color: '#f44336', bg: '#ffebee' },
  COMPLETED:  { label: 'Completed', color: '#2196f3', bg: '#e3f2fd' },
  CANCELLATION_REQUESTED: { label: 'Cancel Requested', color: '#9c27b0', bg: '#f3e5f5' },
  // UserType
  ADMIN: { label: 'Admin', color: '#1565c0', bg: '#e3f2fd' },
  COACH: { label: 'Coach', color: '#388e3c', bg: '#e8f5e9' },
  EVENTORGANIZER: { label: 'Event Organizer', color: '#8e44ad', bg: '#f3e5f5' },
  USER: { label: 'User', color: '#555', bg: '#f5f5f5' },
  // User Status
  ACTIVE: { label: 'Active', color: '#388e3c', bg: '#e8f5e9' },
  INACTIVE: { label: 'Inactive', color: '#ff9800', bg: '#fff8e1' },
  SUSPENDED: { label: 'Suspended', color: '#c0392b', bg: '#ffebee' },
  DELETED: { label: 'Deleted', color: '#c0392b', bg: '#ffebee' }
};

export const getStatusChip = (status, options = {}) => {
  const config = STATUS_CONFIG[status] || { label: status, color: '#9e9e9e', bg: '#f5f5f5' };
  return (
    <Chip
      label={config.label}
      size={options.size || 'small'}
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 600,
        borderRadius: 6,
        fontSize: options.size === 'medium' ? 16 : 14,
        boxShadow: 1,
        px: 1.5,
        textTransform: 'capitalize',
        ...options.sx
      }}
    />
  );
}; 