export interface ValidationError {
  field: string;
  message: string;
}

export const validators = {
  required: (value: any, fieldName: string): string | null => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  },

  minValue: (value: number, min: number, fieldName: string): string | null => {
    if (value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  maxValue: (value: number, max: number, fieldName: string): string | null => {
    if (value > max) {
      return `${fieldName} must not exceed ${max}`;
    }
    return null;
  },

  isNumber: (value: any, fieldName: string): string | null => {
    if (isNaN(value) || value === '') {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  isPositive: (value: number, fieldName: string): string | null => {
    if (value <= 0) {
      return `${fieldName} must be greater than 0`;
    }
    return null;
  },

  isInteger: (value: number, fieldName: string): string | null => {
    if (!Number.isInteger(value)) {
      return `${fieldName} must be a whole number`;
    }
    return null;
  },
};

export function validateAddGrams(value: string): string | null {
  const numValue = parseFloat(value);

  const required = validators.required(value, 'Grams');
  if (required) return required;

  const isNumber = validators.isNumber(value, 'Grams');
  if (isNumber) return isNumber;

  const isPositive = validators.isPositive(numValue, 'Grams');
  if (isPositive) return isPositive;

  return null;
}

export function validateThreshold(value: string, fieldName: string = 'Threshold'): string | null {
  const numValue = parseInt(value, 10);

  const required = validators.required(value, fieldName);
  if (required) return required;

  const isNumber = validators.isNumber(value, fieldName);
  if (isNumber) return isNumber;

  const isPositive = validators.isPositive(numValue, fieldName);
  if (isPositive) return isPositive;

  const isInteger = validators.isInteger(numValue, fieldName);
  if (isInteger) return isInteger;

  return null;
}
