import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  LinkedIn, 
  Email, 
  Phone, 
  LocationOn,
  SportsTennis 
} from '@mui/icons-material';
import { THEME } from '../../constants';

const Footer = () => {
  const socialLinks = [
    { icon: <Facebook />, href: '#', label: 'Facebook' },
    { icon: <Twitter />, href: '#', label: 'Twitter' },
    { icon: <Instagram />, href: '#', label: 'Instagram' },
    { icon: <LinkedIn />, href: '#', label: 'LinkedIn' }
  ];

  const quickLinks = [
    { text: 'Home', path: '/' },
    { text: 'Find Courts', path: '/courts' },
    { text: 'Tournaments', path: '/tournaments' },
    { text: 'Community', path: '/community' }
  ];

  const supportLinks = [
    { text: 'Help Center', path: '/help' },
    { text: 'About Us', path: '/about' },
    { text: 'Contact', path: '/contact' },
    { text: 'Privacy Policy', path: '/privacy' },
    { text: 'Terms of Service', path: '/terms' }
  ];

  return (
    <Box
      component="footer"
      sx={{
        background: `linear-gradient(135deg, ${THEME.colors.darkBg} 0%, #1a1a2e 100%)`,
        color: 'white',
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${THEME.colors.primary}, ${THEME.colors.secondary || '#ff6b6b'})`,
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
                  <SportsTennis 
                    sx={{ 
                      fontSize: 32, 
                      color: THEME.colors.primary, 
                      mr: 1 
                    }} 
                  />
                  <Typography 
                    variant="h5" 
                    component="h2"
                    sx={{ 
                      fontWeight: 'bold',
                      background: `linear-gradient(45deg, ${THEME.colors.primary}, white)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Picklefy
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: THEME.colors.lightText || '#b0b0b0',
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
                        color: THEME.colors.lightText || '#b0b0b0',
                        border: `1px solid ${THEME.colors.lightText || '#b0b0b0'}`,
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          color: THEME.colors.primary,
                          borderColor: THEME.colors.primary,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${THEME.colors.primary}30`
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
                      color: 'white',
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
                          color: THEME.colors.lightText || '#b0b0b0',
                          textDecoration: 'none',
                          py: 0.5,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            color: THEME.colors.primary,
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
                      color: 'white',
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
                          color: THEME.colors.lightText || '#b0b0b0',
                          textDecoration: 'none',
                          py: 0.5,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            color: THEME.colors.primary,
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
                      color: 'white',
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
                          backgroundColor: `${THEME.colors.primary}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Email sx={{ color: THEME.colors.primary, fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: THEME.colors.lightText || '#b0b0b0' }}>
                          Email Us
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'white' }}>
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
                          backgroundColor: `${THEME.colors.primary}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Phone sx={{ color: THEME.colors.primary, fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: THEME.colors.lightText || '#b0b0b0' }}>
                          Call Us
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'white' }}>
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
                          backgroundColor: `${THEME.colors.primary}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <LocationOn sx={{ color: THEME.colors.primary, fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: THEME.colors.lightText || '#b0b0b0' }}>
                          Visit Us
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'white' }}>
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
        <Divider sx={{ borderColor: `${THEME.colors.primary}30` }} />
        
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
              color: THEME.colors.lightText || '#b0b0b0',
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
            <Link
              component={RouterLink}
              to="/sitemap"
              sx={{
                color: THEME.colors.lightText || '#b0b0b0',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                '&:hover': { color: THEME.colors.primary }
              }}
            >
              Sitemap
            </Link>
            <Link
              component={RouterLink}
              to="/cookies"
              sx={{
                color: THEME.colors.lightText || '#b0b0b0',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                '&:hover': { color: THEME.colors.primary }
              }}
            >
              Cookies Policy
            </Link>
            <Link
              component={RouterLink}
              to="/accessibility"
              sx={{
                color: THEME.colors.lightText || '#b0b0b0',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                '&:hover': { color: THEME.colors.primary }
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