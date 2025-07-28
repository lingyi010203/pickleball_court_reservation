# Chart.js Installation for Report Preview

To enable real-time chart previews in the report generator, you need to install the required dependencies.

## Installation

Run the following command in the `pickleball-frontend` directory:

```bash
npm install react-chartjs-2
```

## What this enables

After installation, the report preview will show:

✅ **Real-time charts** - Interactive charts using Chart.js
✅ **Multiple chart types** - Bar charts, line charts, pie charts
✅ **Brand colors** - Charts use your brand color scheme
✅ **Responsive design** - Charts adapt to different screen sizes
✅ **Interactive tooltips** - Hover over data points for details

## Features

- **Revenue Trend Charts** - Daily revenue visualization
- **Booking Trend Charts** - Daily booking patterns
- **Status Distribution** - Revenue and bookings by status
- **Top Performers** - Top revenue days, booking days, active users
- **Chart Type Switching** - Switch between bar, line, and pie charts in preview

## Without Installation

If you don't install the dependencies, the preview will show:
- Placeholder messages indicating charts would appear here
- Instructions to install the required package
- All other report functionality remains intact

## Troubleshooting

If charts don't appear after installation:

1. Restart your development server
2. Clear browser cache
3. Check browser console for errors
4. Ensure you're in the correct directory when running npm install 