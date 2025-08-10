# Yearly Plan Components Documentation

## Overview

This document describes the yearly plan components created to display sales plan data with 12-month headers. The components are designed to work with your API endpoint `{{BASE_URL}}/api/yearly-plans/` and show only the `sales_plan` values in various table formats.

## Components Created

### 1. SalesPlanTable Component
**Location:** `src/components/SalesPlanTable.tsx`

A component that displays individual yearly plans with sales plan data only.

#### Features:
- Shows sales plan data for all 12 months
- Displays one card per yearly plan
- Month headers: Jan, Feb, Mar, etc.
- Clean, focused view showing only sales_plan values

#### Usage:
```tsx
import SalesPlanTable from "@/components/SalesPlanTable";

<SalesPlanTable 
  data={yearlyPlans} 
  getUserName={(userId) => `User ${userId}`} 
/>
```

### 2. ConsolidatedSalesPlanTable Component
**Location:** `src/components/ConsolidatedSalesPlanTable.tsx`

A component that consolidates multiple users' sales plans into a single table.

#### Features:
- Shows multiple users in one table
- 12-month headers (Jan-Dec)
- Total column for annual sales plan
- Summary row showing totals across all users
- Groups data by year

#### Usage:
```tsx
import ConsolidatedSalesPlanTable from "@/components/ConsolidatedSalesPlanTable";

<ConsolidatedSalesPlanTable 
  data={yearlyPlans}
  getUserName={getUserName}
  year={2025} // Optional: filter by specific year
/>
```

### 3. YearlyPlanDemo Component
**Location:** `src/components/YearlyPlanDemo.tsx`

A standalone demo component showing how to use your exact data structure.

#### Features:
- Uses the exact data structure you provided
- Two display modes: table view and grid view
- Shows annual total calculation
- Perfect for testing and demonstrations

### 4. YearlyPlanApiExample Component
**Location:** `src/components/YearlyPlanApiExample.tsx`

A comprehensive example showing API integration with dashboard features.

#### Features:
- Full dashboard layout with statistics
- API integration example
- Loading and error states
- Summary cards (Total Annual, Average Monthly, Plan Year)
- Multiple visualization styles
- Code example for API integration

## Enhanced Yearly Plans Page

The main yearly plans page (`src/core/pages/yearly-plans.tsx`) now includes three view modes:

### View Modes:
1. **Detailed View** - Original full table with all columns
2. **Sales Plan Only** - Uses SalesPlanTable component
3. **Consolidated View** - Uses ConsolidatedSalesPlanTable component

### Navigation:
- Toggle buttons to switch between views
- All existing functionality preserved
- Filters work across all view modes

## Data Structure

The components work with this data structure:

```typescript
interface YearlyPlanDetail {
  month: number;                    // 1-12
  sales_plan: string;              // "1000.00"
  clients_plan: string;            // "50.00"
  sales_count_plan: string;        // "200.00"
  sales: number;                   // 0
  clients: number;                 // 0
  sales_count: number;             // 0
  sales_percentage: number;        // 0.0
  clients_percentage: number;      // 0.0
  sales_count_percentage: number;  // 0.0
}

interface YearlyPlan {
  id?: number;                     // 4
  user: number;                    // 1
  year: number;                    // 2025
  details: YearlyPlanDetail[];     // Array of 12 months
}
```

## API Integration

### Endpoint
`{{BASE_URL}}/api/yearly-plans/`

### Expected Response Format
```json
{
  "id": 4,
  "user": 1,
  "year": 2025,
  "details": [
    {
      "month": 1,
      "sales_plan": "1000.00",
      "clients_plan": "50.00",
      "sales_count_plan": "200.00",
      "sales": 0,
      "clients": 0,
      "sales_count": 0,
      "sales_percentage": 0.0,
      "clients_percentage": 0.0,
      "sales_count_percentage": 0.0
    }
    // ... 11 more months
  ]
}
```

### Integration Example
```typescript
// In your component
const fetchYearlyPlan = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/yearly-plans/`);
    const data = await response.json();
    
    // Use with components
    return (
      <SalesPlanTable 
        data={[data]} 
        getUserName={(userId) => `User ${userId}`} 
      />
    );
  } catch (error) {
    console.error('Failed to fetch yearly plan:', error);
  }
};
```

## Testing Routes

The following routes have been added for testing:

- `/yearly-plan-demo` - Basic demo with sample data
- `/yearly-plan-api` - Full API integration example with dashboard

## Key Features

### 12-Month Headers
All components display proper month headers:
- Full names: January, February, March, etc.
- Abbreviated: Jan, Feb, Mar, etc.
- Responsive design for mobile devices

### Sales Plan Focus
- Components specifically show only `sales_plan` values
- Other fields (clients_plan, sales_count_plan) are available but not displayed
- Clean, focused presentation of sales data

### Responsive Design
- Tables scroll horizontally on mobile
- Grid layouts adapt to screen size
- Touch-friendly interface

### Type Safety
- Full TypeScript support
- Interfaces match your API structure
- Proper error handling

## Styling

Components use your existing UI library:
- `@/components/ui/table`
- `@/components/ui/card`
- `@/components/ui/button`
- `@/components/ui/badge`
- Consistent with your app's design system

## Performance Considerations

- Components handle missing data gracefully
- Efficient rendering with proper keys
- Minimal re-renders with React best practices
- Lazy loading support ready

## Customization Options

### Formatting
- Currency formatting can be customized
- Date/month display formats
- Number precision settings

### Theming
- All components use your existing theme
- Color schemes match your brand
- Dark mode support ready

### Localization
- Month names can be localized
- Number formatting respects locale
- RTL support available

## Future Enhancements

Potential improvements you could add:

1. **Charts Integration** - Add chart.js or recharts for visual representation
2. **Export Functionality** - Export tables to CSV/Excel
3. **Comparison Views** - Compare multiple years side by side
4. **Mobile App** - React Native versions of components
5. **Real-time Updates** - WebSocket integration for live data
6. **Advanced Filtering** - Date ranges, user groups, etc.

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure your API response matches the expected interface
2. **Missing Data**: Components handle missing months gracefully
3. **Performance**: Use React.memo for large datasets
4. **Styling**: Ensure UI components are properly imported

### Debug Tips

- Check browser console for API errors
- Verify data structure matches interfaces
- Test with sample data first
- Use React DevTools for component inspection

## Support

For questions or issues:
1. Check this documentation first
2. Review the demo components
3. Test with the provided sample data
4. Verify API response format matches expected structure