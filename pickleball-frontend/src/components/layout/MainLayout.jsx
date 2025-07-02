import Navbar from '../common/Navbar';
import FooterComponent from '../common/Footer';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Navbar />
      <Box flexGrow={1} p={2}>
        <Outlet /> {/* This renders the nested routes */}
      </Box>
      <FooterComponent />
    </Box>
  );
};

export default MainLayout;