// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect  } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container, 
  useTheme,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import axios from 'axios';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const customTheme = useCustomTheme();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 密码验证函数
  const validatePassword = (password) => {
    const validations = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    return validations;
  };

  const passwordValidations = validatePassword(password);
  const isPasswordValid = Object.values(passwordValidations).every(Boolean);
  const isConfirmValid = password === confirmPassword && password.length > 0;
  const isFormValid = isPasswordValid && isConfirmValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 清除之前的消息
    setMessage('');
    
    // 验证密码
    if (!isPasswordValid) {
      setMessage("Please ensure your password meets all requirements");
      return;
    }
    
    if (!isConfirmValid) {
      setMessage("Passwords don't match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        'http://localhost:8081/api/auth/password/reset', 
        { 
          token, 
          newPassword: password,
          confirmPassword: password // Send only the password, backend will validate
        }
      );
      
      if (response.status === 200) {
        navigate('/reset-password-success');
      }
    } catch (error) {
      // Extract error message from backend response
      const errorMessage = error.response?.data || 
                           error.response?.data?.message || 
                           'Error resetting password. Please try again.';
                           
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4,
        pt: { xs: 20, sm: 24 },
        backgroundColor: theme.palette.background.default,
      }}>
        <Container maxWidth="sm">
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              padding: 4,
            }}
          >
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center', color: theme.palette.text.primary }}>
              Reset Your Password
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary, textAlign: 'center' }}>
              Create a new password for your account
            </Typography>
            
            {message && (
              <Typography color="error" sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
                {message}
              </Typography>
            )}
            
            <TextField
              fullWidth
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={password.length > 0 && !isPasswordValid}
              helperText={password.length > 0 && !isPasswordValid ? "Password does not meet requirements" : ""}
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={() => setShowPassword(!showPassword)}
                    sx={{ minWidth: 'auto', p: 1 }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </Button>
                )
              }}
              sx={{ mb: 2 }}
            />

            {/* 密码要求提示 */}
            {password.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                  Password Requirements:
                </Typography>
                <List dense sx={{ py: 0 }}>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      {passwordValidations.length ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText primary="At least 6 characters" />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      {passwordValidations.uppercase ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText primary="At least one uppercase letter" />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      {passwordValidations.lowercase ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText primary="At least one lowercase letter" />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      {passwordValidations.number ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText primary="At least one number" />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      {passwordValidations.special ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText primary="At least one special character (@$!%*?&)" />
                  </ListItem>
                </List>
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword.length > 0 && !isConfirmValid}
              helperText={confirmPassword.length > 0 && !isConfirmValid ? "Passwords do not match" : ""}
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    sx={{ minWidth: 'auto', p: 1 }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </Button>
                )
              }}
              sx={{ mb: 3 }}
            />
            
            <Button
              fullWidth
              variant="contained"
              sx={{
                py: 1.5,
                backgroundColor: theme.palette.primary.main,
                '&:hover': { backgroundColor: theme.palette.primary.dark },
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </Box>
        </Container>
      </Box>
      
      <Footer />
    </Box>
  );
};

export default ResetPasswordPage;