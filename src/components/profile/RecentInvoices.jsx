import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Divider 
} from '@mui/material';
import { Receipt } from '@mui/icons-material';

const RecentInvoices = () => {
  // Placeholder data - replace with actual data from backend
  const invoices = [];
  
  return (
    <Card sx={{ 
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      height: 'auto%',
      border: '1px solid #e0e0e0',
      backgroundColor: 'white',
      p: 2
    }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1 
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            My Invoices
          </Typography>
          <Button 
            size="small" 
            sx={{ 
              color: '#8e44ad', 
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '0.875rem'
            }}
          >
            See all
          </Button>
        </Box>
        
        {invoices.length > 0 ? (
          <Box>
            {/* Render invoice items */}
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 200,
            p: 3
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              textAlign: 'center',
              mb: 1
            }}>
              RM0
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              textAlign: 'center',
              mb: 3
            }}>
              spent on sports this year
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" sx={{ 
              fontWeight: 500,
              textAlign: 'center',
              mb: 2
            }}>
              Claim up to RM1,000 in tax relief while staying active and healthy!
            </Typography>
            
            <Button 
              variant="text"
              sx={{
                color: '#8e44ad',
                fontWeight: 'bold',
                textTransform: 'none',
                alignSelf: 'center',
                '&:hover': { backgroundColor: 'transparent' }
              }}
            >
              See last year's amount →
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentInvoices;