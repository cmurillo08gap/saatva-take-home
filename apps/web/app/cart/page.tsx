import type { Metadata } from 'next'
import type { Product } from '@saatva/contracts'
import { CartUnavailable } from '@/components/CartUnavailable'
import { CartView } from '@/components/CartView'
import { getProducts } from '@/lib/api'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Saatva | Your Cart',
}

export default async function CartPage() {
  let products: Product[] = []
  try {
    products = await getProducts()
  } catch (error) {
    console.error(error)
  }

  // Never prune against an empty list: the stored cart stays untouched.
  if (products.length === 0) return <CartUnavailable />

  return <CartView products={products} />
}
