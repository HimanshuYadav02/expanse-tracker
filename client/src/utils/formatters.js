export const formatCurrency = (amount, currency = 'USD') => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'AU$'
  };

  const symbol = symbols[currency] || '$';
  const val = Math.abs(Number(amount) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${symbol}${val}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const CATEGORIES = [
  { name: 'Food & Dining', value: 'Food', color: '#f97316' },
  { name: 'Housing & Rent', value: 'Housing', color: '#3b82f6' },
  { name: 'Transportation', value: 'Transportation', color: '#6366f1' },
  { name: 'Entertainment', value: 'Entertainment', color: '#ec4899' },
  { name: 'Utilities & Bills', value: 'Utilities', color: '#eab308' },
  { name: 'Healthcare', value: 'Healthcare', color: '#ef4444' },
  { name: 'Investment', value: 'Investment', color: '#10b981' },
  { name: 'Salary', value: 'Salary', color: '#22c55e' },
  { name: 'Freelance', value: 'Freelance', color: '#14b8a6' },
  { name: 'Other', value: 'Other', color: '#64748b' }
];

export const PAYMENT_METHODS = ['Card', 'Cash', 'UPI', 'Bank Transfer', 'Other'];
