import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  useTheme as useMuiTheme,
  Card,
  CardContent,
  Divider,
  Grid,
  Fade,
  Slide,
  Stack
} from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import { 
  Security, 
  Visibility, 
  DataUsage, 
  Cookie,
  Email,
  Phone,
  Shield,
  Lock,
  PrivacyTip,
  VerifiedUser
} from '@mui/icons-material';

const PrivacyPage = () => {
  const muiTheme = useMuiTheme();
  const { getPrimaryColor } = useTheme();

  const sections = [
    {
      title: 'Information We Collect',
      icon: <DataUsage />,
      color: getPrimaryColor(),
      content: [
        {
          subtitle: 'Personal Information',
          text: 'We collect information you provide directly to us, such as when you create an account, make a booking, or contact us. This may include your name, email address, phone number, and payment information.'
        },
        {
          subtitle: 'Usage Information',
          text: 'We automatically collect certain information about your use of our services, including your IP address, browser type, device information, and how you interact with our platform.'
        },
        {
          subtitle: 'Location Information',
          text: 'With your consent, we may collect your location information to help you find nearby courts and provide location-based services.'
        }
      ]
    },
    {
      title: 'How We Use Your Information',
      icon: <Visibility />,
      color: '#4CAF50',
      content: [
        {
          subtitle: 'Service Provision',
          text: 'We use your information to provide, maintain, and improve our services, including processing bookings, managing your account, and communicating with you.'
        },
        {
          subtitle: 'Communication',
          text: 'We may use your contact information to send you important updates about your bookings, account changes, and promotional offers (with your consent).'
        },
        {
          subtitle: 'Analytics and Improvement',
          text: 'We analyze usage patterns to improve our platform, develop new features, and provide better user experiences.'
        }
      ]
    },
    {
      title: 'Information Sharing',
      icon: <Security />,
      color: '#FF9800',
      content: [
        {
          subtitle: 'Service Providers',
          text: 'We may share your information with trusted third-party service providers who help us operate our platform, such as payment processors and hosting services.'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose your information if required by law or to protect our rights, property, or safety, or that of our users or the public.'
        },
        {
          subtitle: 'Business Transfers',
          text: 'In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.'
        }
      ]
    },
    {
      title: 'Data Security',
      icon: <Shield />,
      color: '#9C27B0',
      content: [
        {
          subtitle: 'Security Measures',
          text: 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.'
        },
        {
          subtitle: 'Data Retention',
          text: 'We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your data at any time.'
        },
        {
          subtitle: 'Your Rights',
          text: 'You have the right to access, correct, or delete your personal information. You can also opt out of marketing communications and control your privacy settings.'
        }
      ]
    }
  ];

  const cookieInfo = [
    {
      type: 'Essential Cookies',
      description: 'These cookies are necessary for the website to function properly and cannot be disabled.',
      examples: 'Authentication, session management, security',
      icon: <Lock />,
      color: '#2196F3'
    },
    {
      type: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website.',
      examples: 'Page views, user behavior, performance metrics',
      icon: <DataUsage />,
      color: '#4CAF50'
    },
    {
      type: 'Functional Cookies',
      description: 'These cookies enable enhanced functionality and personalization.',
      examples: 'Language preferences, user settings, booking history',
      icon: <VerifiedUser />,
      color: '#FF9800'
    },
    {
      type: 'Marketing Cookies',
      description: 'These cookies are used to deliver relevant advertisements and track marketing campaign performance.',
      examples: 'Ad targeting, campaign tracking, social media integration',
      icon: <PrivacyTip />,
      color: '#9C27B0'
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      position: 'relative',
      overflow: 'hidden',
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
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Security sx={{ fontSize: 50, color: getPrimaryColor(), mb: 2 }} />
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Privacy Policy
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Your privacy is important to us
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                This Privacy Policy explains how Picklefy collects, uses, and protects your personal information. 
                We are committed to transparency and ensuring your privacy rights are respected.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Last Updated Section */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={400}>
          <Fade in={true} timeout={600}>
            <Paper
              elevation={24}
              sx={{
                p: 4,
                mb: 6,
                borderRadius: '20px',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Last Updated: December 2024
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This privacy policy is effective as of the date listed above and will remain in effect except with respect to any changes in its provisions in the future.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Main Content Sections */}
        <Stack spacing={4}>
          {sections.map((section, index) => (
            <Slide key={index} direction="up" in={true} mountOnEnter unmountOnExit timeout={600 + index * 200}>
              <Fade in={true} timeout={800 + index * 200}>
                <Paper
                  elevation={24}
                  sx={{
                    p: 5,
                    borderRadius: '24px',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${muiTheme.palette.divider}`,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: '16px', 
                      color: section.color,
                      mr: 3
                    }}>
                      {React.cloneElement(section.icon, { sx: { fontSize: 32 } })}
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {section.title}
                    </Typography>
                  </Box>
                  
                  <Stack spacing={3}>
                    {section.content.map((item, itemIndex) => (
                      <Box key={itemIndex}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: section.color }}>
                          {item.subtitle}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                          {item.text}
                        </Typography>
                        {itemIndex < section.content.length - 1 && (
                          <Divider sx={{ my: 3, opacity: 0.3 }} />
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Fade>
            </Slide>
          ))}
        </Stack>

        {/* Cookie Policy Section */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1200}>
          <Fade in={true} timeout={1400}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                mt: 6,
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '16px', 
                  color: getPrimaryColor(),
                  mr: 3
                }}>
                  <Cookie sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  Cookie Policy
                </Typography>
              </Box>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem', lineHeight: 1.7 }}>
                We use cookies and similar technologies to enhance your experience on our platform. 
                Below is a detailed explanation of the types of cookies we use and their purposes.
              </Typography>

              <Grid container spacing={3}>
                {cookieInfo.map((cookie, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Fade in={true} timeout={1600 + index * 200}>
                      <Card 
                        elevation={8}
                        sx={{ 
                          p: 3,
                          borderRadius: '20px',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${muiTheme.palette.divider}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.15), 0 15px 15px -5px rgba(0, 0, 0, 0.08)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ 
                            p: 1.5, 
                            borderRadius: '12px', 
                            color: cookie.color,
                            mr: 2
                          }}>
                            {React.cloneElement(cookie.icon, { sx: { fontSize: 24 } })}
                          </Box>
                          <Typography variant="h6" fontWeight="bold">
                            {cookie.type}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.6 }}>
                          {cookie.description}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: cookie.color }}>
                          Examples: {cookie.examples}
                        </Typography>
                      </Card>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        </Slide>

        {/* Additional Sections */}
        <Stack spacing={4} sx={{ mt: 6 }}>
          {[
            {
              title: "Children's Privacy",
              content: "Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.",
              icon: <PrivacyTip />,
              color: '#E91E63'
            },
            {
              title: "International Data Transfers",
              content: "Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.",
              icon: <Security />,
              color: '#3F51B5'
            },
            {
              title: "Changes to This Privacy Policy",
              content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last Updated' date. We encourage you to review this Privacy Policy periodically.",
              icon: <VerifiedUser />,
              color: '#009688'
            }
          ].map((section, index) => (
            <Slide key={index} direction="up" in={true} mountOnEnter unmountOnExit timeout={1400 + index * 200}>
              <Fade in={true} timeout={1600 + index * 200}>
                <Paper
                  elevation={24}
                  sx={{
                    p: 5,
                    borderRadius: '24px',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${muiTheme.palette.divider}`,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: '16px', 
                      color: section.color,
                      mr: 3
                    }}>
                      {React.cloneElement(section.icon, { sx: { fontSize: 32 } })}
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {section.title}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                    {section.content}
                  </Typography>
                </Paper>
              </Fade>
            </Slide>
          ))}
        </Stack>

        {/* Contact Section */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1800}>
          <Fade in={true} timeout={2000}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                mt: 6,
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" component="h2" textAlign="center" fontWeight="bold" gutterBottom>
                Contact Us
              </Typography>
              <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 5 }}>
                If you have any questions about this Privacy Policy or our data practices
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        color: getPrimaryColor()
                      }}
                    >
                      <Email sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        privacy@picklefy.com
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        color: getPrimaryColor()
                      }}
                    >
                      <Phone sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Phone
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        +60 12-345 6789
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        color: getPrimaryColor()
                      }}
                    >
                      <VerifiedUser sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Data Protection Officer
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        dpo@picklefy.com
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

export default PrivacyPage; 