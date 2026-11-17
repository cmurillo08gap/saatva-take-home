import { formatPrice } from '@/lib/format'

type PriceTagProps = {
  priceCents: number
  compareAtPriceCents: number | null
  currency: string
}

export function PriceTag({ priceCents, compareAtPriceCents, currency }: PriceTagProps) {
  const onSale = compareAtPriceCents !== null && compareAtPriceCents > priceCents

  return (
    <span className={onSale ? 'price-tag price-tag--sale' : 'price-tag'}>
      <span className="price-tag__current">
        {onSale && <span className="visually-hidden">Now </span>}
        {formatPrice(priceCents, currency)}
      </span>
      {onSale && (
        <s className="price-tag__was">
          <span className="visually-hidden">Was </span>
          {formatPrice(compareAtPriceCents, currency)}
        </s>
      )}
    </span>
  )
}
