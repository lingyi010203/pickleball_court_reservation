# Header & Footer Features

## Overview

The report generator now includes professional header and footer functionality that can be toggled on/off using the "Header & Footer" formatting option.

## Company Information

### Default Company: Picklefy
- **Name**: Picklefy
- **Address**: Professional Picklefy Court Management
- **Phone**: +60 12-345 6789
- **Email**: info@picklefy.com
- **Website**: www.picklefy.com

## Header Features

### ✅ **Professional Header**
- **Company Logo/Name**: Large, bold company name in brand color (#667eea)
- **Company Address**: Professional business description
- **Contact Information**: Phone and email details
- **Generation Date**: Automatic timestamp with date and time
- **Brand Styling**: Blue border separator

### 📋 **Header Content**
```
Picklefy
Professional Picklefy Court Management
Phone: +60 12-345 6789 | Email: info@picklefy.com

Generated: January 28, 2025, 02:30 PM
```

### 🎨 **Header Styling**
- **Border**: 2px solid #667eea (brand color)
- **Layout**: Flexbox with space-between alignment
- **Typography**: H4 for company name, body2 for details
- **Colors**: Brand blue for company name, secondary for details

## Footer Features

### ✅ **Professional Footer**
- **Copyright**: Current year and company name
- **Website**: Company website link
- **Page Numbering**: "Page 1 of 1" (expandable for multi-page)
- **Report ID**: Unique identifier for each report
- **Brand Styling**: Blue border separator

### 📋 **Footer Content**
```
© 2025 Picklefy. All rights reserved.
www.picklefy.com

Page 1 of 1
Report ID: REVENUE-123456
```

### 🎨 **Footer Styling**
- **Border**: 2px solid #667eea (brand color)
- **Position**: Absolute positioning at bottom
- **Layout**: Flexbox with space-between alignment
- **Typography**: Body2 for all text
- **Colors**: Secondary text color for subtle appearance

## Configuration

### Toggle Option
```javascript
formattingOptions: [
  { 
    name: 'includeHeaderFooter', 
    label: 'Header & Footer', 
    description: 'Include company header and page numbers' 
  }
]
```

### Default State
- **Enabled**: `includeHeaderFooter: true`
- **User Control**: Can be toggled on/off in formatting options

## Implementation Details

### Frontend Display
- **Conditional Rendering**: Only shows when `includeHeaderFooter` is true
- **Responsive Design**: Adapts to different screen sizes
- **A4 Compatibility**: Optimized for A4 paper dimensions

### PDF Export
- **Canvas Capture**: Header and footer included in html2canvas capture
- **Style Preservation**: CSS styles maintained during PDF generation
- **Multi-page Support**: Footer can be extended for multiple pages

### Data Attributes
- **Header**: `data-header` attribute for PDF export identification
- **Footer**: `data-footer` attribute for PDF export identification
- **Content**: `data-preview-content` for main content area

## Usage Examples

### 1. Enable Header & Footer
1. Go to Report Generator
2. Check "Header & Footer" in formatting options
3. Preview report shows professional header and footer
4. Export to PDF includes header and footer

### 2. Disable Header & Footer
1. Uncheck "Header & Footer" in formatting options
2. Preview shows clean report without header/footer
3. Export to PDF without header and footer

### 3. Custom Company Info
```javascript
companyInfo={{ 
  name: 'Your Company',
  address: 'Your Address',
  phone: 'Your Phone',
  email: 'your@email.com',
  website: 'www.yourcompany.com'
}}
```

## Technical Features

### ✅ **Dynamic Content**
- **Company Name**: Uses `companyInfo.name` or defaults to "Picklefy"
- **Contact Info**: Uses `companyInfo` properties or defaults
- **Generation Date**: Automatic current date/time
- **Report ID**: Dynamic based on report type and timestamp

### ✅ **Responsive Design**
- **Screen Display**: Adapts to different screen sizes
- **Print Layout**: Optimized for A4 paper
- **PDF Export**: Maintains layout in exported PDF

### ✅ **Brand Consistency**
- **Colors**: Uses brand color (#667eea) for borders and company name
- **Typography**: Consistent with overall design system
- **Spacing**: Professional margins and padding

## Future Enhancements

- [ ] Company logo support
- [ ] Custom header/footer templates
- [ ] Multi-page page numbering
- [ ] Watermark support
- [ ] Digital signature integration
- [ ] Custom branding options
- [ ] Header/footer customization panel 