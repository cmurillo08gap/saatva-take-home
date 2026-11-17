'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { Product } from '@saatva/contracts'
import { useCart } from '@/components/CartProvider'
import { MAX_QUANTITY_PER_LINE } from '@/lib/cart'
import { PriceTag } from '@/components/PriceTag'
import { RichText } from '@/components/RichText'
import { StarRating } from '@/components/StarRating'

type ProductConfiguratorProps = {
  products: Product[]
  initialProductId?: string
}

export function ProductConfigurator({ products, initialProductId }: ProductConfiguratorProps) {
  // An unknown or missing id falls back to the first product.
  const [selectedId, setSelectedId] = useState(
    () => (products.find((p) => p.id === initialProductId) ?? products[0]).id,
  )
  const product = products.find((p) => p.id === selectedId) ?? products[0]
  const { addItem, prune } = useCart()
  const [status, setStatus] = useState('')

  // Drop cart lines for products that are no longer sellable.
  useEffect(() => {
    prune(products.map((p) => p.id))
  }, [products, prune])

  function handleAdd() {
    setStatus(
      addItem(product) === 'added'
        ? `Added ${product.name} to your cart`
        : `You can add up to ${MAX_QUANTITY_PER_LINE} of this mattress`,
    )
  }

  function select(id: string) {
    setSelectedId(id)
    setStatus('')
    // Keep the choice in the URL without a server round trip or a history entry.
    const params = new URLSearchParams(window.location.search)
    params.set('product', id)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  return (
    <section className="configurator" aria-labelledby="configurator-title">
      <h1 id="configurator-title" className="configurator__title">
        Choose Your Mattress
      </h1>

      <fieldset className="configurator__select segmented">
        <legend className="segmented__legend">Select mattress type</legend>
        <div className="segmented__options">
          {products.map((p) => (
            <label key={p.id} className="segmented__option">
              <input
                className="segmented__input"
                type="radio"
                name="mattress"
                value={p.id}
                checked={p.id === product.id}
                onChange={() => select(p.id)}
              />
              <span className="segmented__label">{p.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="configurator__media">
        <Image
          src={product.imageUrl}
          alt={`${product.name} mattress`}
          fill
          preload
          sizes="(min-width: 1110px) 634px, (min-width: 768px) 55vw, 100vw"
          className="configurator__image"
        />
      </div>

      <div className="configurator__details">
        <div className="configurator__summary">
          <h2 className="configurator__name">{product.name} Mattress</h2>
          <PriceTag
            priceCents={product.priceCents}
            compareAtPriceCents={product.compareAtPriceCents}
            currency={product.currency}
          />
        </div>

        {product.badges.length > 0 && (
          <ul className="badges">
            {product.badges.map((badge) => (
              <li key={badge} className="badges__item">
                {badge}
              </li>
            ))}
          </ul>
        )}

        {product.headline && <p className="configurator__headline">{product.headline}</p>}
        {product.rating && (
          <StarRating average={product.rating.average} count={product.rating.count} />
        )}
        {product.descriptionHtml && (
          <RichText html={product.descriptionHtml} className="configurator__description" />
        )}

        <button type="button" className="button configurator__add" onClick={handleAdd}>
          Add to Cart
        </button>
        <p className="configurator__status" role="status" aria-live="polite">
          {status}
        </p>
      </div>
    </section>
  )
}
