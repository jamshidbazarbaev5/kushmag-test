import { useState } from "react";

interface ValidationErrors {
  [key: string]: boolean;
}

export const useFormValidation = () => {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  const validateRequiredFields = (
    formData: Record<string, unknown>,
    doors: Record<string, unknown>[],
    doorType: "WOOD" | "STEEL",
  ): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Required fields for all orders
    const requiredFields = [
      { field: "agent", name: "Контрагент" },
      { field: "organization", name: "Организация" },
      { field: "seller", name: "Продавец" },
      { field: "operator", name: "Оператор" },
      { field: "deadline_date", name: "Срок исполнения" },
    ];

    // Check required form fields
    requiredFields.forEach(({ field }) => {
      const value = formData[field];
      if (
        !value ||
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "number" && value === 0) ||
        (Array.isArray(value) && value.length === 0)
      ) {
        errors[field] = true;
        isValid = false;
      }
    });

    // For steel doors, validate door_name is required
    if (doorType === "STEEL" && doors && doors.length > 0) {
      doors.forEach((door, index) => {
        if (
          !door.door_name ||
          (typeof door.door_name === "string" && door.door_name.trim() === "")
        ) {
          errors[`door_name_${index}`] = true;
          isValid = false;
        }
      });
    }

    setValidationErrors(errors);
    return isValid;
  };

  const clearFieldError = (fieldName: string) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setValidationErrors({});
  };

  return {
    validationErrors,
    validateRequiredFields,
    clearFieldError,
    clearAllErrors,
  };
};
