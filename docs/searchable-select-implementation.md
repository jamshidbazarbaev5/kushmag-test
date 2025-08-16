# Searchable Select Implementation

## Overview

This document describes the implementation of searchable select components and multi-select functionality for material and order information fields in the Kushmag application. The implementation provides dropdown functionality that shows all options initially, adds search capabilities that call the API with search parameters, and includes multi-select support for fields like paska_orni.

## Requirements Implemented

1. **Show dropdown without searching initially** - All available options are displayed when the dropdown is opened
2. **Add searching functionality** - Users can search through options by typing
3. **API integration** - When searching, the system sends `search=''` parameter to the "all" endpoint
4. **Fixed zamershik mapping** - Now correctly uses dedicated zamershiks endpoint instead of counterparties
5. **Multi-select for paska_orni** - Implemented multi-select functionality that sends array values like `["Сырты", "Жок"]`

## Architecture

### Core Components

#### 1. SearchableSelect (`src/core/helpers/SearchableSelect.tsx`)
Base component that provides the UI and interaction logic for searchable dropdowns.

**Features:**
- Dropdown toggle with initial options display
- Search input with real-time filtering
- Loading states and error handling
- Keyboard navigation (Escape to close)
- Click outside to close functionality
- Selected option highlighting

**Props:**
```typescript
interface SearchableSelectProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  options: Option[];
  onSearch?: (searchTerm: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}
```

#### 2. Searchable Resource Hooks (`src/core/hooks/useSearchableResources.ts`)
Factory function that creates React Query hooks for different resource types.

**Features:**
- Generic hook factory for consistent API patterns
- Automatic search parameter handling
- Caching with 30s stale time and 5min garbage collection
- Support for both array and paginated API responses
- Error handling and loading states

**Available Hooks:**
- Material resources: `useSearchMaterials`, `useSearchMaterialTypes`, `useSearchMassifs`, `useSearchColors`, `useSearchPatinaColors`, `useSearchBeadings`, `useSearchGlassTypes`
- Order information: `useSearchStores`, `useSearchProjects`, `useSearchOrganizations`, `useSearchBranches`, `useSearchSalesChannels`, `useSearchSellers`, `useSearchOperators`, `useSearchCounterparties`, `useSearchZamershiks`

#### 3. SearchableResourceSelect (`src/core/helpers/SearchableResourceSelect.tsx`)
Wrapper component that combines SearchableSelect with API functionality.

**Features:**
- Resource type mapping to appropriate API hooks
- Automatic data fetching and formatting
- Error handling and loading state management
- Type-safe resource type selection

**Props:**
```typescript
interface SearchableResourceSelectProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  resourceType: 'materials' | 'material-types' | 'massifs' | 'colors' | 'patina-colors' | 'beadings' | 'glass-types' | 'stores' | 'projects' | 'organizations' | 'branches' | 'sales-channels' | 'sellers' | 'operators' | 'counterparties' | 'zamershiks';
  disabled?: boolean;
  className?: string;
}
```

#### 4. MultiSelect (`src/core/helpers/MultiSelect.tsx`)
Component for handling multiple selections in fields like paska_orni.

**Features:**
- Multiple option selection with checkboxes
- Tag-based display of selected options
- Individual tag removal functionality
- Click outside to close behavior
- Keyboard navigation support
- Responsive design with proper overflow handling

**Props:**
```typescript
interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
```

### Integration with ResourceForm

#### Updated FormField Interface
Added support for the new field types:

```typescript
export interface FormField {
  // ... existing properties
  type: 'text' | 'number' | 'textarea' | 'select' | 'searchable-select' | 'searchable-resource-select' | 'multi-select' | 'async-searchable-select' | 'accessory-select' | 'file' | 'multiple-files';
  resourceType?: 'materials' | 'material-types' | 'massifs' | 'colors' | 'patina-colors' | 'beadings' | 'glass-types' | 'stores' | 'projects' | 'organizations' | 'branches' | 'sales-channels' | 'sellers' | 'operators' | 'counterparties' | 'zamershiks';
  // ... other properties
}
```

#### ResourceForm Updates
The `ResourceForm` component now renders appropriate components based on field type:

```typescript
field.type === "searchable-resource-select" ? (
  <SearchableResourceSelect
    value={formField.value}
    onChange={formField.onChange}
    placeholder={field.placeholder}
    resourceType={field.resourceType || "materials"}
    disabled={field.disabled}
  />
) : field.type === "multi-select" ? (
  <MultiSelect
    value={Array.isArray(formField.value) ? formField.value : []}
    onChange={formField.onChange}
    options={typeof field.options === "function" ? field.options(form.getValues()) : field.options || []}
    placeholder={field.placeholder}
    disabled={field.disabled}
  />
) : // ... other field types
```

## Updated Fields

### Material Fields
Updated in all order pages to use the new searchable select:

```typescript
{
  name: "material",
  label: t("forms.material"),
  type: "searchable-resource-select",
  resourceType: "materials",
  placeholder: t("placeholders.select_material"),
  required: true,
},
{
  name: "material_type",
  label: t("forms.material_type"),
  type: "searchable-resource-select",
  resourceType: "material-types",
  placeholder: t("placeholders.select_material_type"),
  required: true,
},
// ... other material fields (massif, color, patina_color, beading_main, beading_additional)
```

