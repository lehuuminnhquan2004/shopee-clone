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
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})


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

    const selectedOptionsId = product?.tiers.map((tier) => selectedOptions[tier.id]) ?? [];
    const selectedModel =
        product && selectedOptionsId.every((id) => id !== undefined)
            ? (product.models.find((item) => item.optionKey === selectedOptionsId.join('-')))
            : undefined

    const selectedGalleryImage = product?.images.find((image) => image.id === selectedImageId) ?? null
    const firstTier = product?.tiers[0];
    const selectedFirstOption = firstTier?.options.find(
        (option) => option.id === selectedOptions[firstTier.id],
    );
    const activeImageUrl = selectedGalleryImage?.url ?? selectedFirstOption?.imageUrl ?? product?.images[0]?.url
    const activeImage = product?.images.find((item) => item.url === activeImageUrl);
    return (
        <section className='product-detail'>
            <div>
                <Link to={'/'}>Trang chủ</Link>
                {loading && <p>Loading...</p>}
                {!loading && error && <p>{error}</p>}
                {!loading && !error && product && (
                    <div className="product-detail-layout">
                        <div className="product-detail-gallery">
                            {activeImageUrl ? (
                                <img
                                    className='product-detail-main-image'
                                    src={activeImageUrl}
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
                                            aria-pressed={selectedGalleryImage?.id === image.id}
                                        >
                                            <img src={image.url} alt="" />
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
                                {BigInt(selectedModel ? selectedModel.price : product.minPrice).toLocaleString('vi-VN')}₫
                            </p>

                            {product.tiers.length > 0 && (
                                <div className='product-detail-variants'>
                                    {product.tiers.map((tier) => (
                                        <div key={tier.id} className='product-detail-variant-row'>
                                            <span className='product-detail-variant-label'>{tier.name}</span>
                                            <div className='product-detail-variant-options'>
                                                {tier.options.map((option) => {
                                                    const isSelected = option.id === selectedOptions[tier.id];
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            type='button'
                                                            className={`product-detail-variant-option ${isSelected ? 'is-active' : ''}`}
                                                            aria-pressed={isSelected}
                                                            onClick={() => {
                                                                setSelectedOptions((previous) => ({
                                                                    ...previous,
                                                                    [tier.id]: option.id,
                                                                }))
                                                                setSelectedImageId(null);
                                                            }}
                                                        >
                                                            {option.imageUrl && <img src={option.imageUrl} alt="" />}
                                                            <span>{option.value}</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className='product-detail-actions'>
                                <button className="product-detail-actions-add-to-cart">Thêm vào giỏ hàng</button>
                                <button className="product-detail-actions-buy-now">Mua ngay {BigInt(selectedModel ? selectedModel.price : product.minPrice).toLocaleString('vi-VN')}₫</button>
                            </div>
                        </div>


                    </div>
                )}
            </div>
        </section>
    )
}