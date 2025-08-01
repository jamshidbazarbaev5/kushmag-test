// DynamicListField.tsx

import React from 'react';
import { Button } from '../../components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../components/ui/form';
import { AsyncSearchableSelect } from './AsyncSearchableSelect';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { t } from 'i18next';

// A sub-component to render each item in the list, giving it access to form context
function DynamicListItem({ field, form, subField, index }: { field: any, form: any, subField: any, index: number }) {
  const fieldName = `${field.name}.${index}.${subField.name}`;
  
  // Watch the data for the current item in the list
  const itemData = useWatch({
    control: form.control,
    name: `${field.name}.${index}`
  });

  // Check if the field should be displayed
  if (subField.show && !subField.show(itemData)) {
    return null;
  }

  return (
    <FormField
      key={fieldName}
      control={form.control}
      name={fieldName}
      defaultValue={subField.defaultValue}
      render={({ field: subFormField }) => (
        <FormItem>
          <FormLabel>{subField.label}</FormLabel>
          <FormControl>
            {(() => {
              switch (subField.type) {
                case 'async-searchable-select':
                  return (
                    <AsyncSearchableSelect
                      value={subFormField.value}
                      onChange={(selectedModel) => {
                        subFormField.onChange(selectedModel); // Update the model field
                        
                        // When model changes, update prices
                        if (selectedModel?.salePrices?.length === 1) {
                          form.setValue(`${field.name}.${index}.price_type`, selectedModel.salePrices[0].priceType.id);
                          form.setValue(`${field.name}.${index}.price`, selectedModel.salePrices[0].value / 100);
                        } else {
                          // If multiple prices or no prices, clear them and let user choose
                          form.setValue(`${field.name}.${index}.price_type`, '');
                          form.setValue(`${field.name}.${index}.price`, '');
                        }
                      }}
                      placeholder={subField.placeholder}
                      searchProducts={subField.searchProducts}
                      required={subField.required}
                    />
                  );
                case 'select':
                  // This now handles our price_type dropdown
                  const options = itemData?.model?.salePrices?.map((p: any) => ({
                    value: p.priceType.id,
                    label: p.priceType.name
                  })) || [];

                  return (
                    <Select
                      onValueChange={(value) => {
                        subFormField.onChange(value); // Update price_type field
                        const selectedPrice = itemData?.model?.salePrices.find((p: any) => p.priceType.id === value);
                        if (selectedPrice) {
                          form.setValue(`${field.name}.${index}.price`, selectedPrice.value / 100);
                        }
                      }}
                      value={subFormField.value}
                      required={subField.required}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={subField.placeholder || t('placeholders.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((opt: any) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                default: // Handles 'text' and 'number'
                  const isReadOnly = subField.readOnly && subField.readOnly(itemData);
                  const isDisabled = subField.disabled;
                  
                  // For crown width fields, calculate and set the value automatically
                  React.useEffect(() => {
                    if (subField.name === 'width' && subField.disabled && subField.calculateValue) {
                      const calculatedValue = subField.calculateValue();
                      if (calculatedValue !== subFormField.value) {
                        subFormField.onChange(calculatedValue);
                      }
                    }
                  }, [itemData, subField, subFormField]);

                  return (
                    <Input
                      type={subField.type || 'text'}
                      step={subField.step || 'any'}
                      placeholder={subField.placeholder}
                      {...subFormField}
                      readOnly={isReadOnly}
                      disabled={isDisabled}
                      className={(isReadOnly || isDisabled) ? 'bg-gray-100' : ''}
                    />
                  );
              }
            })()}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}


export function DynamicListField({ field, form }: { field: any, form: any }) {
  const { control } = form;
  const { fields: items, append, remove } = useFieldArray({
    control,
    name: field.name,
  });

  return (
    <div className="space-y-4 col-span-full">
      <div className="flex items-center justify-between">
        <FormLabel className="text-lg font-semibold">{field.label}</FormLabel>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ quantity: 1 })}>
          <PlusCircle size={16} className="mr-2" /> {field.addButtonLabel || 'Add'}
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No items added.</p>
      )}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="border rounded-lg p-4 bg-gray-50/50 relative">
            <div className="absolute top-3 right-3">
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              {field.itemFields.map((subField: any) => (
                <DynamicListItem key={subField.name} field={field} form={form} subField={subField} index={index} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}