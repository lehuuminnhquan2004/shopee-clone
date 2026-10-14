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
                <div><img src={product.images[1].url}/></div>
                {product.description && <p>{product.description}</p>}
                
            </article>
        
    )
}