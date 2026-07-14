/**
 * Indian Rupee Currency Formatter
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Standard Locale Date Formatter
 */
export const formatDate = (value: Date | string | number): string => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Standard Locale Number Formatter
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-IN').format(value);
};
