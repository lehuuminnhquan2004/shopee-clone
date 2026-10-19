import { Link, useParams } from 'react-router'
import type { ProductDetailData } from '../types/product';
import { useEffect, useState } from 'react';

export default function ProductDetailPage() {
    const { productId } = useParams();
    const [product, setProduct] = useState<ProductDetailData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let ignore = false
        if (!productId) return

        async function loadProductDetail() {
            setLoading(true)
            setError(null)
            setProduct(null)
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${productId}`)
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
                setLoading(false);
            }

        }
        loadProductDetail()
        return()=>{ignore=true};

    }, [producId])



    return(
        <section>
            <div>
                <Link to={'/'}>Trang chủ</Link>
                {loading&&<p>Loading...</p>}
                {!loading && error &&<p>{error}</p>}
                {!loading && !error && product &&(
                    <>
                        <p>{product.name}</p>
                        <p>{product.description??"Không có mô tả sản phẩm"}</p>
                    </>
                )}
            </div>
        </section>
    )
}