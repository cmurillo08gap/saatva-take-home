'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Product } from '@saatva/contracts'
import { useCart } from '@/components/CartProvider'
import { PriceTag } from '@/components/PriceTag'
import { QuantityStepper } from '@/components/QuantityStepper'
import { priceCart } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

export function CartSkeleton() {
  return (
    <div className="cart" aria-busy="true" aria-label="Loading your cart">
      <div className="skeleton skeleton--title" />
      <div className="skeleton cart__skeleton-line" />
      <div className="skeleton cart__skeleton-line" />
    </div>
  )
}

export function CartView({ products }: { products: Product[] }) {
  const { cart, hydrated, prune, setQuantity, removeItem } = useCart()
  const [status, setStatus] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const removeRefs = useRef(new Map<string, HTMLButtonElement>())
  // Where focus goes once a removed line has left the DOM (a product id, or the heading).
  const pendingFocus = useRef<string | 'heading' | null>(null)

  // Drop cart lines for products that are no longer sellable.
  useEffect(() => {
    prune(products.map((p) => p.id))
  }, [products, prune])

  const priced = useMemo(() => priceCart(cart, products), [cart, products])
  const money = (cents: number) => formatPrice(cents, priced.currency)

  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    if (target === 'heading') headingRef.current?.focus()
    else removeRefs.current.get(target)?.focus()
  }, [priced.lines.length])

  if (!hydrated) return <CartSkeleton />

  if (priced.lines.length === 0) {
    return (
      <section className="cart cart--empty" aria-labelledby="cart-title">
        <h1 id="cart-title" className="cart__title" ref={headingRef} tabIndex={-1}>
          Your cart is empty
        </h1>
        <p className="cart__empty-text">Find the mattress that fits the way you sleep.</p>
        <Link className="button cart__continue" href="/">
          Continue shopping
        </Link>
        <p className="visually-hidden" role="status" aria-live="polite">
          {status}
        </p>
      </section>
    )
  }

  function handleQuantity(line: (typeof priced.lines)[number], quantity: number) {
    if (quantity === line.quantity) return
    setQuantity(line.product.id, quantity)
    const total = priced.subtotalCents + (quantity - line.quantity) * line.product.priceCents
    setStatus(`${line.product.name} quantity ${quantity}. Cart total ${money(total)}`)
  }

  function handleRemove(index: number) {
    const line = priced.lines[index]
    const neighbor = priced.lines[index + 1] ?? priced.lines[index - 1]
    pendingFocus.current = neighbor ? neighbor.product.id : 'heading'
    removeItem(line.product.id)
    setStatus(
      `Removed ${line.product.name}. Cart total ${money(priced.subtotalCents - line.lineTotalCents)}`,
    )
  }

  return (
    <section className="cart" aria-labelledby="cart-title">
      <h1 id="cart-title" className="cart__title" ref={headingRef} tabIndex={-1}>
        Your Cart
      </h1>

      <ul className="cart__lines">
        {priced.lines.map((line, index) => {
          const { product } = line
          return (
            <li key={product.id} className="cart-line">
              <div className="cart-line__media">
                <Image
                  src={product.imageUrl}
                  alt=""
                  fill
                  loading={index === 0 ? 'eager' : undefined}
                  sizes="(min-width: 768px) 160px, 96px"
                  className="cart-line__image"
                />
              </div>
              <div className="cart-line__details">
                <Link className="cart-line__name" href={`/?product=${product.id}`}>
                  {product.name} Mattress
                </Link>
                <PriceTag
                  priceCents={product.priceCents}
                  compareAtPriceCents={product.compareAtPriceCents}
                  currency={product.currency}
                />
              </div>
              <div className="cart-line__quantity">
                <QuantityStepper
                  name={product.name}
                  quantity={line.quantity}
                  onChange={(q) => handleQuantity(line, q)}
                />
                <button
                  type="button"
                  className="cart-line__remove"
                  aria-label={`Remove ${product.name} from cart`}
                  ref={(el) => {
                    if (el) removeRefs.current.set(product.id, el)
                    else removeRefs.current.delete(product.id)
                  }}
                  onClick={() => handleRemove(index)}
                >
                  Remove
                </button>
              </div>
              <div className="cart-line__total">
                <span className="visually-hidden">Line total </span>
                {money(line.lineTotalCents)}
              </div>
            </li>
          )
        })}
      </ul>

      <aside className="cart-summary" aria-label="Order summary">
        <dl className="cart-summary__rows">
          <div className="cart-summary__row">
            <dt>Items</dt>
            <dd>{priced.count}</dd>
          </div>
          <div className="cart-summary__row cart-summary__row--total">
            <dt>Subtotal</dt>
            <dd>{money(priced.subtotalCents)}</dd>
          </div>
        </dl>
        <p className="cart-summary__note">Shipping and taxes calculated at checkout</p>
        <Link className="cart-summary__continue" href="/">
          Continue shopping
        </Link>
      </aside>

      <p className="visually-hidden" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  )
}
