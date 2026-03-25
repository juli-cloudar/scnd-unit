export const revalidate = 0
export const dynamic = 'force-dynamic'

// WICHTIG: supabaseServer statt supabase importieren!
import { supabaseServer } from '@/lib/supabase'
import { ProductClient } from './ProductClient'

interface Product {
  id: number
  name: string
  category: string
  price: string
  size: string
  condition: string
  images: string[]
  vinted_url: string
  sold: boolean
}

async function getProducts(): Promise<Product[]> {
  // supabaseServer verwenden!
  const { data, error } = await supabaseServer
    .from('products')
    .select('*')
    .eq('sold', false)
    .order('id', { ascending: false })
  
  if (error) {
    console.error('Supabase Error:', error)
    return []
  }
  
  return data || []
}

export default async function Page() {
  const products = await getProducts()
  return <ProductClient initialProducts={products} />
}
