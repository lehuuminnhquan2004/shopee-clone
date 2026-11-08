import { Link } from "react-router";
import { formatVnd } from "../../lib/format";
import type { ShopGroup } from "../../pages/CartPage";
import "./CartShopGroup.css";
import { CartItemQuantity } from "./CartItemQuantity";


type Props = {
    group: ShopGroup,
    isUpdating: boolean,
    onSelectedChange: (itemId: string, selected: boolean) => void;
    onQuantityChange: (itemId: string, quantity: number,) => Promise<boolean>;
    onDeleteItem: (itemId: string) => void;
}


export function CartShopGroup({
    group,
    isUpdating,
    onSelectedChange,
    onQuantityChange,
    onDeleteItem
}: Props) {
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
                        className="cart-checkbox"
                        checked={item.selected}
                        disabled={isUpdating}
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
                        <div className="cart-item__name">
                            <Link to={`/products/${item.product.id}`} title={item.product.name}>
                                <h3>{item.product.name}</h3>
                            </Link>
                        </div>
                        <div className="cart-item__model">
                            {item.model.name && (
                                <p>Phân loại: {item.model.name}</p>
                            )}
                        </div>
                        <div className="cart-item__price">
                            <p>
                                {formatVnd(item.model.price)}
                            </p>
                        </div>
                        <CartItemQuantity
                            key={`${item.id}`}
                            value={item.quantity}
                            max={item.availableStock}
                            disabled={isUpdating}
                            onSave={(quantity) => onQuantityChange(item.id, quantity)}
                        />
                        <div className="cart-item__total-price">
                            <p>
                                <strong>
                                    {formatVnd(item.lineTotal)}
                                </strong>
                            </p>
                        </div>
                        {!item.canCheckout && (
                            <p className="cart-item__warning" role="alert">
                                {item.unavailableReason ??
                                    "Sản phẩm hiện không thể mua"}
                            </p>
                        )}
                        <div className="cart-item__actions">
                            <button
                                className="delete-item"
                                onClick={() => onDeleteItem(item.id)}
                                disabled={isUpdating}
                            >Xóa</button>
                        </div>
                    </div>
                </article>
            ))}
        </section>

    )
}
