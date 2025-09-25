/**
 * Format currency amounts with LKR prefix and proper decimal formatting
 * @param {number|string} amount - The amount to format
 * @returns {string} - Formatted currency string (e.g., "LKR 12,000.00")
 */
export const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `LKR ${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format currency amounts without LKR prefix
 * @param {number|string} amount - The amount to format
 * @returns {string} - Formatted amount string (e.g., "12,000.00")
 */
export const formatAmount = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};