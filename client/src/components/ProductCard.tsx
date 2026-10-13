import type {Product} from "../types/product"
import { Link } from "react-router";

type ProductCardProps={
    product:Product;
};

export default function ProductCard({product}:ProductCardProps){
    return (
            <article className="product-card">
                <Link to={`/products/${product.id}`}>
                    <h3>{product.name}</h3>
                </Link>
                {product.description && <p>{product.description}</p>}
                <select aria-label={'Chọn biến thể'}>
                            {product.variants.map((variant)=>{
                            return(
                                <option key={variant.id} value={variant.id}>
                                {variant.color} {variant.size} {variant.price} {variant.stock>0?variant.stock:"hết hàng"}
                                </option>
                            )
                            })}
                </select>
            </article>
        
    )
}