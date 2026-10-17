import type { ProductCardData } from "../types/product"
import { Link } from "react-router";
import './ProductCard.css'

type ProductCardProps = {
    product: ProductCardData;
};

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <article className="product-card">
            <Link to={`/products/${product.id}`}>
                <div className="product-card-image" >
                    <img
                    src={product.imageUrl ?? 'https://cdn.tgdd.vn/2020/03/GameApp/unnamed-200x200-3.png'} />
                </div>
                <div className="product-card-body">
                    <h3 className="product-card-name">{product.name}</h3>
                    <p className="product-card-price">{product.minPrice}</p>
                </div>
            </Link>
        </article>

    )
}