import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import { t } from "i18next";
import { DynamicListField } from "./DynamicListField";
import { AsyncSearchableSelect } from "./AsyncSearchableSelect";
import { SearchableResourceSelect } from "./SearchableResourceSelect";
import { MultiSelect } from "./MultiSelect";
import { searchProducts } from "../api/api";

// Update the FormField interface to be more specific about the field types
export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "textarea"
    | "select"
    | "searchable-select"
    | "searchable-resource-select"
    | "multi-select"
    | "async-searchable-select"
    | "accessory-select"
    | "file"
    | "multiple-files";
  placeholder?: string;
  options?:
    | { value: string | number; label: string }[]
    | ((formData: any) => { value: string | number; label: string }[]);
  required?: boolean | ((formData: any) => boolean);
  readOnly?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  show?: (formData: any) => boolean;
  helperText?: string;
  imageUrl?: string;
  preview?: string;
  existingImage?: string;
  onDeleteImage?: (imageId?: number) => void;
  existingImages?: Array<{ id?: number; url: string }>;
  searchTerm?: string;
  onSearch?: (value: string) => void;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  // defaultValue?: any;
  onChange?: (
    value: any,
    formData: any,
    setValue: (field: string, value: any) => void,
  ) => void;
  nestedField?: React.ReactNode;
  resourceType?:
    | "materials"
    | "material-types"
    | "massifs"
    | "colors"
    | "patina-colors"
    | "beadings"
    | "glass-types"
    | "stores"
    | "projects"
    | "organizations"
    | "branches"
    | "sales-channels"
    | "sellers"
    | "operators"
    | "counterparties"
    | "zamershiks";
}

// Update the ResourceFormProps interface to be more specific about generic type T
interface ResourceFormProps<T extends Record<string, any>> {
  fields: any[]; // Revert back to using FormField[]
  onSubmit: (data: T) => void;
  defaultValues?: Partial<T>;
  isSubmitting?: boolean;
  title?: string;
  hideSubmitButton?: boolean;
  children?: React.ReactNode;
  form?: ReturnType<typeof useForm<T>>;
  gridClassName?: string; // New prop for custom grid layout
}

