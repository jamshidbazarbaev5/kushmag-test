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
                  // Handle different types of select fields
                  let options: any[] = [];
                  let onChangeHandler = (value: string) => {
                    subFormField.onChange(value);
                  };

                  if (subField.name === 'price_type') {
                    // Price type dropdown
                    options = itemData?.model?.salePrices?.map((p: any) => ({
                      value: p.priceType.id,
                      label: p.priceType.name
                    })) || [];
                    
                    onChangeHandler = (value: string) => {
                      subFormField.onChange(value);
                      const selectedPrice = itemData?.model?.salePrices.find((p: any) => p.priceType.id === value);
                      if (selectedPrice) {
                        form.setValue(`${field.name}.${index}.price`, selectedPrice.value / 100);
                      }
                    };
                  } else if (subField.name === 'casing_type') {
                    // Casing type dropdown
                    options = [
                      { value: "боковой", label: t("forms.casing_type_side") || "Side" },
                      { value: "прямой", label: t("forms.casing_type_straight") || "Straight" }
                    ];
                    
                    onChangeHandler = (value: string) => {
                      subFormField.onChange(value);
                      // Trigger height recalculation after casing type changes
                      setTimeout(() => {
                        form.trigger(`${field.name}.${index}.height`);
                      }, 0);
                    };
                  } else if (subField.name === 'casing_formula') {
                    // Casing formula dropdown
                    options = [
                      { value: "formula1", label: t("forms.formula_1") || "Formula 1" },
                      { value: "formula2", label: t("forms.formula_2") || "Formula 2" }
                    ];
                    
                    onChangeHandler = (value: string) => {
                      subFormField.onChange(value);
                      // Clear casing range when formula changes
                      if (value === "formula1") {
                        form.setValue(`${field.name}.${index}.casing_range`, '');
                      }
                      // Trigger height recalculation after formula changes
                      setTimeout(() => {
                        form.trigger(`${field.name}.${index}.height`);
                      }, 0);
                    };
                  } else if (subField.name === 'casing_range') {
                    // Casing range dropdown - use the options from subField
                    options = subField.options || [];
                    console.log("Casing range options in DynamicListField:", options); // Debug log
                    
                    onChangeHandler = (value: string) => {
                      subFormField.onChange(value);
                      // Trigger height recalculation after range selection changes
                      setTimeout(() => {
                        form.trigger(`${field.name}.${index}.height`);
                      }, 0);
                    };
                  } else {
                    // Default: use options from subField if available
                    options = subField.options || [];
                  }

                  return (
                    <Select
                      onValueChange={onChangeHandler}
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
                  
                  // For crown width and casing height fields, calculate and set the value automatically
                  React.useEffect(() => {
                    if (subField.disabled && subField.calculateValue) {
                      const calculatedValue = subField.calculateValue(itemData);
                      if (calculatedValue !== subFormField.value && calculatedValue !== "") {
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