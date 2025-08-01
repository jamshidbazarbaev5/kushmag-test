import React, { useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Input } from '../../components/ui/input';

export interface Product {
  id: string;
  name: string;
  [key: string]: any;
}

interface Option {
  value: Product;
  label: string;
}


interface AsyncSearchableSelectProps {
  value: Product | null;
  onChange: (value: Product | null) => void;
  placeholder?: string;
  searchProducts: (query: string) => Promise<Product[]>;
  required?: boolean;
  // disabled?: boolean;
}


export function AsyncSearchableSelect({ value, onChange, placeholder, searchProducts, required }: AsyncSearchableSelectProps) {
  const [search, setSearch] = useState<string>('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchOptions = async (query: string) => {
    setLoading(true);
    try {
      const products = await searchProducts(query);
      setOptions(products.map((product: Product) => ({ value: product, label: product.name })));
    } catch (e) {
      setOptions([]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    if (search.length > 0) {
      fetchOptions(search);
    } else {
      setOptions([]);
    }
  }, [search]);

  return (
    <div>
      <Input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
        required={required}
        className="mb-2"
      />
      <Select
        onValueChange={val => {
          const selected = options.find(opt => opt.value.id === val);
          onChange(selected ? selected.value : null);
        }}
        value={value?.id || ''}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="__loading" disabled>Loading...</SelectItem>
          ) : options.length === 0 ? (
            <SelectItem value="__noresults" disabled>No results</SelectItem>
          ) : (
            options.map(opt => (
              <SelectItem key={opt.value.id} value={opt.value.id}>
                {opt.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