### Order Information Fields
Updated in all order pages to use the new searchable select:

```typescript
{
  name: "store",
  label: t("forms.store"),
  type: "searchable-resource-select",
  resourceType: "stores",
  placeholder: t("placeholders.select_store"),
  required: true,
},
{
  name: "zamershik",
  label: t("forms.zamershik"),
  type: "searchable-resource-select",
  resourceType: "zamershiks",
  placeholder: t("placeholders.select_zamershik"),
  required: true,
},
// ... other order information fields (project, organization, branch, salesChannel, seller, operator)
```

### Multi-Select Fields
Implemented for paska_orni in all order pages:

```typescript
// In component JSX
<MultiSelect
  value={Array.isArray(door.paska_orin) ? door.paska_orin : []}
  onChange={(value) => handleFieldChange(index, table.id, "paska_orin", value)}
  options={[
    { value: "Сырты", label: "Сырты" },
    { value: "Иши", label: "Иши" },
    { value: "Жок", label: "Жок" },
  ]}
  placeholder="Паска орыны"
  className="h-8"
/>
```

## API Integration

### Search Parameters
When a user searches, the hooks automatically add the search parameter to API calls:

```typescript
const params: Record<string, string> = {};
if (search) {
  params.search = search;
}

const response = await api.get(baseUrl, { params });
```

### Endpoint Mapping
The implementation maps resource types to their corresponding API endpoints:

- Materials: `materials/`
- Material Types: `material-types/`
- Massifs: `massifs/`
- Colors: `colors/`
- Patina Colors: `patina-colors/`
- Beadings: `beadings/`
- Glass Types: `glass-types/`
- Stores: `store/`
- Projects: `project/`
- Organizations: `organization/`
- Branches: `branches/`
- Sales Channels: `saleschannel/`
- Sellers: `sellers/`
- Operators: `operators/`
- Counterparties: `counterparty/`
- Zamershiks: `zamershiks/`

## Usage Examples

### In Form Field Definition
```typescript
{
  name: "material",
  label: "Material",
  type: "searchable-resource-select",
  resourceType: "materials",
  placeholder: "Select material...",
  required: true,
}
```

### Direct Component Usage
```typescript
<SearchableResourceSelect
  value={selectedMaterial}
  onChange={setSelectedMaterial}
  placeholder="Select material..."
  resourceType="materials"
/>
```

### Multi-Select Usage
```typescript
<MultiSelect
  value={selectedPaskaOrin}
  onChange={setSelectedPaskaOrin}
  options={[
    { value: "Сырты", label: "Сырты" },
    { value: "Иши", label: "Иши" },
    { value: "Жок", label: "Жок" },
  ]}
  placeholder="Select paska orni..."
/>
```

## Updated Pages

### Files Modified:
1. **create-order.tsx** - Added searchable selects and multi-select for paska_orni
2. **edit-order.tsx** - Added searchable selects and multi-select for paska_orni  
3. **edit-order-2.tsx** - Added searchable selects and multi-select for paska_orni

### Key Changes:
- Fixed zamershik to use dedicated `zamershiks` endpoint instead of `counterparties`
- Converted paska_orni from single Select to MultiSelect component
- Updated all material and order information fields to use searchable-resource-select
- Added proper array handling for paska_orni field initialization and updates
- Added defensive programming for priceSettings API response handling

## Bug Fixes

### Fixed priceSettings.find Error
Added defensive programming to handle different API response formats:

```typescript
const priceSettingsList = useMemo(() => {
  if (!priceSettings) return [];
  if (Array.isArray(priceSettings)) return priceSettings;
  if (
    typeof priceSettings === "object" &&
    "results" in priceSettings &&
    Array.isArray((priceSettings as any).results)
  )
    return (priceSettings as any).results;
  
  console.warn("Unexpected priceSettings format:", priceSettings);
  return [];
}, [priceSettings]);
```

## Benefits

1. **Improved UX**: Users can see all options initially without needing to search
2. **Better Performance**: Search requests are debounced and cached
3. **Consistent API**: All searchable selects use the same pattern
4. **Type Safety**: Full TypeScript support with proper typing
5. **Backward Compatibility**: Existing non-searchable selects continue to work
6. **Scalable**: Easy to add new resource types by extending the hooks
7. **Correct Endpoint Mapping**: Fixed zamershik to use proper dedicated endpoint
8. **Multi-Select Support**: Added comprehensive multi-select functionality for array fields
9. **Defensive Programming**: Added error handling for various data formats from APIs

## Future Enhancements

1. **Debounced Search**: Add configurable debounce delay for search requests
2. **Infinite Scroll**: Support for large datasets with pagination
3. **Advanced Multi-Select**: Enhanced multi-select with search within options
4. **Custom Filtering**: Allow custom client-side filtering logic
5. **Caching Strategies**: More sophisticated caching based on search terms
6. **Async Multi-Select**: Multi-select with API-based option loading
7. **Bulk Operations**: Select all/deselect all functionality for multi-selects