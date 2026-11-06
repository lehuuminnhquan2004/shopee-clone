import { Link } from "react-router";
import { formatVnd } from "../../lib/format";
import type { ShopGroup } from "../../pages/CartPage";
import "./CartShopGroup.css";

type Props = {
    group: ShopGroup,
    isUpdating: boolean,
    onSelectedChange: (itemId: string, selected: boolean) => void;
}

export function CartShopGroup({ group,isUpdating, onSelectedChange }: Props) {
    return (
        <section className="cart-shop">
        <h2>{group.shop.name}</h2>
            {group.items.map((item) => (
                <article
                    className={`cart-item ${item.canCheckout ? "" : "cart-item--unavailable"
                        }`}
                    key={item.id}
                >
                    <input
                        type="checkbox"
                        checked={item.selected}
                        disabled={isUpdating ||(!item.canCheckout && !item.selected)}
                        aria-label={`Chọn ${item.product.name}`}
                        onChange={(event) => {
                            onSelectedChange(item.id, event.target.checked)
                        }}
                    />
                    <img
                        className="cart-item__image"
                        src={
                            item.product.imageUrl ??
                            "https://cdn.tgdd.vn/2020/03/GameApp/unnamed-200x200-3.png"
                        }
                        alt={item.product.name}
                    />

                    <div className="cart-item__content">
                        <Link to={`/products/${item.product.id}`}>
                            <h3>{item.product.name}</h3>
                        </Link>

                        {item.model.name && (
                            <p>Phân loại: {item.model.name}</p>
                        )}

                        <p>
                            Đơn giá: {formatVnd(item.model.price)}
                        </p>

                        <p>Số lượng: {item.quantity}</p>

                        <strong>
                            Thành tiền: {formatVnd(item.lineTotal)}
                        </strong>

                        {!item.canCheckout && (
                            <p className="cart-item__warning" role="alert">
                                {item.unavailableReason ??
                                    "Sản phẩm hiện không thể mua"}
                            </p>
                        )}
                    </div>
                </article>
            ))}
        </section>

    )
}
