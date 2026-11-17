export function CartUnavailable() {
  return (
    <section className="unavailable" role="alert">
      <h1 className="unavailable__title">We can&rsquo;t show your cart right now</h1>
      <p className="unavailable__text">
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
