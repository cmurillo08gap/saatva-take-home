'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useEffect } from 'react'

// Last-resort boundary for unexpected render errors. Expected failures (products unavailable)
// are handled by the pages themselves with friendlier copy.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  // reset() alone re-renders from the same server payload; refresh() fetches it again first.
  function retry() {
    startTransition(() => {
      router.refresh()
      reset()
    })
  }

  return (
    <section className="unavailable" aria-labelledby="error-title">
      <h1 id="error-title" className="unavailable__title">
        Something went wrong
      </h1>
      <p className="unavailable__text" role="alert">
        We hit a snag loading this page. Please try again.
      </p>
      <button type="button" className="button" onClick={retry}>
        Try again
      </button>
    </section>
  )
}
