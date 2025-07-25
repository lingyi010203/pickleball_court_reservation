import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  AccountBalance as WalletIcon,
  TrendingUp as DepositIcon,
  TrendingDown as WithdrawalIcon,
  Lock as FrozenIcon,
  Refresh as RefundIcon
} from '@mui/icons-material';
import { getWalletTransactions, getWalletDetails } from '../../service/WalletService';

const WalletTransactionHistory = () => {
  const theme = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [walletDetails, setWalletDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch wallet details and transactions in parallel
      const [detailsResponse, transactionsResponse] = await Promise.all([
        getWalletDetails(),
        getWalletTransactions(page, 10)
      ]);

      setWalletDetails(detailsResponse);
      setTransactions(transactionsResponse.transactions || []);
      setTotalPages(transactionsResponse.totalPages || 0);
      setTotalElements(transactionsResponse.totalElements || 0);

    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
      setError(err.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return <DepositIcon color="success" />;
      case 'WITHDRAWAL':
        return <WithdrawalIcon color="error" />;
      case 'FREEZE':
        return <FrozenIcon color="warning" />;
      case 'UNFREEZE':
        return <FrozenIcon color="info" />;
      case 'REFUND':
        return <RefundIcon color="primary" />;
      default:
        return <WalletIcon />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'DEPOSIT':
      case 'REFUND':
        return 'success';
      case 'WITHDRAWAL':
        return 'error';
      case 'FREEZE':
        return 'warning';
      case 'UNFREEZE':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatAmount = (amount) => {
    return `RM${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage - 1); // Convert to 0-based index
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Wallet Transaction History
      </Typography>

      {/* Wallet Summary Cards */}
      {walletDetails && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
              color: 'white'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Balance
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  RM{walletDetails.availableBalance?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
              color: 'white'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Frozen Balance
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  RM{walletDetails.frozenBalance?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
              color: 'white'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Deposited
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  RM{walletDetails.totalDeposited?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f44336, #ef5350)',
              color: 'white'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Spent
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  RM{walletDetails.totalSpent?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Transactions Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Recent Transactions ({totalElements} total)
          </Typography>

          {transactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No transactions found
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Balance</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTransactionIcon(transaction.transactionType)}
                            <Typography variant="body2" fontWeight="medium">
                              {transaction.transactionType}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
                          >
                            {transaction.amount >= 0 ? '+' : ''}{formatAmount(transaction.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Before: RM{transaction.balanceBefore.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              After: RM{transaction.balanceAfter.toFixed(2)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {transaction.description || 'No description'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.status}
                            size="small"
                            color={transaction.status === 'COMPLETED' ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(transaction.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default WalletTransactionHistory; 