/**
 * Utility functions for formatting values throughout the application
 */

/**
 * Format a number as INR currency
 * @param value - The numeric value to format as currency
 * @param maximumFractionDigits - Maximum number of decimal places to show
 * @returns Formatted currency string (e.g., "₹10,000")
 */
export function formatCurrency(value: number, maximumFractionDigits: number = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value - The numeric value to format as percentage
 * @param showSign - Whether to show + sign for positive values
 * @returns Formatted percentage string (e.g., "+10.5%")
 */
export function formatPercentage(value: number, showSign: boolean = true): string {
  return `${showSign && value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Format a date
 * @param date - The date to format
 * @returns Formatted date string (e.g., "12 Mar, 2023")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

/**
 * Convert USD to INR (approximation for demo purposes)
 * In a real app, this would use an API for current exchange rates
 * @param usdValue - The value in USD
 * @returns The value in INR
 */
export function usdToInr(usdValue: number): number {
  // Using a fixed exchange rate of 1 USD = 84 INR for demonstration
  // In a real app, this would fetch the current exchange rate from an API
  const exchangeRate = 84;
  return usdValue * exchangeRate;
}