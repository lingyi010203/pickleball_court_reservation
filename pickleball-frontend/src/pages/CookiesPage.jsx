import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme as useMuiTheme,
  Grid,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
  Fade,
  Slide,
  Stack
} from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import { useCookieConsent } from '../context/CookieConsentContext';
import { 
  Cookie, 
  Security, 
  Settings, 
  Info,
  ExpandMore,
  CheckCircle,
  Warning
} from '@mui/icons-material';

const CookiesPage = () => {
  const muiTheme = useMuiTheme();
  const { getPrimaryColor } = useTheme();
  const { prefs, setPrefs, acceptAll, rejectNonEssential, isReady } = useCookieConsent();
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always true, cannot be disabled
    analytics: true,
    functional: true,
    marketing: false
  });
  const [saved, setSaved] = useState(false);

  const cookieTypes = [
    {
      type: 'Essential Cookies',
      description: 'These cookies are necessary for the website to function properly and cannot be disabled.',
      examples: [
        'Authentication cookies to keep you logged in',
        'Session management cookies',
        'Security cookies to protect against fraud',
        'Shopping cart cookies for booking functionality'
      ],
      alwaysActive: true,
      icon: 'security'
    },
    {
      type: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      examples: [
        'Google Analytics cookies to track page views',
        'Performance monitoring cookies',
        'User behavior analysis cookies',
        'Error tracking cookies'
      ],
      alwaysActive: false,
      icon: 'info'
    },
    {
      type: 'Functional Cookies',
      description: 'These cookies enable enhanced functionality and personalization, such as remembering your preferences.',
      examples: [
        'Language preference cookies',
        'Theme preference cookies (dark/light mode)',
        'User interface customization cookies',
        'Booking history cookies'
      ],
      alwaysActive: false,
      icon: 'settings'
    },
    {
      type: 'Marketing Cookies',
      description: 'These cookies are used to deliver relevant advertisements and track marketing campaign performance.',
      examples: [
        'Social media integration cookies',
        'Advertising tracking cookies',
        'Campaign performance cookies',
        'Retargeting cookies'
      ],
      alwaysActive: false,
      icon: 'cookie'
    }
  ];

  const thirdPartyCookies = [
    {
      name: 'Google Analytics',
      purpose: 'Website analytics and performance monitoring',
      duration: '2 years',
      dataCollected: 'Page views, user behavior, device information'
    },
    {
      name: 'Facebook Pixel',
      purpose: 'Social media advertising and tracking',
      duration: '3 months',
      dataCollected: 'Ad interactions, conversion tracking'
    },
    {
      name: 'Stripe',
      purpose: 'Payment processing and security',
      duration: 'Session',
      dataCollected: 'Payment information, transaction security'
    }
  ];

  // Function to render icons based on string identifier
  const renderIcon = (iconType, size = 40) => {
    switch (iconType) {
      case 'security':
        return <Security sx={{ fontSize: size, color: '#E91E63' }} />;
      case 'info':
        return <Info sx={{ fontSize: size, color: '#2196F3' }} />;
      case 'settings':
        return <Settings sx={{ fontSize: size, color: getPrimaryColor() }} />;
      case 'cookie':
        return <Cookie sx={{ fontSize: size, color: '#FF9800' }} />;
      default:
        return <Security sx={{ fontSize: size, color: '#E91E63' }} />;
    }
  };

  const handleCookieChange = (type) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    
    setCookiePreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSavePreferences = () => {
    // Here you would typically save the preferences to localStorage or send to backend
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    setSaved(true);
    
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      functional: true,
      marketing: true
    };
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    setSaved(true);
    
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  const handleRejectAll = () => {
    const allRejected = {
      essential: true, // Essential cookies cannot be rejected
      analytics: false,
      functional: false,
      marketing: false
    };
    setCookiePreferences(allRejected);
    localStorage.setItem('cookiePreferences', JSON.stringify(allRejected));
    setSaved(true);
    
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  // Sync UI with saved prefs when ready
  useEffect(() => {
    if (!isReady) return;
    setCookiePreferences(prev => ({ ...prev, ...prefs }));
  }, [isReady]);

  const handleToggle = (key) => {
    if (key === 'essential') return;
    const next = { ...cookiePreferences, [key]: !cookiePreferences[key] };
    setCookiePreferences(next);
    setPrefs(next);
  };

  const handleSave = () => {
    setPrefs(cookiePreferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      // keep page background inherited
      py: 4,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit>
          <Fade in={true} timeout={800}>
            <Paper
              elevation={24}
              sx={{
                p: { xs: 4, md: 6 },
                mb: 6,
                textAlign: 'center',
                borderRadius: '24px',
                // background removed
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Cookie sx={{ fontSize: 50, color: getPrimaryColor(), mb: 2 }} />
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Cookies Policy
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Understanding how we use cookies
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                We use cookies and similar technologies to enhance your experience on Picklefy. This policy explains what cookies are, how we use them, and how you can control them.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Success Message */}
        {saved && (
          <Slide direction="down" in={saved} mountOnEnter unmountOnExit>
            <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 4, borderRadius: 2 }}>
              Your cookie preferences have been saved successfully!
            </Alert>
          </Slide>
        )}

      {/* What are Cookies */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={600}>
        <Fade in={true} timeout={800}>
          <Paper elevation={24} sx={{ mb: 6, p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          What are Cookies?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Cookies are small text files that are stored on your device when you visit a website. 
          They help websites remember information about your visit, such as your preferred language 
          and other settings, which can make your next visit easier and the site more useful to you.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device 
          when you go offline, while session cookies are deleted as soon as you close your web browser.
        </Typography>
          </Paper>
        </Fade>
      </Slide>

      {/* Cookie Preferences */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={800}>
        <Fade in={true} timeout={1000}>
          <Paper elevation={24} sx={{ mb: 6, p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Manage Your Cookie Preferences
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          You can control which types of cookies we use. Essential cookies are always active as they 
          are necessary for the website to function properly.
        </Typography>

        <Grid container spacing={3}>
          {cookieTypes.map((cookieType, index) => (
            <Grid item xs={12} key={index}>
              <Paper elevation={24} sx={{ p: 3, borderRadius: '20px', backdropFilter: 'blur(10px)', border: `1px solid ${muiTheme.palette.divider}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {renderIcon(cookieType.icon, 40)}
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {cookieType.type}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cookieType.description}
                      </Typography>
                    </Box>
                  </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={cookiePreferences[cookieType.type.toLowerCase().replace(' ', '')]}
                      onChange={() => handleToggle(cookieType.type.toLowerCase().replace(' ', ''))}
                      disabled={cookieType.alwaysActive}
                      color="primary"
                    />
                  }
                  label=""
                />
                </Box>
                
                <Accordion elevation={0} sx={{ background: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="body2" fontWeight="bold">
                      Examples of cookies used
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {cookieType.examples.map((example, exampleIndex) => (
                        <Typography component="li" key={exampleIndex} variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {example}
                        </Typography>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={acceptAll}
            sx={{
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              fontWeight: 'bold',
              textTransform: 'none'
            }}
          >
            Accept All Cookies
          </Button>
          <Button
            variant="outlined"
            onClick={rejectNonEssential}
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          >
            Reject Non-Essential
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          >
            Save Preferences
          </Button>
        </Box>
          </Paper>
        </Fade>
      </Slide>

      {/* Third Party Cookies */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1000}>
        <Fade in={true} timeout={1200}>
          <Paper elevation={24} sx={{ mb: 6, p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Third-Party Cookies
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          We also use third-party cookies from trusted partners to provide additional functionality 
          and improve our services.
        </Typography>

        <Grid container spacing={3}>
          {thirdPartyCookies.map((cookie, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper elevation={24} sx={{ p: 3, borderRadius: '20px', backdropFilter: 'blur(10px)', border: `1px solid ${muiTheme.palette.divider}` }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {cookie.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Purpose:</strong> {cookie.purpose}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Duration:</strong> {cookie.duration}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Data Collected:</strong> {cookie.dataCollected}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
          </Paper>
        </Fade>
      </Slide>

      {/* How to Control Cookies */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1200}>
        <Fade in={true} timeout={1400}>
          <Paper elevation={24} sx={{ mb: 6, p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          How to Control Cookies
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Browser Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Most web browsers allow you to control cookies through their settings preferences. 
              You can usually find these settings in the "Options" or "Preferences" menu of your browser.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              However, please note that disabling certain cookies may affect the functionality 
              of our website and your user experience.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Our Cookie Banner
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              When you first visit our website, you'll see a cookie banner that allows you to 
              accept or reject non-essential cookies. You can change these preferences at any time 
              using the controls on this page.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your preferences are stored locally and will be remembered for future visits.
            </Typography>
          </Grid>
        </Grid>
          </Paper>
        </Fade>
      </Slide>

      {/* Updates to Policy */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1400}>
        <Fade in={true} timeout={1600}>
          <Paper elevation={24} sx={{ mb: 6, p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Updates to This Policy
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          We may update this Cookies Policy from time to time to reflect changes in our practices 
          or for other operational, legal, or regulatory reasons. We will notify you of any material 
          changes by posting the new policy on this page.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          <strong>Last Updated:</strong> December 2024
        </Typography>
          </Paper>
        </Fade>
      </Slide>

      {/* Contact Information */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1600}>
        <Fade in={true} timeout={1800}>
          <Paper elevation={24} sx={{ p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Questions About Cookies?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          If you have any questions about our use of cookies or this policy, please contact us:
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  color: getPrimaryColor()
                }}
              >
                <Cookie sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  privacy@picklefy.com
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  color: getPrimaryColor()
                }}
              >
                <Settings sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Support
                </Typography>
                <Typography variant="body1">
                  support@picklefy.com
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  color: getPrimaryColor()
                }}
              >
                <Info sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Help Center
                </Typography>
                <Typography variant="body1">
                  /helpdesk
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
          </Paper>
        </Fade>
      </Slide>
      </Container>
    </Box>
  );
};

export default CookiesPage; 