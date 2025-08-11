import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  TableSortLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axiosConfig';

const AdminManageVenues = () => {
  const theme = useTheme();
  const { t } = useLanguage();

  // State management
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [currentVenue, setCurrentVenue] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, venueId: null });
  const [deleting, setDeleting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    state: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Pagination and sorting
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalVenues, setTotalVenues] = useState(0);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    courtCountRange: 'all',
    state: 'all'
  });



  // Statistics data
  const [stats, setStats] = useState({
    totalVenues: 0,
    venuesWithCourts: 0,
    totalCourts: 0,
    averageCourtsPerVenue: 0
  });

  // Fetch venues
  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/venues');
      setVenues(response.data);
      setTotalVenues(response.data.length);
    } catch (err) {
      let errorMsg = 'Failed to fetch venues';
      if (err.response?.data) {
        errorMsg = typeof err.response.data === 'string'
          ? err.response.data
          : err.response.data.message || errorMsg;
      }
      setError(errorMsg);
      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: 'error'
      });
      console.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load venues on component mount
  useEffect(() => {
    fetchVenues();
  }, []);

  // Calculate statistics when venues change
  useEffect(() => {
    if (venues.length > 0) {
      const totalVenues = venues.length;
      const venuesWithCourts = venues.filter(venue => (venue.courtCount || 0) > 0).length;
      const totalCourts = venues.reduce((sum, venue) => sum + (venue.courtCount || 0), 0);
      const averageCourtsPerVenue = totalVenues > 0 ? (totalCourts / totalVenues).toFixed(1) : 0;

      setStats({
        totalVenues,
        venuesWithCourts,
        totalCourts,
        averageCourtsPerVenue
      });
    }
  }, [venues]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = t('admin.venueNameRequired');
    if (!formData.address.trim()) errors.address = t('admin.addressRequired');
    if (!formData.state.trim()) errors.state = t('admin.stateRequired');
    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        state: formData.state.trim(),
        description: formData.description.trim() || null
      };

      if (currentVenue) {
        await api.put(`/admin/venues/${currentVenue.id}`, payload);
        setSnackbar({
          open: true,
          message: t('admin.venueUpdatedSuccessfully'),
          severity: 'success'
        });
      } else {
        await api.post('/admin/venues', payload);
        setSnackbar({
          open: true,
          message: t('admin.venueCreatedSuccessfully'),
          severity: 'success'
        });
      }

      fetchVenues();
      handleCloseDialog();
    } catch (err) {
      let errorMsg = t('admin.operationFailed');
      if (err.response?.data) {
        errorMsg = typeof err.response.data === 'string'
          ? err.response.data
          : err.response.data.message || t('admin.operationFailed');
      }

      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (venueId) => {
    try {
      setDeleting(true);
      await api.delete(`/admin/venues/${venueId}`);
              setSnackbar({
          open: true,
          message: t('admin.venueDeletedSuccessfully'),
          severity: 'success'
        });
      fetchVenues();
    } catch (err) {
      let errorMsg = t('admin.deletionFailed');
      if (err.response?.data) {
        errorMsg = typeof err.response.data === 'string'
          ? err.response.data
          : err.response.data.message || t('admin.deletionFailed');
      }
      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: 'error'
      });
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, venueId: null });
    }
  };

  // Dialog handlers
  const handleOpenDialog = (venue = null) => {
    if (venue) {
      setCurrentVenue(venue);
      setFormData({
        name: venue.name || '',
        address: venue.location || venue.address || '',
        state: venue.state || '',
        description: venue.description || ''
      });
    } else {
      setCurrentVenue(null);
      setFormData({
        name: '',
        address: '',
        state: '',
        description: ''
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentVenue(null);
    setFormData({
      name: '',
      address: '',
      state: '',
      description: ''
    });
    setFormErrors({});
  };

  const handleDeleteClick = (venueId) => {
    setDeleteDialog({ open: true, venueId });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.venueId) {
      await handleDelete(deleteDialog.venueId);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, venueId: null });
  };

  // Form change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field changes
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };



  // Sort handler
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Search handler
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter handlers
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      courtCountRange: 'all',
      state: 'all'
    });
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.courtCountRange !== 'all') count++;
    if (filters.state !== 'all') count++;
    if (searchTerm.trim()) count++;
    return count;
  };

  // Filter and sort venues
  const filteredVenues = venues
    .filter(venue => {
      // Search filter
      const matchesSearch = !searchTerm ||
        venue.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Court count range filter
      const courtCount = venue.courtCount || 0;
      let matchesCourtCount = true;
      switch (filters.courtCountRange) {
        case '0':
          matchesCourtCount = courtCount === 0;
          break;
        case '1-3':
          matchesCourtCount = courtCount >= 1 && courtCount <= 3;
          break;
        case '4-6':
          matchesCourtCount = courtCount >= 4 && courtCount <= 6;
          break;
        case '7+':
          matchesCourtCount = courtCount >= 7;
          break;
        default:
          matchesCourtCount = true;
      }

      // State filter
      const matchesState = filters.state === 'all' ||
        venue.state?.toLowerCase().includes(filters.state.toLowerCase());

      return matchesSearch && matchesCourtCount && matchesState;
    })
    .sort((a, b) => {
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';

      if (order === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const paginatedVenues = filteredVenues.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };







  if (loading && venues.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {t('admin.venueManagement')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 1.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          {t('admin.addNewVenue')}
        </Button>
      </Box>

      {/* Statistics Dashboard */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3
      }}>
        {/* Total Venues */}
        <Paper sx={{
          p: 3,
          textAlign: 'center',
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
            {stats.totalVenues}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.totalVenues')}
          </Typography>
        </Paper>

        {/* Venues with Courts */}
        <Paper sx={{
          p: 3,
          textAlign: 'center',
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
            {stats.venuesWithCourts}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.venuesWithCourts')}
          </Typography>
        </Paper>

        {/* Total Courts */}
        <Paper sx={{
          p: 3,
          textAlign: 'center',
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
            {stats.totalCourts}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.totalCourts')}
          </Typography>
        </Paper>

        {/* Average Courts per Venue */}
        <Paper sx={{
          p: 3,
          textAlign: 'center',
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
            {stats.averageCourtsPerVenue}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.averageCourtsPerVenue')}
          </Typography>
        </Paper>


      </Box>

      {/* Search and Actions Bar */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title={t('admin.searchByVenueInfo')} arrow>
            <TextField
              placeholder={t('admin.search')}
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: searchTerm && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    sx={{ mr: 1 }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>✕</Typography>
                  </IconButton>
                )
              }}
              sx={{ minWidth: 200 }}
            />
          </Tooltip>

          {/* Court Count Range Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('admin.courtCount')}</InputLabel>
            <Select
              value={filters.courtCountRange}
              onChange={(e) => handleFilterChange('courtCountRange', e.target.value)}
              label={t('admin.courtCount')}
            >
              <MenuItem value="all">{t('admin.allRanges')}</MenuItem>
              <MenuItem value="0">{t('admin.zeroCourts')}</MenuItem>
              <MenuItem value="1-3">{t('admin.oneToThreeCourts')}</MenuItem>
              <MenuItem value="4-6">{t('admin.fourToSixCourts')}</MenuItem>
              <MenuItem value="7+">{t('admin.sevenPlusCourts')}</MenuItem>
            </Select>
          </FormControl>

          {/* State Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('admin.state')}</InputLabel>
            <Select
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              label={t('admin.state')}
            >
              <MenuItem value="all">{t('admin.allStates')}</MenuItem>
              <MenuItem value="johor">Johor</MenuItem>
              <MenuItem value="kedah">Kedah</MenuItem>
              <MenuItem value="kelantan">Kelantan</MenuItem>
              <MenuItem value="melaka">Melaka</MenuItem>
              <MenuItem value="negeri sembilan">Negeri Sembilan</MenuItem>
              <MenuItem value="pahang">Pahang</MenuItem>
              <MenuItem value="perak">Perak</MenuItem>
              <MenuItem value="perlis">Perlis</MenuItem>
              <MenuItem value="pulau pinang">Pulau Pinang</MenuItem>
              <MenuItem value="sabah">Sabah</MenuItem>
              <MenuItem value="sarawak">Sarawak</MenuItem>
              <MenuItem value="selangor">Selangor</MenuItem>
              <MenuItem value="terengganu">Terengganu</MenuItem>
              <MenuItem value="kuala lumpur">Kuala Lumpur</MenuItem>
              <MenuItem value="labuan">Labuan</MenuItem>
              <MenuItem value="putrajaya">Putrajaya</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={clearAllFilters}
            sx={{
              borderRadius: '8px',
              px: 2,
              py: 1,
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }
            }}
          >
            {t('admin.clear')}
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchVenues}
            disabled={loading}
            sx={{
              ml: 'auto',
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              minWidth: 120,
              '&:hover': { borderColor: theme.palette.primary.dark }
            }}
          >
            {loading ? t('admin.refreshing') : t('admin.refresh')}
          </Button>
        </Box>
      </Paper>



      {/* Venues Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  {t('admin.venueName')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'location'}
                  direction={orderBy === 'location' ? order : 'asc'}
                  onClick={() => handleSort('location')}
                >
                  {t('admin.address')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'state'}
                  direction={orderBy === 'state' ? order : 'asc'}
                  onClick={() => handleSort('state')}
                >
                  {t('admin.state')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.description')}</TableCell>

              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.courtsCount')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedVenues.length > 0 ? paginatedVenues.map((venue) => (
              <TableRow key={venue.id} hover>
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {venue.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {venue.location || venue.address || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {venue.state || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {venue.description || t('admin.noDescription')}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: (venue.courtCount || 0) > 0 ? theme.palette.success.main : theme.palette.grey[300],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }
                      }}
                    >
                      {venue.courtCount || 0}
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {venue.courtCount === 1 ? t('admin.court') : t('admin.courts')}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={t('admin.edit')}>
                      <IconButton onClick={() => handleOpenDialog(venue)}>
                        <EditIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={
                      venue.courtCount && venue.courtCount > 0
                        ? t('admin.cannotDeleteVenueWithCourts', { count: venue.courtCount })
                        : t('admin.delete')
                    }>
                      <span>
                        <IconButton
                          onClick={() => handleDeleteClick(venue.id)}
                          disabled={deleting || (venue.courtCount && venue.courtCount > 0)}
                          sx={{
                            '&:disabled': {
                              opacity: 0.5,
                              cursor: 'not-allowed'
                            }
                          }}
                        >
                          <DeleteIcon
                            color={venue.courtCount && venue.courtCount > 0 ? "disabled" : "error"}
                          />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    {t('admin.noVenuesFound')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                colSpan={6}
                count={filteredVenues.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* Add/Edit Venue Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }
        }}
      >
        {/* Background Mascot with Low Opacity */}
        <Box
          component="img"
          src={`${process.env.PUBLIC_URL}/mascot_lowopacity1.png`}
          alt="Background Mascot"
          sx={{
            position: 'absolute',
            top: '10%',
            right: '-5px',
            width: '400px',
            height: 'auto',
            opacity: 0.15,
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />

        <DialogTitle sx={{
          textAlign: 'center',
          pb: 1,
          position: 'relative',
          zIndex: 1
        }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 1
            }}>
              {currentVenue ? t('admin.editVenue') : t('admin.addNewVenue')}
            </Typography>
            <Typography variant="body2" sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500
            }}>
              {currentVenue ? t('admin.updateVenueDescription') : t('admin.addNewVenueDescription')}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{
              color: theme.palette.text.secondary,
              fontWeight: 600,
              display: 'block',
              mb: 2
            }}>
              * {t('admin.required')}
            </Typography>
          </Box>

          {/* Basic Information Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{
              fontWeight: 600,
              color: theme.palette.primary.main,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{
                width: 8,
                height: 8,
                backgroundColor: theme.palette.primary.main,
                borderRadius: '50%'
              }} />
              {t('admin.basicInformation')}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.venueName')} *
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={t('admin.enterVenueName')}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.address')} *
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={t('admin.enterVenueAddress')}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={!!formErrors.address}
                    helperText={formErrors.address}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.state')} *
                  </Typography>
                  <FormControl fullWidth error={!!formErrors.state}>
                    <Select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      sx={{
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>{t('admin.selectState')}</em>
                      </MenuItem>
                      <MenuItem value="Johor">Johor</MenuItem>
                      <MenuItem value="Kedah">Kedah</MenuItem>
                      <MenuItem value="Kelantan">Kelantan</MenuItem>
                      <MenuItem value="Melaka">Melaka</MenuItem>
                      <MenuItem value="Negeri Sembilan">Negeri Sembilan</MenuItem>
                      <MenuItem value="Pahang">Pahang</MenuItem>
                      <MenuItem value="Perak">Perak</MenuItem>
                      <MenuItem value="Perlis">Perlis</MenuItem>
                      <MenuItem value="Pulau Pinang">Pulau Pinang</MenuItem>
                      <MenuItem value="Sabah">Sabah</MenuItem>
                      <MenuItem value="Sarawak">Sarawak</MenuItem>
                      <MenuItem value="Selangor">Selangor</MenuItem>
                      <MenuItem value="Terengganu">Terengganu</MenuItem>
                      <MenuItem value="Kuala Lumpur">Kuala Lumpur</MenuItem>
                      <MenuItem value="Labuan">Labuan</MenuItem>
                      <MenuItem value="Putrajaya">Putrajaya</MenuItem>
                    </Select>
                    {formErrors.state && (
                      <FormHelperText>{formErrors.state}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    mb: 1,
                    display: 'block'
                  }}>
                    {t('admin.description')}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder={t('admin.enterDescription')}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#f9fafb',
                        '&:focus-within': {
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 4, pt: 2, gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              border: '2px solid',
              borderColor: theme.palette.grey[300],
              color: theme.palette.text.primary,
              fontWeight: 600,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.main + '10'
              }
            }}
          >
            {t('admin.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              currentVenue ? t('admin.update') : t('admin.create')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            background: 'white',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          backgroundColor: theme.palette.error.main,
          color: 'white',
          p: 4,
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{
            fontWeight: 600,
            mb: 1,
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}>
            {t('admin.delete')} {t('admin.venueName')}
          </Typography>
          <Typography variant="body1" sx={{
            opacity: 0.9,
            fontWeight: 500,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            {venues.find(v => v.id === deleteDialog.venueId)?.name}
          </Typography>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {(() => {
            const venueToDelete = venues.find(v => v.id === deleteDialog.venueId);

            if (venueToDelete && venueToDelete.courtCount && venueToDelete.courtCount > 0) {
              return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: theme.palette.text.primary
                  }}>
                    {t('admin.cannotDeleteVenueHasCourts')}
                  </Typography>
                  <Typography variant="body1" sx={{
                    color: theme.palette.text.primary,
                    mb: 2
                  }}>
                    <strong>{venueToDelete.name}</strong> has <strong>{venueToDelete.courtCount} court(s)</strong> that must be removed first.
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: theme.palette.text.secondary,
                    mb: 1
                  }}>
                    To delete this venue:
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: theme.palette.text.secondary
                  }}>
                    • Go to "Admin Manage Courts" to delete or transfer the courts
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: theme.palette.text.secondary
                  }}>
                    • Only venues with 0 courts can be deleted
                  </Typography>
                </Box>
              );
            }
            return (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" sx={{
                  color: theme.palette.text.primary,
                  mb: 2,
                  fontSize: '1.1rem'
                }}>
                  {t('admin.confirmDeleteVenue')}
                </Typography>
                <Typography variant="body2" sx={{
                  color: theme.palette.text.secondary,
                  lineHeight: 1.5
                }}>
                  {t('admin.deleteVenueWarning')}
                </Typography>
              </Box>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={deleting}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: theme.palette.grey[300],
              color: theme.palette.text.primary,
              fontWeight: 500,
              minWidth: 100,
              backgroundColor: 'white',
              '&:hover': {
                backgroundColor: theme.palette.grey[50],
                borderColor: theme.palette.grey[400]
              }
            }}
          >
            {t('admin.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleting}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: '8px',
              fontWeight: 500,
              backgroundColor: theme.palette.error.main,
              minWidth: 100,
              '&:hover': {
                backgroundColor: theme.palette.error.dark
              }
            }}
          >
            {deleting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('admin.delete')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminManageVenues;
