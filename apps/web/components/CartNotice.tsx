'use client'

import { useCart } from '@/components/CartProvider'

/** One-time cart message under the header. The status region stays mounted so it is announced. */
export function CartNotice() {
  const { notice, dismissNotice } = useCart()

  function dismiss() {
    dismissNotice()
    // The button is about to leave the DOM; keep focus off <body>.
    document.getElementById('main')?.focus()
  }

  return (
    <div className="cart-notice-region" role="status">
      {notice && (
        <div className="cart-notice">
          <p className="cart-notice__text">{notice}</p>
          <button
            type="button"
            className="cart-notice__dismiss"
            aria-label="Dismiss message"
            onClick={dismiss}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}
    </div>
  )
}
