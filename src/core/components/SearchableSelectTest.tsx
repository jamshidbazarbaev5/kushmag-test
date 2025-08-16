import { useState } from 'react';
import { SearchableResourceSelect } from '../helpers/SearchableResourceSelect';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function SearchableSelectTest() {
  const [selectedMaterial, setSelectedMaterial] = useState<string | number>('');
  const [selectedStore, setSelectedStore] = useState<string | number>('');
  const [selectedColor, setSelectedColor] = useState<string | number>('');

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Searchable Select Test Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Material Select Test */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Material (Test)
            </label>
            <SearchableResourceSelect
              value={selectedMaterial}
              onChange={setSelectedMaterial}
              placeholder="Select material..."
              resourceType="materials"
            />
            <p className="text-xs text-gray-500">
              Selected Material ID: {selectedMaterial || 'None'}
            </p>
          </div>

          {/* Store Select Test */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Store (Test)
            </label>
            <SearchableResourceSelect
              value={selectedStore}
              onChange={setSelectedStore}
              placeholder="Select store..."
              resourceType="stores"
            />
            <p className="text-xs text-gray-500">
              Selected Store ID: {selectedStore || 'None'}
            </p>
          </div>

          {/* Color Select Test */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Color (Test)
            </label>
            <SearchableResourceSelect
              value={selectedColor}
              onChange={setSelectedColor}
              placeholder="Select color..."
              resourceType="colors"
            />
            <p className="text-xs text-gray-500">
              Selected Color ID: {selectedColor || 'None'}
            </p>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Test Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Click on any dropdown to see all options initially</li>
              <li>2. Type in the search box to filter options</li>
              <li>3. Search calls the API with search parameter</li>
              <li>4. Selected values are displayed below each select</li>
              <li>5. Loading states should appear during API calls</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
