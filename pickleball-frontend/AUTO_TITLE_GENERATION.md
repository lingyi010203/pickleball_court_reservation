# Auto-Generated Report Titles

## Overview

The report generator now automatically creates professional report titles based on your selections, eliminating the need for manual title input.

## How It Works

### Automatic Title Generation
The system automatically generates titles based on:
- **Report Type**: Revenue Report, Booking Analytics, User Activity Report
- **Date Range**: Selected start and end dates
- **Format**: Professional and consistent naming

### Title Format Examples

#### With Date Range
```
Revenue Report - Jul 1 to Jul 29, 2025
Booking Analytics - Jan 15 to Jan 31, 2025
User Activity Report - Mar 1 to Mar 31, 2025
```

#### Without Date Range (All Time)
```
Revenue Report - All Time
Booking Analytics - All Time
User Activity Report - All Time
```

## Implementation Details

### Title Generation Logic
```javascript
const generateReportTitle = () => {
  const reportTypeLabel = REPORT_CONFIG.types.find(t => t.value === reportType)?.label || 'Report';
  
  if (dateRange.start && dateRange.end) {
    const startDate = new Date(dateRange.start).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endDate = new Date(dateRange.end).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    return `${reportTypeLabel} - ${startDate} to ${endDate}`;
  } else {
    return `${reportTypeLabel} - All Time`;
  }
};
```

### Auto-Update Trigger
```javascript
useEffect(() => {
  const autoTitle = generateReportTitle();
  setReportTitle(autoTitle);
}, [reportType, dateRange.start, dateRange.end]);
```

## UI Changes

### Before (Manual Input)
- Text field for manual title entry
- User had to type title manually
- Risk of typos and inconsistencies

### After (Auto-Generated)
- Display box showing auto-generated title
- Professional appearance with brand colors
- Clear indication that title updates automatically
- No manual input required

### Visual Design
```jsx
<Box sx={{ 
  p: 2, 
  bgcolor: 'grey.50', 
  borderRadius: 1, 
  border: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
  <Box>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      Auto-Generated Report Title
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#667eea' }}>
      {reportTitle}
    </Typography>
  </Box>
  <Typography variant="caption" color="text.secondary">
    Updates automatically based on your selections
  </Typography>
</Box>
```

## Benefits

### ✅ **Consistency**
- All reports follow the same naming convention
- Professional and standardized titles
- No variations due to manual input

### ✅ **Efficiency**
- No time spent typing titles
- Automatic updates when selections change
- Reduced user effort

### ✅ **Professional Appearance**
- Clean, consistent titles
- Brand colors and styling
- Clear visual hierarchy

### ✅ **User Experience**
- Intuitive and user-friendly
- Clear indication of auto-generation
- Real-time updates

## Usage Examples

### 1. Revenue Report with Date Range
**Selections:**
- Report Type: Revenue Report
- Date Range: July 1, 2025 - July 29, 2025

**Generated Title:**
```
Revenue Report - Jul 1 to Jul 29, 2025
```

### 2. Booking Analytics (All Time)
**Selections:**
- Report Type: Booking Analytics
- Date Range: None selected

**Generated Title:**
```
Booking Analytics - All Time
```

### 3. User Activity Report with Custom Range
**Selections:**
- Report Type: User Activity Report
- Date Range: January 15, 2025 - January 31, 2025

**Generated Title:**
```
User Activity Report - Jan 15 to Jan 31, 2025
```

## Technical Features

### ✅ **Real-time Updates**
- Title updates immediately when selections change
- No manual refresh required
- Smooth user experience

### ✅ **Date Formatting**
- Consistent date format (MMM DD)
- Year included only in end date
- Clean and readable format

### ✅ **Fallback Handling**
- Handles missing date ranges gracefully
- Default to "All Time" when no dates selected
- Robust error handling

### ✅ **Internationalization Ready**
- Uses `toLocaleDateString` for proper formatting
- Supports different locale formats
- Easy to extend for other languages

## Future Enhancements

- [ ] Custom title templates
- [ ] User-defined title patterns
- [ ] Company-specific naming conventions
- [ ] Multi-language support
- [ ] Title customization options
- [ ] Save custom title preferences 