export function Header() {
  // TODO (Phase 3): the cart count should reflect what's been added to the cart.
  const cartCount: number = 0

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <span className="site-header__logo">saatva</span>
        <span
          className="site-header__cart"
          role="img"
          aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
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
          {cartCount > 0 && (
            <span className="site-header__badge" aria-hidden="true">
              {cartCount}
            </span>
          )}
        </span>
      </div>
    </header>
  )
}
