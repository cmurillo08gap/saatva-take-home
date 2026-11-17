export function CartUnavailable() {
  return (
    <section className="unavailable" aria-labelledby="cart-unavailable-title">
      <h1 id="cart-unavailable-title" className="unavailable__title">
        We can&rsquo;t show your cart right now
      </h1>
      <p className="unavailable__text" role="alert">
        We couldn&rsquo;t load product details. Your items are still saved. Please try again in a
        moment.
      </p>
      {/* A plain link forces a full reload, which re-runs the server fetch. */}
      <a className="button" href="/cart">
        Try again
      </a>
    </section>
  )
}
