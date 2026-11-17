/** Formats integer cents as currency; whole-dollar amounts drop the decimals ("$1,299"). */
export function formatPrice(cents: number, currency: string): string {
  const whole = cents % 100 === 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100)
}

/** Formats a count with thousands separators ("5,231"). */
export function formatCount(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}
