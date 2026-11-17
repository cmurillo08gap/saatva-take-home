export function ProductsUnavailable() {
  return (
    <section className="unavailable" aria-labelledby="products-unavailable-title">
      <h1 id="products-unavailable-title" className="unavailable__title">
        Our mattresses are taking a nap
      </h1>
      <p className="unavailable__text" role="alert">
        We couldn&rsquo;t load the mattress selection right now. Please try again in a moment.
      </p>
      {/* A plain link forces a full reload, which re-runs the server fetch. */}
      <a className="button" href="/">
        Try again
      </a>
    </section>
  )
}
