import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { useSearchProducts } from '@/core/api/products';

interface AsyncSearchableSelectProps {
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
}

export function AsyncSearchableSelect({
  value,
  onChange,
  placeholder,
}: AsyncSearchableSelectProps) {
  const [search, setSearch] = useState('');
  const { data: searchResults, isLoading } = useSearchProducts(search);

  const handleSelectItem = (selectedItem: any) => {
    onChange(selectedItem);
    setSearch('');
  };

  return (
    <Select
      value={value?.id}
      onValueChange={handleSelectItem}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 sticky top-0 bg-white z-10 border-b">
          <Input
            type="text"
            placeholder="Type to search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
            autoFocus
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-center text-gray-500">Loading...</div>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((item: any) => (
              <SelectItem key={item.id} value={item}>
                {item.name}
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-center text-gray-500">
              {search.length < 2 ? 'Type to search...' : 'No results found'}
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
