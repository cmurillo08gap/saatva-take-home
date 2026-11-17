import type { Product } from '@saatva/contracts'
import { ProductConfigurator } from '@/components/ProductConfigurator'
import { ProductsUnavailable } from '@/components/ProductsUnavailable'
import { getProducts } from '@/lib/api'

type HomePageProps = {
  searchParams: Promise<{ product?: string | string[] }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { product } = await searchParams
  const initialProductId = Array.isArray(product) ? product[0] : product

  let products: Product[] = []
  try {
    products = await getProducts()
  } catch (error) {
    // Log for operators; shoppers only get the friendly message.
    console.error(error)
  }

  if (products.length === 0) return <ProductsUnavailable />

  return <ProductConfigurator products={products} initialProductId={initialProductId} />
}
