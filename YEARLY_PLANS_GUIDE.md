# Yearly Plans Management Guide

## Overview

The Yearly Plans module provides a comprehensive interface for managing annual sales plans across your organization. It includes functionality for creating, viewing, and editing yearly plans with detailed monthly breakdowns.

## Features

### 1. Modal-Based Plan Management
- **Add New Plans**: Create yearly plans for users with pre-filled sample data
- **Edit Existing Plans**: Modify existing plans through an intuitive modal interface
- **User-Friendly Interface**: Clean, organized modal with tabular data entry

### 2. Data Structure

#### Creating New Plans
When adding a new plan, the system starts with empty fields that you fill in:
```json
{
  "user": 1,
  "year": 2025,
  "details": [
    {"month": 1, "sales_plan": 0, "clients_plan": 0, "sales_count_plan": 0},
    {"month": 2, "sales_plan": 0, "clients_plan": 0, "sales_count_plan": 0},
    // ... continues for all 12 months with zero values to start
  ]
}
```

#### Editing Existing Plans
When editing, the system handles the full data structure including actuals and percentages:
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
    // ... continues for all months
  ]
}
```

## How to Use

### Adding a New Yearly Plan

1. **Navigate to Yearly Plans**: Go to the yearly plans page from the navigation menu
2. **Click Add Plan**: Use the "Add Plan" button in the header or table
3. **Select User**: Choose a user from the dropdown (only users without plans for the year are shown)
4. **Set Year**: Enter the target year (defaults to current year)
5. **Enter Monthly Data**: Fill in the three plan types for each month:
   - **Sales Plan**: Target sales amount
   - **Clients Plan**: Target number of clients
   - **Sales Count Plan**: Target number of sales transactions
6. **Review Totals**: Check the automatically calculated totals at the bottom
7. **Save**: Click "Create" to save the new plan

### Editing an Existing Plan

1. **Find the Plan**: Use filters to locate the specific user and year
2. **Click Edit**: Click the edit button (pencil icon) in the actions column
3. **Modify Data**: Update any monthly values as needed
4. **Review Changes**: Check the updated totals
5. **Save**: Click "Save" to apply changes

### Using Filters

- **User Filter**: Filter plans by specific user
- **Year Filter**: Filter plans by specific year
- **Clear Filters**: Remove applied filters to see all data

## Features in Detail

### Modal Interface
- **Large Modal**: Accommodates all 12 months of data comfortably
- **Responsive Design**: Works on various screen sizes
- **Input Validation**: Ensures data integrity
- **Real-time Totals**: Automatically calculates yearly totals

### Table Display
- **Consolidated View**: Shows all users' plans in a single table
- **Monthly Columns**: Each month displayed as a separate column
- **Color-coded Values**: Different colors for better readability
- **Summary Rows**: Totals for multiple users when applicable

### Data Management
- **Empty Defaults**: New plans start with zero values for all fields
- **Flexible Editing**: Can modify any field in existing plans
- **User Restrictions**: Prevents duplicate plans for the same user/year combination

## Technical Implementation

### Components Used
- **Dialog**: For modal interface
- **Table**: For data display and editing
- **Select**: For user and year selection
- **Input**: For numerical data entry
- **Button**: For actions and navigation

### State Management
- Modal state controls open/close and edit/add modes
- Form data manages the current plan being edited
- Validation ensures data quality before submission

### Internationalization
- Full support for Russian and Karakalpak languages
- All text elements are translatable
- Number formatting respects locale settings

## Best Practices

1. **Plan Early**: Create yearly plans at the beginning of each year
2. **Regular Updates**: Review and adjust plans quarterly
3. **Realistic Targets**: Set achievable but challenging goals
4. **Team Involvement**: Include team members in the planning process
5. **Performance Tracking**: Use the actual vs planned data for performance reviews

## Troubleshooting

### Common Issues

**Modal Won't Open**
- Check if user has permissions
- Ensure valid user list is loaded

**Data Not Saving**
- Verify all required fields are filled
- Check network connection
- Ensure user is selected

**Filters Not Working**
- Clear browser cache
- Refresh the page
- Check data format

### Error Messages
- "Please select a user": User selection is required
- "Yearly plan created successfully": Successful creation
- "Yearly plan updated successfully": Successful update

## API Integration

### Create Plan Endpoint
```typescript
onCreatePlan({
  user: number,
  year: number,
  details: Array<{
    month: number,
    sales_plan: number,
    clients_plan: number,
    sales_count_plan: number
  }>
})
```

### Update Plan Endpoint
```typescript
onUpdatePlan(planId: number, updatedDetails: Array<{
  month: number,
  sales_plan: number,
  clients_plan: number,
  sales_count_plan: number,
  // ... additional fields for actuals and percentages
}>)
```

This enhanced yearly plans system provides a comprehensive solution for managing annual sales targets with an intuitive interface and robust functionality.