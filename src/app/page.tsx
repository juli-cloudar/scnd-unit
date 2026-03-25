// src/app/page.tsx - SERVER COMPONENT
export const revalidate = 0
export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { ProductClient } from './ProductClient'
import { ReactElement } from 'react'

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
  const { data, error } = await supabase
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

// Option 1: Mit ReactElement (empfohlen)
export default async function Page(): Promise<ReactElement> {
  const products = await getProducts()
  return <ProductClient initialProducts={products} />
}

// Option 2: Oder ganz ohne Type-Annotation (einfacher)
// export default async function Page() {
//   const products = await getProducts()
//   return <ProductClient initialProducts={products} />
// }
