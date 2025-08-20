/**
 * Formats a number with comma separators for thousands
 * @param value - The number to format (can be string or number)
 * @param decimals - Number of decimal places to show (default: 0)
 * @returns Formatted string with comma separators
 */
export const formatNumber = (value: string | number, decimals: number = 0): string => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0';
  }

  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formats currency with comma separators and currency symbol
 * @param value - The number to format (can be string or number)
 * @param currency - Currency symbol (default: 'сум')
 * @param decimals - Number of decimal places to show (default: 0)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: string | number, currency: string = 'сум', decimals: number = 0): string => {
  const formattedNumber = formatNumber(value, decimals);
  return `${formattedNumber} ${currency}`;
};

/**
 * Formats a percentage with proper decimal places
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: string | number, decimals: number = 2): string => {
  const formattedNumber = formatNumber(value, decimals);
  return `${formattedNumber}%`;
};

/**
 * Parses a formatted number string back to a number
 * @param value - Formatted number string with commas
 * @returns Parsed number
 */
export const parseFormattedNumber = (value: string): number => {
  if (!value || typeof value !== 'string') {
    return 0;
  }

  // Remove commas and parse
  const cleaned = value.replace(/,/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? 0 : parsed;
};
