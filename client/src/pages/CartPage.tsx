import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { CartItem, CartResponse } from "../types/cart";
import { getCartItems } from "../api/cartApi";
import { getApiErrorMessage } from "../lib/api";
import { Link } from "react-router";
import './CartPage.css'

function formatVnd(value: string): string {
    return `${BigInt(value).toLocaleString("vi-VN")}₫`;
}

type ShopGroup = {
    shop: CartItem["shop"];
    items: CartItem[];
};
function groupByShop(items: CartItem[]): ShopGroup[] {
    const map = new Map<string, ShopGroup>()

    for (const item of items) {
        const group = map.get(item.shop.id)
        if (group) {
            group.items.push(item)
        } else {
            map.set(item.shop.id, { shop: item.shop, items: [item] })
        }

    }
    return Array.from(map.values());
}

export function CartPage() {
    const { session } = useAuth();

    const [cart, setCart] = useState<CartResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session) return;
        let ignore = false;

        async function loadCart() {
            setLoading(true);
            setError(null)

            try {
                const data = await getCartItems();

                if (!ignore) setCart(data);

            } catch (error) {
                if (!ignore) {
                    setError(getApiErrorMessage(error, "Không lấy được danh sách giỏ hàng"))
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        loadCart();

        return () => {
            ignore = true;
        }
    }, [session])


    if (loading) {
        return <p role="status">Đang tải giỏ hàng...</p>;
    }

    if (loading) {
        return <p role="status">Đang tải giỏ hàng...</p>;
    }

    if (error) {
        return (
            <section className="cart-page">
                <h1>Giỏ hàng</h1>
                <p role="alert">{error}</p>
            </section>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <section className="cart-page">
                <h1>Giỏ hàng</h1>
                <p>Giỏ hàng của bạn đang trống.</p>
                <Link to="/">Tiếp tục mua sắm</Link>
            </section>
        );
    }
    const groups = groupByShop(cart.items)
    return (
        <section className="cart-page">
            <h1>Giỏ hàng</h1>

            {groups.map((group) => (
                <section className="cart-shop" key={group.shop.id}>
                    <h2>{group.shop.name}</h2>

                    {group.items.map((item) => (
                        <article
                            className={`cart-item ${item.canCheckout ? "" : "cart-item--unavailable"
                                }`}
                            key={item.id}
                        >
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
            ))}

            <aside className="cart-summary">
                <p>
                    Số sản phẩm đã chọn: {cart.summary.selectedQuantity}
                </p>

                <strong>
                    Tạm tính: {formatVnd(cart.summary.selectedSubtotal)}
                </strong>

                <button
                    type="button"
                    disabled={cart.summary.selectedQuantity === 0}
                >
                    Mua hàng
                </button>
            </aside>
        </section>
    );
}