import { api } from '../lib/api'
import type { CategoryCardData, CategoryChild } from '../types/category'

export async function getCategories(): Promise<CategoryCardData[]> {
  const { data } = await api.get<CategoryCardData[]>('/api/categories')
  return data
}

export async function getCategoryById(categoryId: string): Promise<CategoryChild> {
  const { data } = await api.get<CategoryChild>(`/api/categories/${categoryId}`)
  return data
}

export async function getCategoryChildren(categoryId: string): Promise<CategoryChild[]> {
  const { data } = await api.get<CategoryChild[]>(`/api/categories/${categoryId}/children`)
  return data
}
