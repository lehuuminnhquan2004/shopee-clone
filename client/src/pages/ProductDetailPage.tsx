import {Link, useParams} from 'react-router'
import {products} from '../data/products'

export default function ProductDetailPage(){
        const productId=useParams().productId;

        const product=products.find((item)=>
            item.id===Number(productId)
        )
            if(!product){
                return(
                    <section>
                        <Link to="/">Trang chủ</Link>
                        <h3>Không tìm thấy sản phẩm</h3>
                    </section>
                )
                
            }else{
                return(
                    <section>
                        <Link to="/">Trang chủ</Link>
                        <h3>{product.name}</h3>
                        {!product.description && <p>{product.description}</p>}
                        <p>Mã shop: {product.shopId}</p>
                        <select aria-label={`Chọn biến thể cho ${product.name}`}>
                                    {product.variants.map((variant)=>{
                                    return(
                                        <option key={variant.id} value={variant.id}>
                                        {variant.color} {variant.size} {variant.price} {variant.stock>0?variant.stock:"hết hàng"}
                                        </option>
                                    )
                                    })}
                        </select>
                    </section>
                )
                
            }
}