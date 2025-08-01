import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { useSearchProducts } from '@/core/api/products';
import type { AccessoryType } from '@/core/api/types';
import { useState } from 'react';

interface AccessorySelectProps {
  value: any[];
  onChange: (value: any[]) => void;
  accessoryTypes: { value: AccessoryType; label: string }[];
  apiEndpoint: string;
  searchParam: string;
  placeholder?: string;
}

export function AccessorySelect({
  value = [],
  onChange,
  accessoryTypes,
  placeholder,
}: AccessorySelectProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<AccessoryType | ''>('');
  
  const { data: searchResults } = useSearchProducts(search);

  const handleAddAccessory = (accessory: any) => {
    if (selectedType) {
      onChange([...value, { ...accessory, type: selectedType }]);
      setSearch('');
      setSelectedType('');
    }
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value as AccessoryType);
  };

  const handleRemoveAccessory = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select
          value={selectedType}
          onValueChange={handleTypeChange}
        >
          {accessoryTypes.map(type => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </Select>
        
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            disabled={!selectedType}
          />
        </div>
      </div>

      {search && searchResults && (
        <div className="border rounded-md p-2 space-y-2">
          {searchResults.map((result: any) => (
            <div
              key={result.id}
              className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => handleAddAccessory(result)}
            >
              <span>{result.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {value.map((accessory, index) => (
          <div key={index} className="flex justify-between items-center p-2 border rounded">
            <div>
              <span className="font-medium">{accessory.name}</span>
              <span className="ml-2 text-sm text-gray-500">
                {accessoryTypes.find(t => t.value === accessory.type)?.label}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveAccessory(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormAccessorySelect({ 
  control,
  name,
  ...props 
}: AccessorySelectProps & { control: any; name: string }) {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={[]}
      render={({ field }) => (
        <AccessorySelect
          {...props}
          value={field.value}
          onChange={field.onChange}
        />
      )}
    />
  );
}

export default FormAccessorySelect;
