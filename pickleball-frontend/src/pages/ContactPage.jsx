import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  useTheme as useMuiTheme,
  Fade,
  Slide,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import {
  Email,
  Phone,
  LocationOn,
  AccessTime,
  Send,
  CheckCircle,
  ExpandMore,
  Search
} from '@mui/icons-material';

const ContactPage = () => {
  const muiTheme = useMuiTheme();
  const { getPrimaryColor } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [faqQuery, setFaqQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const contactInfo = [
    {
      icon: 'email',
      title: 'Email Us',
      details: ['support@pickleball.com', 'info@pickleball.com'],
      description: 'We typically respond within 24 hours'
    },
    {
      icon: 'phone',
      title: 'Call Us',
      details: ['+60 12-345 6789', '+60 12-345 6790'],
      description: 'Monday - Friday, 9:00 AM - 6:00 PM'
    },
    {
      icon: 'location',
      title: 'Visit Us',
      details: ['123 Pickleball Street', 'Kuala Lumpur, Malaysia 50000'],
      description: 'Come say hello at our office'
    }
  ];

  const faqs = [
    {
      q: 'How do I book a court?',
      a: 'Simply browse available courts, select your preferred time slot, and complete the booking process. Payment can be made through our secure payment system.'
    },
    {
      q: 'What is your cancellation policy?',
      a: 'You can cancel your booking up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may incur a partial charge.'
    },
    {
      q: 'Do you provide equipment?',
      a: 'Most courts provide basic equipment, but we recommend bringing your own paddles and balls for the best experience. Equipment rental is available at select locations.'
    },
    {
      q: 'How can I join tournaments?',
      a: 'Tournament information and registration is available through our events section. You can browse upcoming tournaments and register directly through the platform.'
    },
    {
      q: 'Can I book multiple courts at once?',
      a: 'Yes, you can reserve multiple courts in a single booking, subject to availability. Simply add each court and time slot to your booking before checkout.'
    },
    {
      q: 'Do you offer memberships or packages?',
      a: 'Yes, we offer membership plans and prepaid court packages that provide discounted rates and exclusive booking privileges.'
    },
    {
      q: 'How far in advance can I book?',
      a: 'Courts can typically be booked up to 14 days in advance, although some locations may allow longer booking windows for members.'
    },
    {
      q: 'What happens if it rains?',
      a: 'For outdoor courts, bookings may be rescheduled or refunded in case of bad weather. Indoor court bookings are unaffected by weather conditions.'
    },
    {
      q: 'Can I transfer my booking to someone else?',
      a: 'Yes, you can transfer your booking to another player by updating the booking details in your account, as long as it’s done before the cancellation deadline.'
    },
    {
      q: 'Is there an age requirement to play?',
      a: 'Players of all ages are welcome. However, some tournaments and leagues may have specific age categories or requirements.'
    }
  ];

  // Function to render icons based on string identifier
  const renderIcon = (iconType, size = 40) => {
    switch (iconType) {
      case 'email':
        return <Email sx={{ fontSize: size, color: getPrimaryColor() }} />;
      case 'phone':
        return <Phone sx={{ fontSize: size, color: '#4CAF50' }} />;
      case 'location':
        return <LocationOn sx={{ fontSize: size, color: '#2196F3' }} />;
      default:
        return <Email sx={{ fontSize: size, color: getPrimaryColor() }} />;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to send message');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      // keep page background inherited (align with About/Privacy adjustments)
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
              <Email sx={{ fontSize: 50, color: getPrimaryColor(), mb: 2 }} />
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Contact Us
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                We'd love to hear from you
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
                Have a question, suggestion, or just want to say hello? We're here to help and would love to hear from you.
              </Typography>
            </Paper>
          </Fade>
        </Slide>

        {/* Success Message */}
        {submitted && (
          <Slide direction="down" in={submitted} mountOnEnter unmountOnExit>
            <Alert
              severity="success"
              icon={<CheckCircle />}
              sx={{ mb: 4, borderRadius: 2 }}
            >
              Thank you for your message! We'll get back to you as soon as possible.
            </Alert>
          </Slide>
        )}

        {/* Contact Form - Full Width */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={600}>
          <Fade in={true} timeout={800}>
            <Paper
              elevation={24}
              sx={{
                p: 4,
                mb: 6,
                borderRadius: '24px',
                // background removed
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Send us a Message
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Fill out the form below and we'll get back to you as soon as possible.
              </Typography>
              {submitError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{submitError}</Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={3} alignItems="flex-start">
                  {/* 第一行：Name + Email */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      required
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  {/* 第二行：Subject */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      error={!!errors.subject}
                      helperText={errors.subject}
                      required
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  {/* 第三行：Message */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      multiline
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      error={!!errors.message}
                      helperText={errors.message}
                      required
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  {/* 第四行：按钮（右对齐/居中） */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: { xs: 'center', sm: 'flex-end' }
                      }}
                    >
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<Send />}
                        sx={{
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          background: 'linear-gradient(45deg, #7C4DFF 0%, #651FFF 100%)',
                          fontWeight: 'bold',
                          textTransform: 'none',
                          fontSize: '1.1rem',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #6A5ACD 0%, #5E35B1 100%)'
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress color="inherit" size={20} />
                            Sending...
                          </Box>
                        ) : (
                          'Send Message'
                        )}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Fade>
        </Slide>

        {/* Contact Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Get in Touch
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Choose the most convenient way to reach us.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {contactInfo.map((info, index) => (
            <Grid item xs={12} key={index}>
              <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={700 + index * 150}>
                <Fade in={true} timeout={900 + index * 150}>
                  <Paper
                    elevation={24}
                    sx={{
                      p: 3,
                      borderRadius: '20px',
                      // background removed
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${muiTheme.palette.divider}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.15), 0 15px 15px -5px rgba(0, 0, 0, 0.08)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: '16px',
                          color: getPrimaryColor()
                        }}
                      >
                        {renderIcon(info.icon, 28)}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {info.title}
                        </Typography>
                        {info.details.map((detail, detailIndex) => (
                          <Typography
                            key={detailIndex}
                            variant="body1"
                            sx={{ mb: detailIndex === 0 ? 1 : 0 }}
                          >
                            {detail}
                          </Typography>
                        ))}
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {info.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Fade>
              </Slide>
            </Grid>
          ))}
        </Grid>

        {/* Business Hours */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1000}>
          <Fade in={true} timeout={1200}>
            <Paper
              elevation={24}
              sx={{
                mb: 8,
                p: 3,
                borderRadius: '20px',
                // background removed
                backdropFilter: 'blur(10px)',
                border: `1px solid ${muiTheme.palette.divider}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <AccessTime sx={{ fontSize: 40, color: '#FF9800', mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Business Hours
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Monday - Friday: 9:00 AM - 6:00 PM
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Saturday: 10:00 AM - 4:00 PM
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Sunday: Closed
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Emergency support available 24/7
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Fade>
        </Slide>

        {/* FAQ Section (styled like Privacy/About) */}
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={1200}>
          <Fade in={true} timeout={1400}>
            <Paper
              elevation={24}
              sx={{
                p: 5,
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${muiTheme.palette.divider}`
              }}
            >
              <Typography variant="h3" component="h2" textAlign="center" fontWeight="bold" gutterBottom>
                Frequently Asked Questions
              </Typography>
              <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
                Quick answers to common questions
              </Typography>

              {/* FAQ Search */}
              <Box sx={{ maxWidth: 720, mx: 'auto', mb: 3 }}>
                <TextField
                  fullWidth
                  value={faqQuery}
                  onChange={(e) => setFaqQuery(e.target.value)}
                  placeholder="Search FAQs (e.g. booking, cancel, equipment)"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              {/* FAQ List */}
              <Box sx={{ maxWidth: 960, mx: 'auto' }}>
                {faqs
                  .filter(f =>
                    !faqQuery.trim() ||
                    f.q.toLowerCase().includes(faqQuery.toLowerCase()) ||
                    f.a.toLowerCase().includes(faqQuery.toLowerCase())
                  )
                  .map((item, idx) => (
                    <Slide key={idx} direction="up" in={true} mountOnEnter unmountOnExit timeout={800 + idx * 120}>
                      <Fade in={true} timeout={900 + idx * 120}>
                        <Accordion
                          expanded={expandedFaq === idx}
                          onChange={(_, isExpanded) => setExpandedFaq(isExpanded ? idx : false)}
                          elevation={0}
                          sx={{
                            mb: 2,
                            borderRadius: '16px',
                            border: `1px solid ${muiTheme.palette.divider}`,
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {item.q}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              {item.a}
                            </Typography>
                          </AccordionDetails>
                        </Accordion>
                      </Fade>
                    </Slide>
                  ))}
              </Box>
            </Paper>
          </Fade>
        </Slide>
      </Container>
    </Box>
  );
};
export default ContactPage; 