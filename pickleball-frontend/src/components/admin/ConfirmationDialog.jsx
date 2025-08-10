import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, 
  DialogActions, Button
} from '@mui/material';
import { usePageTheme } from '../../hooks/usePageTheme';

const ConfirmationDialog = ({ open, onClose, onConfirm, title, content }) => {
  usePageTheme('admin'); // 设置页面类型为admin
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;