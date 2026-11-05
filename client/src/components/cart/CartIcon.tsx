import { FiShoppingCart } from "react-icons/fi";
import './CartIcon.css'

type Props = { count: number };

export function CartIcon({ count }: Props) {
  return (
    <div className="header-cart">
      <a href="/cart" className="cart-icon" aria-label={`Giỏ hàng, ${count} sản phẩm`}>
        <FiShoppingCart size={28} color="#fff" />
        {count > 0 && <span className="cart-badge">{count > 99 ? "99+" : count}</span>}
      </a>
    </div>
  );
}