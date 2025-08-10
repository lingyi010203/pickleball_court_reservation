import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme as useMuiTheme,
  Divider,
  Grid,
  Fade,
  Slide,
  Stack
} from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import {
  Gavel,
  Security,
  Payment,
  Cancel,
  Warning,
  CheckCircle,
  Email,
  Phone,
  VerifiedUser
} from '@mui/icons-material';

const TermsPage = () => {
  const muiTheme = useMuiTheme();
  const { getPrimaryColor } = useTheme();

  const sections = [
    {
      title: 'Acceptance of Terms',
      icon: 'check',
      content: [
        {
          subtitle: 'Agreement to Terms',
          text: 'By accessing and using Picklefy, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'
        },
        {
          subtitle: 'Modifications',
          text: 'We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page.'
        }
      ]
    },
    {
      title: 'User Accounts',
      icon: 'security',
      content: [
        {
          subtitle: 'Account Creation',
          text: 'You must create an account to access certain features of our service. You are responsible for maintaining the confidentiality of your account information and password.'
        },
        {
          subtitle: 'Account Responsibilities',
          text: 'You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.'
        },
        {
          subtitle: 'Age Requirements',
          text: 'You must be at least 18 years old to create an account. Users under 18 must have parental consent and supervision.'
        }
      ]
    },
    {
      title: 'Booking and Payment',
      icon: 'payment',
      content: [
        {
          subtitle: 'Booking Process',
          text: 'Court bookings are subject to availability. All bookings must be confirmed and paid for in advance through our secure payment system.'
        },
        {
          subtitle: 'Payment Terms',
          text: 'All fees are non-refundable except as specified in our cancellation policy. We accept major credit cards and digital payment methods.'
        },
        {
          subtitle: 'Pricing',
          text: 'Prices are subject to change without notice. Current pricing is displayed at the time of booking and will be confirmed in your booking confirmation.'
        }
      ]
    },
    {
      title: 'Cancellation and Refunds',
      icon: 'cancel',
      content: [
        {
          subtitle: 'Cancellation Policy',
          text: 'Cancellations must be made at least 24 hours before the scheduled booking time for a full refund. Late cancellations may incur charges.'
        },
        {
          subtitle: 'Refund Process',
          text: 'Refunds will be processed within 5-7 business days and will be credited to the original payment method used for the booking.'
        },
        {
          subtitle: 'No-Show Policy',
          text: 'Failure to show up for a booking without prior cancellation will result in forfeiture of the booking fee and may affect future booking privileges.'
        }
      ]
    },
    {
      title: 'User Conduct',
      icon: 'gavel',
      content: [
        {
          subtitle: 'Prohibited Activities',
          text: 'Users must not engage in any illegal activities, harassment, or behavior that disrupts the experience of other users. Violation may result in account suspension.'
        },
        {
          subtitle: 'Court Rules',
          text: 'All users must follow the rules and regulations of the courts they book. This includes proper attire, equipment usage, and respect for other players.'
        },
        {
          subtitle: 'Safety Requirements',
          text: 'Users are responsible for their own safety and the safety of others. Proper sports equipment and protective gear should be used as appropriate.'
        }
      ]
    },
    {
      title: 'Liability and Disclaimers',
      icon: 'warning',
      content: [
        {
          subtitle: 'Limitation of Liability',
          text: 'Picklefy is not liable for any injuries, damages, or losses that occur during court usage. Users participate at their own risk.'
        },
        {
          subtitle: 'Service Availability',
          text: 'We strive to maintain service availability but do not guarantee uninterrupted access. We are not liable for any service interruptions.'
        },
        {
          subtitle: 'Third-Party Services',
          text: 'Our platform may integrate with third-party services. We are not responsible for the content or practices of these third-party services.'
        }
      ]
    }
  ];

  // Helper: render icon
  const renderIcon = (iconType, size = 40, color) => {
    const commonSx = { fontSize: size, color };
    switch (iconType) {
      case 'check':
        return <CheckCircle sx={commonSx} />;
      case 'security':
        return <Security sx={commonSx} />;
      case 'payment':
        return <Payment sx={commonSx} />;
      case 'cancel':
        return <Cancel sx={commonSx} />;
      case 'gavel':
        return <Gavel sx={commonSx} />;
      case 'warning':
        return <Warning sx={commonSx} />;
      default:
        return <CheckCircle sx={commonSx} />;
    }
  };

  // Helper: color per icon type for subtle accent
  const getIconColor = (iconType) => {
    switch (iconType) {
      case 'check':
        return getPrimaryColor();
      case 'security':
        return '#4CAF50';
      case 'payment':
        return '#2196F3';
      case 'cancel':
        return '#FF9800';
      case 'gavel':
        return '#E91E63';
      case 'warning':
        return '#9C27B0';
      default:
        return getPrimaryColor();
    }
  };

  const prohibitedActivities = [
    'Harassment or abusive behavior towards other users',
    'Sharing account credentials with others',
    'Attempting to circumvent booking restrictions',
    'Using the service for commercial purposes without authorization',
    'Posting inappropriate or offensive content',
    'Attempting to gain unauthorized access to our systems'
  ];

  const userRights = [
    'Access to available courts based on your membership tier',
    'Cancel bookings within the allowed timeframe',
    'Request support and assistance from our team',
    'Update your profile and preferences',
    'Participate in community features and events',
    'Provide feedback and suggestions for improvement'
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      // Keep page background inherited to match About/Privacy adjustments
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
                // background removed to follow Privacy adjustments
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Gavel sx={{ fontSize: 50, color: getPrimaryColor(), mb: 2 }} />
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Terms of Service
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Please read these terms carefully
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                These Terms of Service govern your use of Picklefy and outline the rules, rights, and responsibilities for using our platform and services.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Last Updated */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={400}>
          <Fade in={true} timeout={600}>
            <Paper
              elevation={24}
              sx={{
                p: 4,
                mb: 6,
                borderRadius: '20px',
                // background removed to follow Privacy adjustments
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Last Updated: December 2024
              </Typography>
              <Typography variant="body1" color="text.secondary">
                These terms are effective as of the date listed above. Continued use of our services constitutes acceptance of these terms.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Main Sections */}
        <Stack spacing={4}>
          {sections.map((section, index) => {
            const iconColor = getIconColor(section.icon);
            return (
              <Slide key={index} direction="up" in={true} mountOnEnter unmountOnExit timeout={600 + index * 200}>
                <Fade in={true} timeout={800 + index * 200}>
                  <Paper
                    elevation={24}
                    sx={{
                      p: 5,
                      borderRadius: '24px',
                      // background removed to follow Privacy adjustments
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${muiTheme.palette.divider}`,
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                      <Box sx={{ p: 2, borderRadius: '16px', color: iconColor, mr: 3 }}>
                        {renderIcon(section.icon, 32, iconColor)}
                      </Box>
                      <Typography variant="h4" fontWeight="bold">
                        {section.title}
                      </Typography>
                    </Box>
                    <Stack spacing={3}>
                      {section.content.map((item, itemIndex) => (
                        <Box key={itemIndex}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: iconColor }}>
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
            );
          })}
        </Stack>

        {/* Prohibited Activities */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1400}>
          <Fade in={true} timeout={1600}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                mt: 6,
                borderRadius: '24px',
                // background removed to follow Privacy adjustments
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Prohibited Activities
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                The following activities are strictly prohibited and may result in immediate account suspension or termination:
              </Typography>
              <Grid container spacing={2}>
                {prohibitedActivities.map((activity, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#E91E63' }} />
                      <Typography variant="body1">{activity}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        </Slide>

        {/* User Rights */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1600}>
          <Fade in={true} timeout={1800}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                mt: 4,
                borderRadius: '24px',
                // background removed to follow Privacy adjustments
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Your Rights
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                As a user of Picklefy, you have the following rights:
              </Typography>
              <Grid container spacing={2}>
                {userRights.map((right, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                      <Typography variant="body1">{right}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        </Slide>

        {/* Intellectual Property */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1800}>
          <Fade in={true} timeout={2000}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                mt: 4,
                borderRadius: '24px',
                // background removed to follow Privacy adjustments
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Intellectual Property
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                All content, features, and functionality of Picklefy, including but not limited to text, graphics, logos, and software, are owned by Picklefy and are protected by copyright, trademark, and other intellectual property laws.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You may not reproduce, distribute, or create derivative works from any content on our platform without our express written consent.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Termination */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={2000}>
          <Fade in={true} timeout={2200}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                mt: 4,
                borderRadius: '24px',
                // background removed to follow Privacy adjustments
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Account Termination
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We may terminate or suspend your account at any time for violation of these terms or for any other reason at our sole discretion. Upon termination, your right to use the service will cease immediately.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You may also terminate your account at any time by contacting our support team. Upon termination, we will delete your account information in accordance with our privacy policy.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Governing Law */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={2200}>
          <Fade in={true} timeout={2400}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                mt: 4,
                borderRadius: '24px',
                // background removed to follow Privacy adjustments
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Governing Law
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                These Terms of Service shall be governed by and construed in accordance with the laws of Malaysia. Any disputes arising from these terms or your use of our services shall be resolved in the courts of Malaysia.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Contact Information */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={2400}>
          <Fade in={true} timeout={2600}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                mt: 6,
                borderRadius: '24px',
                // background removed to follow Privacy adjustments
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center">
                Questions About These Terms?
              </Typography>
              <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 5 }}>
                If you have any questions about these Terms of Service, please contact us
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ p: 2, borderRadius: '16px', color: getPrimaryColor() }}>
                      <VerifiedUser sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Legal Team
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        legal@picklefy.com
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ p: 2, borderRadius: '16px', color: getPrimaryColor() }}>
                      <Email sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Support Team
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        support@picklefy.com
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ p: 2, borderRadius: '16px', color: getPrimaryColor() }}>
                      <Phone sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Phone Support
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        +60 12-345 6789
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

export default TermsPage; 