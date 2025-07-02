import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { Table, TableHead, TableBody, TableRow, TableCell, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import axios from 'axios';
import UserService from '../../service/UserService';

const AdminModerationDashboard = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detail, setDetail] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    api.get('/admin/reported-feedback').then(res => setReports(res.data));
  }, []);

  useEffect(() => {
    const fetchFeedback = async () => {
      const token = UserService.getAdminToken();
      try {
        const response = await axios.get('http://localhost:8081/api/admin/moderation/feedback', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFeedbackList(response.data);
      } catch (err) {
        console.error('Failed to fetch feedback:', err);
      }
    };
    fetchFeedback();
  }, []);

  const handleView = (reportId) => {
    api.get(`/admin/reported-feedback/${reportId}`).then(res => {
      setDetail(res.data);
      setSelectedReport(reportId);
    });
  };

  const handleAction = (action) => {
    api.post(`/admin/reported-feedback/${selectedReport}/action`, { action })
      .then(() => {
        setDetail(null);
        setSelectedReport(null);
        api.get('/admin/reported-feedback').then(res => setReports(res.data));
      });
  };

  const handleViewUser = (userName) => {
    axios.get(`/api/admin/user-profile/${userName}`, {
      headers: { Authorization: `Bearer ${UserService.getAdminToken()}` }
    }).then(res => setSelectedUser(res.data));
  };

  const handleDeleteFeedback = async (feedbackId) => {
    const token = UserService.getAdminToken();
    try {
      await axios.delete(`http://localhost:8081/api/admin/moderation/feedback/${feedbackId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbackList(feedbackList.filter(fb => fb.id !== feedbackId));
    } catch (err) {
      alert('Failed to delete feedback.');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Moderation Dashboard</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>User Email</TableCell>
            <TableCell>Review</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Target</TableCell>
            <TableCell>Avg. Rating</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {feedbackList.map(fb => (
            <TableRow key={fb.id}>
              <TableCell>
                <Button onClick={() => handleViewUser(fb.userName)}>{fb.userName}</Button>
              </TableCell>
              <TableCell>{fb.userEmail}</TableCell>
              <TableCell>{fb.review}</TableCell>
              <TableCell>{fb.rating}</TableCell>
              <TableCell>{fb.targetName}</TableCell>
              <TableCell>{fb.averageRating ? fb.averageRating.toFixed(2) : '-'}</TableCell>
              <TableCell>
                <Button color="error" onClick={() => handleDeleteFeedback(fb.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {detail && (
        <div style={{ border: '1px solid #ccc', marginTop: 24, padding: 16 }}>
          <h3>Reported Feedback Detail</h3>
          <p><b>Feedback:</b> {detail.feedback.review}</p>
          <p><b>Reporter:</b> {detail.reporterName}</p>
          <p><b>Reporter Comment:</b> {detail.reporterComment}</p>
          <p><b>Target:</b> {detail.feedback.targetType} - {detail.feedback.targetName}</p>
          <p><b>Average Rating for Target:</b> {detail.feedback.averageRating ? detail.feedback.averageRating.toFixed(2) : '-'}</p>
          <p><b>Commented User:</b> {detail.commentedUserProfile?.name} ({detail.commentedUserProfile?.email})</p>
          <button onClick={() => handleAction('REMOVE')}>Remove Review</button>
          <button onClick={() => handleAction('WARN')}>Warn User</button>
          <button onClick={() => handleAction('DISMISS')}>Dismiss Report</button>
          <button onClick={() => handleAction('RESOLVE_NO_ACTION')}>No Action</button>
          <button onClick={() => { setDetail(null); setSelectedReport(null); }}>Close</button>
        </div>
      )}
      {selectedUser && (
        <Dialog open={true} onClose={() => setSelectedUser(null)}>
          <DialogTitle>User Details</DialogTitle>
          <DialogContent>
            <Typography>Name: {selectedUser.name}</Typography>
            <Typography>Email: {selectedUser.email}</Typography>
            {/* Add more fields as needed */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedUser(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default AdminModerationDashboard;