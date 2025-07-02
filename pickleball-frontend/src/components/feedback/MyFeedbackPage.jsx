import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../service/api';
import StarRating from './StarRating';
import CourtService from '../../service/CourtService';

const MyFeedbackPage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    targetType: '',
    targetId: '',
    rating: 0,
    review: '',
    tags: []
  });
  const [courtOptions, setCourtOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) return;

    const fetchFeedback = async () => {
      try {
        setLoading(true);
          const response = await api.get('/feedback/user');
        setFeedbackList(response.data);
      } catch (err) {
        setError('Failed to load your feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [isAuthenticated]);

  // Fetch courts when dialog opens and type is 'COURT'
  useEffect(() => {
    if (openDialog && formData.targetType === 'COURT') {
      CourtService.getAllCourts().then(setCourtOptions).catch(() => setCourtOptions([]));
    }
  }, [openDialog, formData.targetType]);

  const handleOpenDialog = (feedback = null) => {
    if (feedback) {
      setFormData({
        targetType: feedback.targetType,
        targetId: feedback.targetId,
        rating: feedback.rating,
        review: feedback.review,
        tags: feedback.tags || []
      });
      setEditMode(true);
      setEditingId(feedback.id);
    } else {
      setFormData({ targetType: '', targetId: '', rating: 0, review: '', tags: [] });
      setEditMode(false);
      setEditingId(null);
    }
    setTagInput('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        targetType: formData.targetType,
        targetId: formData.targetId,
        rating: formData.rating,
        review: formData.review,
        tags: formData.tags
      };
      if (editMode && editingId) {
        await api.put(`/feedback/${editingId}`, payload);
      } else {
        await api.post('/feedback', payload);
      }
      setOpenDialog(false);
      setFormData({ targetType: '', targetId: '', rating: 0, review: '', tags: [] });
      setEditMode(false);
      setEditingId(null);
      // Refresh feedback list
      const response = await api.get('/feedback/user');
      setFeedbackList(response.data);
    } catch (err) {
      alert('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/feedback/${deleteId}`);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      // Refresh feedback list
      const response = await api.get('/feedback/user');
      setFeedbackList(response.data);
    } catch (err) {
      alert('Failed to delete feedback.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
      padding: '40px',
      borderRadius: '20px',
      textAlign: 'center',
      color: 'white',
      marginBottom: '30px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    },
    headerTitle: {
      fontSize: '2.5rem',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '15px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'white',
      padding: '30px',
      borderRadius: '15px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s ease'
    },
    statNumber: {
      fontSize: '3rem',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    card: {
      background: 'white',
      borderRadius: '15px',
      padding: '25px',
      marginBottom: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      position: 'relative'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '15px',
      marginBottom: '15px'
    },
    avatar: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      flexShrink: 0
    },
    cardInfo: {
      flex: 1
    },
    cardTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      marginBottom: '5px',
      color: '#333'
    },
    cardMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '10px',
      fontSize: '0.9rem',
      color: '#666'
    },
    chip: {
      background: '#e3f2fd',
      color: '#1976d2',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '500'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#666'
    }
  };

  const calculateAverageRating = (items) => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + (item.rating || 0), 0);
    return (sum / items.length).toFixed(1);
  };

  if (!isAuthenticated()) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>📝 My Feedback</h1>
          <p>You need to log in to view your feedback.</p>
        </div>
        <div style={styles.emptyState}>
          <a href="/login">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>📝 My Feedback</h1>
        <p>See your submitted feedback and ratings</p>
      </div>

      {/* Statistics */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#1976d2'}}>
            {feedbackList.length}
          </div>
          <div>Total Feedback</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#ff9800'}}>
            {calculateAverageRating(feedbackList)} ⭐
          </div>
          <div>Average Rating</div>
        </div>
      </div>

      {/* Feedback List */}
      {error && (
        <div style={{ color: '#d32f2f', marginBottom: '20px', textAlign: 'center' }}>{error}</div>
      )}
      {loading ? (
        <div style={styles.emptyState}>Loading...</div>
      ) : feedbackList.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.3 }}>💬</div>
          <p>You haven't submitted any feedback yet.</p>
          <p>Be the first to share your thoughts!</p>
        </div>
      ) : (
        feedbackList.map(item => (
          <div key={item.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.avatar}>{item.userName ? item.userName.charAt(0) : '?'}</div>
              <div style={styles.cardInfo}>
                <div style={styles.cardTitle}>{item.targetName || 'Untitled'}</div>
                <div style={styles.cardMeta}>
                  <span>{item.targetType}</span>
                  <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
                  <span style={styles.chip}>{item.rating}★</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <StarRating rating={item.rating} />
                  <span>({item.rating}/5)</span>
                </div>
                <div style={{ color: '#666', lineHeight: '1.6' }}>{item.review}</div>
                {item.tags && item.tags.length > 0 && (
                  <div style={{ margin: '8px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {item.tags.map(tag => (
                      <span key={tag} style={{
                        background: '#e3f2fd',
                        color: '#1976d2',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.9rem'
                      }}>{tag}</span>
                    ))}
                  </div>
                )}
                {/* Edit button only for own feedback */}
                {currentUser && item.userUsername === currentUser.username && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: 10 }}>
                    <button
                      style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer', fontSize: 14 }}
                      onClick={() => handleOpenDialog(item)}
                    >
                      Edit
                    </button>
                    <button
                      style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#d32f2f', color: 'white', cursor: 'pointer', fontSize: 14 }}
                      onClick={() => handleDeleteClick(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Floating Action Button */}
      <button 
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
          border: 'none',
          color: 'white',
          fontSize: '32px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}
        onClick={handleOpenDialog}
        title="Add Feedback"
      >
        ➕
      </button>

      {/* Modal Form */}
      {openDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <form onSubmit={handleSubmit} style={{
            background: 'white', borderRadius: '20px', padding: '30px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>{editMode ? 'Edit Feedback' : 'Add New Feedback'}</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Target Type</label>
              <select name="targetType" value={formData.targetType} onChange={handleFormChange} required style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid #e0e0e0' }}>
                <option value="">Select Type</option>
                <option value="COURT">Court</option>
                <option value="EVENT">Event</option>
                <option value="COACH">Coach</option>
              </select>
            </div>
            {formData.targetType === 'COURT' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Court</label>
                <select name="targetId" value={formData.targetId} onChange={handleFormChange} required style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid #e0e0e0' }}>
                  <option value="">Select Court</option>
                  {courtOptions.map(court => (
                    <option key={court.id} value={court.id}>{court.name} ({court.location})</option>
                  ))}
                </select>
              </div>
            )}
            {formData.targetType === 'EVENT' && (
              <div style={{ marginBottom: '20px', color: '#d32f2f' }}>
                <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Event</label>
                <div>Event selection not available yet.</div>
              </div>
            )}
            {formData.targetType === 'COACH' && (
              <div style={{ marginBottom: '20px', color: '#d32f2f' }}>
                <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Coach</label>
                <div>Coach selection not available yet.</div>
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Rating</label>
              <StarRating rating={formData.rating} interactive onRatingChange={r => setFormData(f => ({ ...f, rating: r }))} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Review</label>
              <textarea name="review" value={formData.review} onChange={handleFormChange} required style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid #e0e0e0', minHeight: 80 }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Tags (optional)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {formData.tags.map(tag => (
                  <span key={tag} style={{ background: '#e3f2fd', color: '#1976d2', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} style={{ background: 'none', border: 'none', color: '#1976d2', marginLeft: 4, cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Type and press Enter"
                  style={{ border: 'none', outline: 'none', minWidth: 80 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
              <button type="button" onClick={handleCloseDialog} style={{ padding: '12px 24px', border: 'none', borderRadius: '10px', background: '#f5f5f5', color: '#666', fontSize: 16 }}>Cancel</button>
              <button type="submit" disabled={submitting || !formData.targetType || !formData.targetId || !formData.rating || !formData.review} style={{ padding: '12px 24px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #1976d2, #42a5f5)', color: 'white', fontSize: 16 }}>{submitting ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? 'Update' : 'Submit')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDialogOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
        }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, minWidth: 320, textAlign: 'center' }}>
            <h3 style={{ marginBottom: 24 }}>Are you sure you want to delete this feedback?</h3>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={handleDeleteConfirm}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#d32f2f', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}
              >
                Delete
              </button>
              <button
                onClick={handleDeleteCancel}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#f5f5f5', color: '#333', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFeedbackPage;