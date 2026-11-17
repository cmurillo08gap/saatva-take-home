import { formatCount } from '@/lib/format'

const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z'

function Stars() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
      ))}
    </>
  )
}

export function StarRating({ average, count }: { average: number; count: number }) {
  const percent = Math.max(0, Math.min(100, (average / 5) * 100))

  return (
    <div
      className="star-rating"
      role="img"
      aria-label={`Rated ${average} out of 5, ${formatCount(count)} reviews`}
    >
      <span className="star-rating__stars" aria-hidden="true">
        <span className="star-rating__row star-rating__row--empty">
          <Stars />
        </span>
        <span className="star-rating__row star-rating__row--full" style={{ width: `${percent}%` }}>
          <Stars />
        </span>
      </span>
      <span className="star-rating__label" aria-hidden="true">
        {average} ({formatCount(count)} reviews)
      </span>
    </div>
  )
}
