import Navbar from '../common/Navbar';
import FooterComponent from '../common/Footer';
import FloatingMessageButton from '../common/FloatingMessageButton';
import { Box, Container } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const MainLayout = () => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <>
      <Navbar />
      <Box sx={{ paddingTop: '150px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Container
          maxWidth={false}
          sx={{
            maxWidth: '1200px',
            width: '100%',
            flex: 1,
            px: { xs: 1, sm: 2, lg: 3 }
          }}
        >
          <Outlet />
        </Container>
      </Box>
      <FooterComponent />
      <FloatingMessageButton />
    </>
  );
};

export default MainLayout;