export function ResourceForm<T extends Record<string, any>>({
  fields,
  onSubmit,
  defaultValues = {},
  isSubmitting = false,
  title,
  hideSubmitButton = false,
  children,
  form: providedForm,
  gridClassName,
}: ResourceFormProps<T>) {
  // Transform defaultValues to handle nested fields
  const transformedDefaultValues = fields.reduce(
    (acc, field) => {
      if (field.name.includes(".")) {
        const [parent, child] = field.name.split(".");
        if (!acc[parent]) {
          acc[parent] = {};
        }
        acc[parent][child] = defaultValues[parent]?.[child] || "";
      } else {
        acc[field.name] = defaultValues[field.name] || "";
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  const internalForm = useForm<T>({
    defaultValues: transformedDefaultValues,
  });

  const form = providedForm || internalForm;

  const handleSubmit = (data: any) => {
    // Transform form data back to the expected structure
    const transformedData = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (
          typeof value === "object" &&
          value !== null &&
          !(value instanceof File)
        ) {
          acc[key] = value;
        } else {
          const keys = key.split(".");
          if (keys.length > 1) {
            const [parent, child] = keys;
            if (!acc[parent]) {
              acc[parent] = {};
            }
            acc[parent][child] = value;
          } else {
            acc[key] = value;
          }
        }
        return acc;
      },
      {} as Record<string, any>,
    );
    onSubmit(transformedData as T);
  };

  return (
    <div className="space-y-6">
      {title && <h2 className="text-xl font-bold">{title}</h2>}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 ${gridClassName}`}
          >
            {fields.map(
              (field) =>
                !field.hidden && (
                  <div key={field.name} className="space-y-4">
                    {field.type === "dynamic-list" ? (
                      <DynamicListField field={field} form={form} />
                    ) : (
                      <FormField
                        control={form.control}
                        name={field.name}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              {field.type === "textarea" ? (
                                <Textarea
                                  placeholder={field.placeholder}
                                  {...formField}
                                  readOnly={field.readOnly}
                                  className={
                                    field.readOnly ? "bg-gray-100" : ""
                                  }
                                />
                              ) : field.type === "select" ? (
                                <div>
                                  <Select
                                    onValueChange={(value) => {
                                      formField.onChange(value);
                                      if (field.onChange) {
                                        field.onChange(
                                          value,
                                          form.getValues(),
                                          (fieldName: string, value: any) => {
                                            form.setValue(
                                              fieldName as any,
                                              value,
                                            );
                                          },
                                        );
                                      }
                                    }}
                                    value={
                                      formField.value !== undefined &&
                                      formField.value !== null
                                        ? formField.value.toString()
                                        : undefined
                                    }
                                    defaultValue={
                                      field.defaultValue !== undefined
                                        ? field.defaultValue.toString()
                                        : undefined
                                    }
                                  >
                                    <SelectTrigger
                                      className={
                                        field.readOnly ? "bg-gray-100" : ""
                                      }
                                    >
                                      <SelectValue
                                        placeholder={
                                          field.placeholder ||
                                          t("placeholders.select")
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(typeof field.options === "function"
                                        ? field.options(form.getValues())
                                        : field.options
                                      )?.map(
                                        (option: {
                                          value: string | number;
                                          label: string;
                                        }) => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value.toString()}
                                          >
                                            {option.label}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                  {field.nestedField &&
                                    formField.value === "true" && (
                                      <div className="mt-4">
                                        {field.nestedField}
                                      </div>
                                    )}
                                </div>
                              ) : field.type === "searchable-select" ? (
                                <Select
                                  onValueChange={(value) => {
                                    formField.onChange(value);
                                    if (field.onChange) {
                                      field.onChange(value);
                                    }
                                  }}
                                  value={
                                    formField.value !== undefined &&
                                    formField.value !== null
                                      ? formField.value.toString()
                                      : undefined
                                  }
                                  defaultValue={
                                    formField.value !== undefined &&
                                    formField.value !== null
                                      ? formField.value.toString()
                                      : undefined
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue
                                      placeholder={field.placeholder}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(typeof field.options === "function"
                                      ? field.options(form.getValues())
                                      : field.options
                                    )?.map(
                                      (option: {
                                        value: string | number;
                                        label: string;
                                      }) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value.toString()}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              ) : field.type ===
                                "searchable-resource-select" ? (
                                <SearchableResourceSelect
                                  value={formField.value}
                                  onChange={formField.onChange}
                                  placeholder={field.placeholder}
                                  resourceType={
                                    field.resourceType || "materials"
                                  }
                                  disabled={field.disabled}
                                />
                              ) : field.type === "multi-select" ? (
                                <MultiSelect
                                  value={
                                    Array.isArray(formField.value)
                                      ? formField.value
                                      : []
                                  }
                                  onChange={formField.onChange}
                                  options={
                                    typeof field.options === "function"
                                      ? field.options(form.getValues())
                                      : field.options || []
                                  }
                                  placeholder={field.placeholder}
                                  disabled={field.disabled}
                                />
                              ) : field.type === "async-searchable-select" ? (
                                <AsyncSearchableSelect
                                  value={formField.value}
                                  onChange={formField.onChange}
                                  placeholder={field.placeholder}
                                  searchProducts={
                                    field.searchProducts || searchProducts
                                  }
                                  required={field.required}
                                />
                              ) : field.type === "number" ? (
                                <Input
                                  type="number"
                                  placeholder={field.placeholder}
                                  {...formField}
                                  readOnly={field.readOnly}
                                  className={
                                    field.readOnly ? "bg-gray-100" : ""
                                  }
                                />
                              ) : (
                                <Input
                                  type={field.type}
                                  placeholder={field.placeholder}
                                  {...formField}
                                  readOnly={field.readOnly}
                                  className={
                                    field.readOnly ? "bg-gray-100" : ""
                                  }
                                />
                              )}
                            </FormControl>
                            {field.helperText && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {field.helperText}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                ),
            )}
          </div>
          {children}
          <div className="col-span-full mt-6">
            {!hideSubmitButton && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? t("common.sending") : t("common.submit")}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
