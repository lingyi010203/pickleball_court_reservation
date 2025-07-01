import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Box,
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CourtService from '../../service/CourtService';
import { useAuth } from '../../context/AuthContext'; // 导入认证上下文

const CourtListPage = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();
  
  // 使用认证上下文获取认证状态
  const { authToken, currentUser, logout } = useAuth();

  const fetchCourts = async () => {
    try {
      setLoading(true);
      setError(null);
      setPermissionError(false);
      
      // 检查用户是否认证
      if (!authToken || !currentUser) {
        throw new Error('User not authenticated');
      }
      
      // 检查用户角色是否有权限
      if (!currentUser.role || !currentUser.role.includes('USER')) {
        setPermissionError(true);
        return;
      }
      
      const courtsData = await CourtService.getAllCourts();
      setCourts(courtsData);
    } catch (err) {
      console.error('Failed to fetch courts:', err);
      
      if (err.message.includes('permission') || 
          err.message.includes('403') || 
          err.message.includes('no permission')) {
        setPermissionError(true);
      } else {
        setError(err.message || 'Failed to load courts');
      }
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, [authToken, currentUser]); // 当认证状态变化时重新加载

  const handleRetry = () => {
    fetchCourts();
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewDetails = (courtId) => {
    navigate(`/courts/${courtId}`);
  };

  if (loading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading courts...</Typography>
      </Container>
    );
  }

  if (permissionError) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Card sx={{ p: 4, maxWidth: 500, margin: 'auto' }}>
          <Typography variant="h5" gutterBottom color="error">
            Access Denied
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            You don't have permission to view courts. Your role: {currentUser?.role || 'unknown'}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleRetry}
            >
              Retry
            </Button>
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Available Courts
        </Typography>
      </Box>
      
      {error ? (
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button variant="outlined" onClick={handleRetry}>
            Retry
          </Button>
        </Card>
      ) : courts.length === 0 ? (
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No courts available at the moment
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={handleRetry}>
            Refresh
          </Button>
        </Card>
      ) : (
        <Grid container spacing={4}>
          {courts.map((court) => (
            <Grid item xs={12} sm={6} md={4} key={court.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 3
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                    {court.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {court.location}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1,
                    backgroundColor: court.status === 'AVAILABLE' ? '#e8f5e9' : '#fffde7',
                    p: 1,
                    borderRadius: 1
                  }}>
                    <Box sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: court.status === 'AVAILABLE' ? '#4caf50' : '#ffc107',
                      mr: 1
                    }} />
                    <Typography variant="body2">
                      <strong>Status:</strong> {court.status || 'Available'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Hours:</strong> {court.openingTime || 'N/A'} - {court.closingTime || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Operating Days:</strong> {court.operatingDays || 'Everyday'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Peak:</strong> RM{court.peakHourlyPrice?.toFixed(2) || '0.00'}/hr
                    </Typography>
                    <Typography variant="body2">
                      <strong>Off-Peak:</strong> RM{court.offPeakHourlyPrice?.toFixed(2) || '0.00'}/hr
                    </Typography>
                  </Box>
                </CardContent>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ m: 2, fontWeight: 'bold' }}
                  onClick={() => handleViewDetails(court.id)}
                >
                  View & Book
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          © {new Date().getFullYear()} Pickleball App. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default CourtListPage;