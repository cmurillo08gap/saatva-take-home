import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Saatva | Page not found',
}

export default function NotFound() {
  return (
    <section className="unavailable" aria-labelledby="not-found-title">
      <h1 id="not-found-title" className="unavailable__title">
        We couldn&rsquo;t find that page
      </h1>
      <p className="unavailable__text">The page may have moved, or the link may be mistyped.</p>
      <Link className="button" href="/">
        Choose your mattress
      </Link>
    </section>
  )
}
