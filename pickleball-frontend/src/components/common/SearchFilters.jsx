import React from 'react';
import { Grid, TextField, Button, Select, MenuItem, FormControl, InputLabel, Chip, Box } from '@mui/material';
import { FilterList as FilterIcon, Search as SearchIcon } from '@mui/icons-material';

const SearchFilters = ({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  locationFilter,
  onLocationFilterChange,
  uniqueLocations = [],
  COURT_STATUS = {},
  showFilters,
  onToggleFilters,
  onResetFilters,
  filteredCount
}) => (
  <Box>
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search courts or venues..."
          value={searchTerm}
          onChange={onSearchTermChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
          }}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={onToggleFilters}
          sx={{ height: 56 }}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Grid>
      <Grid item xs={6} md={3}>
        <Chip
          label={`${filteredCount} courts found`}
          color="primary"
          sx={{ height: 56, borderRadius: 2, fontSize: '1rem', fontWeight: 700 }}
        />
      </Grid>
    </Grid>
    {showFilters && (
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={onStatusFilterChange}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value={COURT_STATUS.ACTIVE}>Active</MenuItem>
                <MenuItem value={COURT_STATUS.MAINTENANCE}>Maintenance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationFilter}
                onChange={onLocationFilterChange}
                label="Location"
              >
                <MenuItem value="all">All Locations</MenuItem>
                {uniqueLocations.map(location => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Button onClick={onResetFilters} sx={{ mt: 2 }}>
          Reset All Filters
        </Button>
      </Box>
    )}
  </Box>
);

export default SearchFilters; 