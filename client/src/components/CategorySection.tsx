import { useEffect, useState } from 'react'
import type { CategoryCardData } from '../types/category'
import CategoryCard from './CategoryCard'
import './CategorySection.css'

export default function CategorySection() {
  const [categories, setCategories] = useState<CategoryCardData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let ignore = false

    async function fetchCategories() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`)
        if (!response.ok) {
          throw new Error(`Không lấy được danh mục (status=${response.status})`)
        }

        const data: CategoryCardData[] = await response.json()
        if (!ignore) {
          setCategories(data)
        }
      } catch (err) {
        if (!ignore) {
          console.error(err)
          setError(err instanceof Error ? err.message : 'Lỗi không xác định')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchCategories()
    return () => {
      ignore = true
    }
  }, [retryCount])

  return (
    <section className="category-section">
      <h2 className="category-section-title">DANH MỤC</h2>

      <div className="category-section-content">
        {loading && <p>Đang tải danh mục...</p>}

        {!loading && error && (
          <div>
            <p role="alert">{error}</p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <p>Danh mục đang trống</p>
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="category-grid-wrapper">
            <div className="category-grid">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
