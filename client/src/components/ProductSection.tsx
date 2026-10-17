import { useEffect, useState } from 'react'
import type { ProductCardData } from '../types/product'
import ProductCard from './ProductCard'
import './ProductSection.css'

type ProductSectionProps = {
  searchTerm: string
}

export default function ProductSection({ searchTerm }: ProductSectionProps) {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const keyword = searchTerm.trim().toLowerCase()
  const filteredProducts = products.filter((product) =>
    product.name.trim().toLowerCase().includes(keyword),
  )

  useEffect(() => {
    let ignore = false

    async function fetchProducts() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products`)
        if (!response.ok) {
          throw new Error(`Không lấy được sản phẩm (status=${response.status})`)
        }

        const data: ProductCardData[] = await response.json()
        if (!ignore) {
          setProducts(data)
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

    fetchProducts()
    return () => {
      ignore = true
    }
  }, [retryCount])

  return (
    <section className="product-section">
      {loading && <p>Đang tải sản phẩm...</p>}

      {!loading && error && (
        <div>
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p>Không có sản phẩm</p>
      )}

      {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
        <p>Không tìm thấy sản phẩm</p>
      )}

      {!loading && !error && filteredProducts.length > 0 && (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
