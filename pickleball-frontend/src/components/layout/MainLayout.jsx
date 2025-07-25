import Navbar from '../common/Navbar';
import FooterComponent from '../common/Footer';
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
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
    </>
  );
};

export default MainLayout;