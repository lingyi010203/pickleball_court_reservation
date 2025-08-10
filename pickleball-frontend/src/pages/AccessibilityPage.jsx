import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme as useMuiTheme,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Fade,
  Slide,
  Stack
} from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import { 
  Accessibility, 
  Visibility, 
  Hearing, 
  TouchApp, 
  Keyboard,
  CheckCircle,
  Info,
  Warning
} from '@mui/icons-material';

const AccessibilityPage = () => {
  const muiTheme = useMuiTheme();
  const { getPrimaryColor } = useTheme();

  const accessibilityFeatures = [
    {
      category: 'Visual Accessibility',
      icon: <Visibility sx={{ fontSize: 40, color: muiTheme.palette.primary.main }} />,
      features: [
        'High contrast mode for better visibility',
        'Adjustable font sizes and zoom capabilities',
        'Screen reader compatibility with ARIA labels',
        'Color-blind friendly design with sufficient contrast ratios',
        'Clear typography with readable fonts',
        'Alternative text for all images and graphics'
      ]
    },
    {
      category: 'Motor Accessibility',
      icon: <TouchApp sx={{ fontSize: 40, color: muiTheme.palette.secondary.main }} />,
      features: [
        'Keyboard navigation support throughout the site',
        'Large clickable areas for touch interfaces',
        'Voice control compatibility',
        'Customizable cursor and pointer settings',
        'Reduced motion options for users with vestibular disorders',
        'Alternative input methods support'
      ]
    },
    {
      category: 'Auditory Accessibility',
      icon: <Hearing sx={{ fontSize: 40, color: muiTheme.palette.success.main }} />,
      features: [
        'Closed captions for all video content',
        'Audio descriptions for visual content',
        'Visual alerts and notifications',
        'Transcripts for audio content',
        'Volume controls and audio settings',
        'Alternative communication methods'
      ]
    },
    {
      category: 'Cognitive Accessibility',
      icon: <Accessibility sx={{ fontSize: 40, color: muiTheme.palette.info.main }} />,
      features: [
        'Clear and simple navigation structure',
        'Consistent design patterns throughout the site',
        'Plain language content and instructions',
        'Error prevention and clear error messages',
        'Multiple ways to complete tasks',
        'Minimal distractions and clean layouts'
      ]
    }
  ];

  const complianceStandards = [
    {
      standard: 'WCAG 2.1 AA',
      description: 'Web Content Accessibility Guidelines 2.1 Level AA compliance',
      status: 'Compliant',
      color: 'success'
    },
    {
      standard: 'Section 508',
      description: 'U.S. federal accessibility requirements',
      status: 'Compliant',
      color: 'success'
    },
    {
      standard: 'ADA Title III',
      description: 'Americans with Disabilities Act digital accessibility',
      status: 'Compliant',
      color: 'success'
    },
    {
      standard: 'EN 301 549',
      description: 'European accessibility standard for ICT products and services',
      status: 'In Progress',
      color: 'warning'
    }
  ];

  const assistiveTechnologies = [
    {
      name: 'Screen Readers',
      description: 'Compatible with JAWS, NVDA, VoiceOver, and TalkBack',
      examples: ['JAWS', 'NVDA', 'VoiceOver', 'TalkBack', 'Narrator']
    },
    {
      name: 'Voice Control',
      description: 'Support for voice navigation and commands',
      examples: ['Dragon NaturallySpeaking', 'Voice Control (iOS)', 'Voice Access (Android)']
    },
    {
      name: 'Switch Control',
      description: 'Alternative input methods for users with motor impairments',
      examples: ['Switch Control (iOS)', 'Switch Access (Android)', 'External switches']
    },
    {
      name: 'Magnification',
      description: 'Built-in browser zoom and magnification tools',
      examples: ['Browser zoom', 'Windows Magnifier', 'macOS Zoom', 'Mobile pinch-to-zoom']
    }
  ];

  const accessibilityTools = [
    {
      name: 'High Contrast Mode',
      description: 'Toggle high contrast colors for better visibility',
      location: 'Settings > Appearance > High Contrast'
    },
    {
      name: 'Font Size Adjustment',
      description: 'Increase or decrease text size throughout the site',
      location: 'Settings > Accessibility > Font Size'
    },
    {
      name: 'Keyboard Shortcuts',
      description: 'Navigate the site using only your keyboard',
      location: 'Help > Keyboard Shortcuts'
    },
    {
      name: 'Screen Reader Mode',
      description: 'Optimized layout for screen reader users',
      location: 'Settings > Accessibility > Screen Reader Mode'
    }
  ];

  return (
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
              <Accessibility sx={{ fontSize: 50, color: getPrimaryColor(), mb: 2 }} />
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Accessibility
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Making Picklefy accessible to everyone
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                We are committed to ensuring that Picklefy is accessible to users of all abilities. Our platform is designed to work with assistive technologies and provide an inclusive experience for everyone.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

      {/* Commitment Statement */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={600}>
        <Fade in={true} timeout={800}>
          <Paper elevation={24} sx={{ mb: 6, p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Accessibility sx={{ fontSize: 48, color: getPrimaryColor(), mr: 2 }} />
          <Typography variant="h4" fontWeight="bold">
            Our Accessibility Commitment
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          At Picklefy, we believe that digital accessibility is not just a legal requirement, 
          but a fundamental human right. We are committed to creating an inclusive experience 
          that allows everyone to enjoy pickleball, regardless of their abilities or disabilities.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We continuously work to improve our platform's accessibility and welcome feedback 
          from users with disabilities to help us make Picklefy better for everyone.
        </Typography>
          </Paper>
        </Fade>
      </Slide>

      {/* Accessibility Features */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" component="h2" textAlign="center" fontWeight="bold" gutterBottom>
          Accessibility Features
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
          Comprehensive accessibility support across all aspects of our platform
        </Typography>
        
        <Grid container spacing={4}>
          {accessibilityFeatures.map((category, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={700 + index * 150}>
                <Fade in={true} timeout={900 + index * 150}>
                  <Paper elevation={24} sx={{ p: 4, height: '100%', borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ mr: 2 }}>
                    {category.icon}
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    {category.category}
                  </Typography>
                </Box>
                
                <List sx={{ p: 0 }}>
                  {category.features.map((feature, featureIndex) => (
                    <ListItem key={featureIndex} sx={{ p: 0, mb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckCircle sx={{ fontSize: 20, color: '#4CAF50' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body1">
                            {feature}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                  </Paper>
                </Fade>
              </Slide>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Compliance Standards */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1200}>
        <Fade in={true} timeout={1400}>
          <Paper elevation={24} sx={{ mb: 6, p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Accessibility Compliance
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          We strive to meet and exceed international accessibility standards to ensure 
          our platform is accessible to users worldwide.
        </Typography>
        
        <Grid container spacing={3}>
          {complianceStandards.map((standard, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper elevation={24} sx={{ p: 3, borderRadius: '20px', backdropFilter: 'blur(10px)', border: `1px solid ${muiTheme.palette.divider}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {standard.standard}
                  </Typography>
                  <Chip 
                    label={standard.status} 
                    color={standard.color} 
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {standard.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
          </Paper>
        </Fade>
      </Slide>

      {/* Assistive Technology Support */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1400}>
        <Fade in={true} timeout={1600}>
          <Paper elevation={24} sx={{ mb: 6, p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Assistive Technology Support
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Our platform is designed to work seamlessly with a wide range of assistive technologies 
          and accessibility tools.
        </Typography>
        
        <Grid container spacing={4}>
          {assistiveTechnologies.map((tech, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper elevation={24} sx={{ p: 3, borderRadius: '20px', backdropFilter: 'blur(10px)', border: `1px solid ${muiTheme.palette.divider}` }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {tech.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {tech.description}
                </Typography>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Compatible with:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tech.examples.map((example, exampleIndex) => (
                    <Chip 
                      key={exampleIndex}
                      label={example} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
          </Paper>
        </Fade>
      </Slide>

      {/* Accessibility Tools */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1600}>
        <Fade in={true} timeout={1800}>
          <Paper elevation={24} sx={{ mb: 6, p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Built-in Accessibility Tools
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Access these built-in accessibility features to customize your experience on Picklefy.
        </Typography>
        
        <Grid container spacing={3}>
          {accessibilityTools.map((tool, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper elevation={24} sx={{ p: 3, borderRadius: '20px', backdropFilter: 'blur(10px)', border: `1px solid ${muiTheme.palette.divider}` }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {tool.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {tool.description}
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  Location: {tool.location}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
          </Paper>
        </Fade>
      </Slide>

      {/* Keyboard Navigation */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1800}>
        <Fade in={true} timeout={2000}>
          <Paper elevation={24} sx={{ mb: 6, p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Keyboard sx={{ fontSize: 40, color: '#FF9800', mr: 2 }} />
          <Typography variant="h4" fontWeight="bold">
            Keyboard Navigation
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          Navigate Picklefy using only your keyboard. All interactive elements are accessible 
          via keyboard navigation.
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Navigation Keys
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Tab - Navigate between elements" />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Shift + Tab - Navigate backwards" />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Enter/Space - Activate buttons and links" />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Arrow keys - Navigate within components" />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Escape - Close dialogs and menus" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Skip Links
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Use these keyboard shortcuts to quickly navigate to important sections:
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Alt + 1 - Skip to main content" />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Alt + 2 - Skip to navigation" />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Alt + 3 - Skip to search" />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Alt + 4 - Skip to footer" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
          </Paper>
        </Fade>
      </Slide>

      {/* Feedback and Support */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={2000}>
        <Fade in={true} timeout={2200}>
          <Paper elevation={24} sx={{ p: 4, borderRadius: '24px', backdropFilter: 'blur(20px)', border: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Accessibility Feedback and Support
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          We value feedback from users with disabilities and are committed to continuously 
          improving our accessibility features.
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Report Accessibility Issues
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              If you encounter any accessibility barriers on our platform, please let us know. 
              We take all accessibility issues seriously and will work to resolve them promptly.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: accessibility@pickleball.com
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Request Accessibility Features
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Have suggestions for new accessibility features? We'd love to hear from you. 
              Your input helps us make Picklefy more inclusive for everyone.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contact: support@pickleball.com
            </Typography>
          </Grid>
        </Grid>
          </Paper>
        </Fade>
      </Slide>
    </Container>
  );
};

export default AccessibilityPage; 