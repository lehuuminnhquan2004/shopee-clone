import { api } from '../lib/api'
import type { ProductCardData, ProductDetailData } from '../types/product'

export async function getProducts(): Promise<ProductCardData[]> {
  const { data } = await api.get<ProductCardData[]>('/api/products')
  return data
}

export async function getCategoryProducts(categoryId: string): Promise<ProductCardData[]> {
  const { data } = await api.get<ProductCardData[]>(`/api/products/${categoryId}/products`)
  return data
}

export async function getProductById(productId: string): Promise<ProductDetailData> {
  const { data } = await api.get<ProductDetailData>(`/api/products/${productId}`)
  return data
}
