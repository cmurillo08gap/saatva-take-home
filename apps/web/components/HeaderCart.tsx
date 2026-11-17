'use client'

import Link from 'next/link'
import { useCart } from '@/components/CartProvider'

export function HeaderCart() {
  const { count, hydrated } = useCart()
  // Before hydration the count is unknown (the cart lives in the browser), so show no badge.
  const shown = hydrated ? count : 0

  return (
    <Link
      className="site-header__cart"
      href="/cart"
      aria-label={`Cart, ${shown} ${shown === 1 ? 'item' : 'items'}`}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1.25" fill="currentColor" />
        <circle cx="17" cy="20" r="1.25" fill="currentColor" />
      </svg>
      {shown > 0 && (
        <span className="site-header__badge" aria-hidden="true">
          {shown}
        </span>
      )}
    </Link>
  )
}
