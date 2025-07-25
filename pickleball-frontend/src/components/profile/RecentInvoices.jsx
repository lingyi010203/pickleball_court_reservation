import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Divider,
  useTheme
} from '@mui/material';

const RecentInvoices = () => {
  const theme = useTheme();
  // Placeholder data - replace with actual data from backend
  const invoices = [];
  
  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexShrink: 0
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 'bold',
          fontSize: { xs: '1.1rem', lg: '1.25rem' }
        }}>
          My Invoices
        </Typography>
        <Button 
          size="small" 
          sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '0.85rem',
            minWidth: 'auto',
            px: 1
          }}
        >
          See all
        </Button>
      </Box>
      
      {/* Content */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {invoices.length > 0 ? (
          <Box sx={{ 
            flex: 1,
            overflowY: 'auto'
          }}>
            {/* Render invoice items */}
            {invoices.map((invoice, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {/* Invoice item content */}
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            flex: 1,
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            px: 2
          }}>
            <Typography variant="h3" sx={{ 
              fontWeight: 'bold', 
              textAlign: 'center',
              mb: 1,
              fontSize: { xs: '2rem', lg: '2.5rem' },
              color: theme.palette.text.primary
            }}>
              RM0
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              textAlign: 'center',
              mb: 3,
              fontSize: '0.9rem'
            }}>
              spent on sports this year
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" sx={{ 
              fontWeight: 500,
              textAlign: 'center',
              mb: 2,
              fontSize: '0.9rem',
              lineHeight: 1.4,
              color: theme.palette.text.primary
            }}>
              Claim up to RM1,000 in tax relief while staying active and healthy!
            </Typography>
            
            <Button 
              variant="text"
              size="small"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                textTransform: 'none',
                alignSelf: 'center',
                fontSize: '0.85rem',
                '&:hover': { 
                  backgroundColor: 'transparent',
                  textDecoration: 'underline'
                }
              }}
            >
              See last year's amount →
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RecentInvoices;