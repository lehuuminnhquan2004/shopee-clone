import { Link, useParams } from 'react-router'
import type { ProductDetailData } from '../types/product';
import { useEffect, useState } from 'react';
import './ProductDetailPage.css'

export default function ProductDetailPage() {
    const { productId } = useParams();
    const [product, setProduct] = useState<ProductDetailData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

    useEffect(() => {
        let ignore = false
        if (!productId) return

        async function loadProductDetail() {
            setLoading(true)
            setError(null)
            setProduct(null)
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products/${productId}`)
                if (!response.ok) {
                    throw new Error('Không lấy được data sản phẩm')
                }
                const data: ProductDetailData = await response.json()
                if (!ignore) setProduct(data)
            } catch (err) {
                if (!ignore) {
                    setError(err instanceof Error ? err.message : "Lỗi không xác định")
                }
            } finally {
                if (!ignore) setLoading(false)
            }

        }
        loadProductDetail()
        return () => { ignore = true };

    }, [productId])


    const activeImage = product?.images.find((image) => image.id === selectedImageId) ?? product?.images[0]
    return (
        <section className='product-detail'>
            <div>
                <Link to={'/'}>Trang chủ</Link>
                {loading && <p>Loading...</p>}
                {!loading && error && <p>{error}</p>}
                {!loading && !error && product && (
                    <div className="product-detail-layout">
                        <div className="product-detail-gallery">
                            {activeImage ? (
                                <img
                                    className='product-detail-main-image'
                                    src={activeImage.url}
                                    alt={product.name} />
                            ) : (
                                <p>Sản phẩm chưa có ảnh</p>
                            )}

                            {product.images.length > 1 && (
                                <div className='product-detail-thumbnails' aria-label='Ảnh sản phẩm'>
                                    {product.images.map((image, index) => (
                                        <button
                                            key={image.id}
                                            className={`product-detail-thumbnail ${activeImage?.id === image.id ? "is-active" : ""}`}
                                            onClick={() => setSelectedImageId(image.id)}
                                            type='button'
                                            aria-label={`Xem ảnh ${index + 1}`}
                                            aria-pressed={activeImage?.id === image.id}
                                        >
                                            <img src={image.url} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="product-detail-info">
                            <h1>{product.name}</h1>
                            <p>
                                {product.ratingAvg} ★ · {product.ratingCount} đánh giá ·
                                Đã bán {product.soldCount}
                            </p>
                            <p className="product-detail-price">
                                {BigInt(product.minPrice).toLocaleString('vi-VN')}₫
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}