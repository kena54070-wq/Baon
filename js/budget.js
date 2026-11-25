/** budget.js — pure budget logic (no DOM, no storage). MIT */

/** Format a number as Philippine peso, e.g. "₱1,250.00". */
export function peso(n) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP',
  }).format(n);
}

/** Date -> "YYYY-MM-DD" in local time. */
export function toISODate(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "YYYY-MM-DD" -> Date at local midnight. */
export function fromISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Expense categories shown in the app. */
export const CATEGORIES = [
  { id: 'food', label: 'Food', emoji: '🍚' },
  { id: 'transpo', label: 'Transpo', emoji: '🛺' },
  { id: 'school', label: 'School', emoji: '📚' },
  { id: 'load', label: 'Load/Data', emoji: '📶' },
  { id: 'fun', label: 'Gimik', emoji: '🎮' },
  { id: 'others', label: 'Others', emoji: '🧾' },
];

/** Validate a new expense. Returns error messages (empty = valid). */
export function validateExpense(e) {
  const errors = [];
  const amount = Number(e.amount);
  if (!Number.isFinite(amount) || amount <= 0)
    errors.push('Amount must be greater than 0.');
  if (amount > 1_000_000)
    errors.push('Amount looks too large.');
  if (!CATEGORIES.some((c) => c.id === e.category))
    errors.push('Pick a category.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date ?? ''))
    errors.push('Pick a valid date.');
  return errors;
}