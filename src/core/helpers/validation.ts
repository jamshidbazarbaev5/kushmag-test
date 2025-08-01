import * as z from "zod";

// Order validation schema
export const orderSchema = z.object({
  rate: z.string().min(1, "Currency is required"),
  store: z.string().min(1, "Store is required"),
  project: z.string().min(1, "Project is required"),
  agent: z.string().min(1, "Agent is required"),
  organization: z.string().min(1, "Organization is required"),
  salesChannel: z.string().min(1, "Sales channel is required"),
  address: z.string().min(1, "Address is required"),
  order_code: z.string().min(1, "Order code is required"),
  order_date: z.string().min(1, "Order date is required"),
  deadline_date: z.string().min(1, "Deadline date is required"),
  seller: z.string().min(1, "Seller is required"),
  operator: z.string().min(1, "Operator is required"),
  discount_percentage: z.number().min(0).max(100).optional(),
  advance_payment: z.number().min(0).optional(),
  description: z.string().optional(),
});

// Door validation schema
export const doorSchema = z.object({
  model: z.string().min(1, "Door model is required"),
  price_type: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  height: z.number().min(0, "Height must be positive"),
  width: z.number().min(0, "Width must be positive"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  material: z.string().min(1, "Material is required"),
  material_type: z.string().min(1, "Material type is required"),
  massif: z.string().min(1, "Massif is required"),
  color: z.string().min(1, "Color is required"),
  patina_color: z.string().min(1, "Patina color is required"),
  beading_main: z.string().min(1, "Main beading is required"),
  beading_additional: z.string().min(1, "Additional beading is required"),
  glass_type: z.string().min(1, "Glass type is required"),
  threshold: z.string().min(1, "Threshold is required"),
});

export type OrderFormData = z.infer<typeof orderSchema>;
export type DoorFormData = z.infer<typeof doorSchema>;

// Utility function to get field validation
export const getFieldValidation = (fieldName: string, schema: any) => {
  try {
    return schema.shape[fieldName];
  } catch {
    return undefined;
  }
};

// Real-time validation hook
export const useFieldValidation = (fieldName: string, value: any, schema: any) => {
  try {
    const fieldSchema = getFieldValidation(fieldName, schema);
    if (fieldSchema) {
      fieldSchema.parse(value);
      return { isValid: true, error: null };
    }
    return { isValid: true, error: null };
  } catch (error: any) {
    return { 
      isValid: false, 
      error: error.errors?.[0]?.message || "Invalid value" 
    };
  }
};
