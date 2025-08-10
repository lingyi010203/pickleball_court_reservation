import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton, Divider, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  LinkedIn, 
  Email, 
  Phone, 
  LocationOn
} from '@mui/icons-material';
import { THEME } from '../../constants';

const Footer = () => {
  const theme = useTheme();
  const socialLinks = [
    { icon: <Facebook />, href: 'https://facebook.com/picklefy', label: 'Facebook' },
    { icon: <Twitter />, href: 'https://twitter.com/picklefy', label: 'Twitter' },
    { icon: <Instagram />, href: 'https://instagram.com/picklefy', label: 'Instagram' },
    { icon: <LinkedIn />, href: 'https://linkedin.com/company/picklefy', label: 'LinkedIn' }
  ];

  const quickLinks = [
    { text: 'Home', path: '/' },
    { text: 'Find Courts', path: '/courts' },
    { text: 'Events', path: '/events' }
  ];

  const supportLinks = [
    { text: 'Help Center', path: '/helpdesk' },
    { text: 'About Us', path: '/about' },
    { text: 'Contact', path: '/contact' },
    { text: 'Privacy Policy', path: '/privacy' },
    { text: 'Terms of Service', path: '/terms' }
  ];

  return (
    <Box
      component="footer"
      sx={{
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 100%)`
          : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, #f8f9fa 100%)`,
        color: theme.palette.text.primary,
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        borderTop: `1px solid ${theme.palette.divider}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: '1200px', width: '100%', mx: 'auto', px: { xs: 1, sm: 2, lg: 3 } }}>
        {/* 主要内容区域 */}
        <Box sx={{ py: 6 }}>
          <Grid container spacing={4}>
            {/* 品牌信息 - 左侧 */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    component="img"
                    src={`${process.env.PUBLIC_URL}/web-name.png`}
                    alt="Brand"
                    sx={{
                      height: 40,
                      display: 'block'
                    }}
                  />
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 3,
                    lineHeight: 1.6
                  }}
                >
                  Your ultimate companion for pickleball excellence. <br/>
                  Connect, play, and grow with our vibrant community.
                </Typography>
                
                {/* 社交媒体图标 */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {socialLinks.map((social, index) => (
                    <IconButton
                      key={index}
                      href={social.href}
                      sx={{
                        color: theme.palette.text.secondary,
                        border: `1px solid ${theme.palette.text.secondary}`,
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          color: theme.palette.primary.main,
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${theme.palette.primary.main}30`
                        }
                      }}
                      aria-label={social.label}
                    >
                      {social.icon}
                    </IconButton>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* 右侧三个部分 */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={4}>
                {/* 快速链接 */}
                <Grid item xs={12} sm={4}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: theme.palette.text.primary,
                      fontWeight: 'bold'
                    }}
                  >
                    Quick Links
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {quickLinks.map((link, index) => (
                      <Link
                        key={index}
                        component={RouterLink}
                        to={link.path}
                        sx={{
                          color: theme.palette.text.secondary,
                          textDecoration: 'none',
                          py: 0.5,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            color: theme.palette.primary.main,
                            transform: 'translateX(5px)'
                          }
                        }}
                      >
                        {link.text}
                      </Link>
                    ))}
                  </Box>
                </Grid>

                {/* 支持链接 */}
                <Grid item xs={12} sm={4}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: theme.palette.text.primary,
                      fontWeight: 'bold'
                    }}
                  >
                    Support
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {supportLinks.map((link, index) => (
                      <Link
                        key={index}
                        component={RouterLink}
                        to={link.path}
                        sx={{
                          color: theme.palette.text.secondary,
                          textDecoration: 'none',
                          py: 0.5,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            color: theme.palette.primary.main,
                            transform: 'translateX(5px)'
                          }
                        }}
                      >
                        {link.text}
                      </Link>
                    ))}
                  </Box>
                </Grid>

                {/* 联系信息 */}
                <Grid item xs={12} sm={4}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: theme.palette.text.primary,
                      fontWeight: 'bold'
                    }}
                  >
                    Get In Touch
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                              <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: `${theme.palette.primary.main}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Email sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            Email Us
                          </Typography>
                          <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                            support@pickleball.com
                          </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: `${theme.palette.primary.main}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Phone sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Call Us
                        </Typography>
                        <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                          +60 12-345 6789
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: `${theme.palette.primary.main}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <LocationOn sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Visit Us
                        </Typography>
                        <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                          Kuala Lumpur, Malaysia
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        {/* 底部分隔线和版权信息 */}
        <Divider sx={{ borderColor: `${theme.palette.primary.main}30` }} />
        
        <Box 
          sx={{ 
            py: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            &copy; {new Date().getFullYear()} Picklefy. All rights reserved.
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 3,
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-end' }
            }}
          >
            {/* sitemap link removed */}
            <Link
              component={RouterLink}
              to="/cookies"
              sx={{
                color: theme.palette.text.secondary,
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                '&:hover': { color: theme.palette.primary.main }
              }}
            >
              Cookies Policy
            </Link>
            <Link
              component={RouterLink}
              to="/accessibility"
              sx={{
                color: theme.palette.text.secondary,
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                '&:hover': { color: theme.palette.primary.main }
              }}
            >
              Accessibility
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;