import { Link } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { getCheckoutPreview } from "../api/checkoutApi";
import { getApiErrorMessage } from "../lib/api";
import { formatVnd } from "../lib/format";
import type { CheckoutPreview } from "../types/checkout";
import "./CheckoutPage.css";
import { useEffect, useState } from "react";
import axios from "axios";

export default function CheckoutPage() {
    const { session } = useAuth();
    const userId = session?.user.id;

    const [preview, setPreview] = useState<CheckoutPreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        const controller = new AbortController();

        async function loadPreview() {
            setLoading(true);
            setError(null);

            try {
                const data = await getCheckoutPreview(controller.signal);

                if (controller.signal.aborted) return;

                setPreview(data);
            } catch (error) {
                if (
                    controller.signal.aborted ||
                    axios.isCancel(error)
                ) {
                    return;
                }

                setError(
                    getApiErrorMessage(
                        error,
                        "Không thể tải thông tin thanh toán.",
                    ),
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadPreview();

        return () => controller.abort();
    }, [userId, retryCount]);

    if (loading) {
        return <p role="status">Đang tải thông tin thanh toán...</p>;
    }

    if (error) {
        return (
            <section className="checkout-page">
                <h1>Thanh toán</h1>
                <p role="alert">{error}</p>

                <div className="checkout-page__actions">
                    <button
                        type="button"
                        onClick={() =>
                            setRetryCount((count) => count + 1)
                        }
                    >
                        Thử lại
                    </button>

                    <Link to="/cart">Quay lại giỏ hàng</Link>
                </div>
            </section>
        );
    }

    if (!preview) {
        return <p>Chưa có thông tin thanh toán.</p>;
    }

    const { address, groups, summary } = preview;

    return (
        <section
            className="checkout-page"
            aria-labelledby="checkout-title"
        >
            <h1 id="checkout-title">Thanh toán</h1>

            <div className="checkout-panel checkout-address">
                <h2>Địa chỉ nhận hàng</h2>

                {address ? (
                    <>
                        <p>
                            <strong>{address.receiverName}</strong>
                            {" · "}
                            {address.receiverPhone}
                        </p>

                        <p>
                            {address.addressDetail},{" "}
                            {address.ward.name},{" "}
                            {address.province.name}
                        </p>

                        {address.isDefault && (
                            <span className="checkout-address__badge">
                                Mặc định
                            </span>
                        )}

                        <p>
                            <Link to="/account/address">
                                Quản lý địa chỉ
                            </Link>
                        </p>
                    </>
                ) : (
                    <>
                        <p>Bạn chưa có địa chỉ nhận hàng.</p>
                        <Link to="/account/address">
                            Thêm địa chỉ
                        </Link>
                    </>
                )}
            </div>

            {groups.map((group) => (
                <article
                    key={group.shop.id}
                    className="checkout-panel checkout-shop"
                >
                    <h2>{group.shop.name}</h2>

                    <ul className="checkout-shop__items">
                        {group.items.map((item) => (
                            <li
                                key={item.cartItemId}
                                className="checkout-item"
                            >
                                {item.product.imageUrl ? (
                                    <img
                                        className="checkout-item__image"
                                        src={item.product.imageUrl}
                                        alt={item.product.name}
                                    />
                                ) : (
                                    <div className="checkout-item__placeholder">
                                        Chưa có ảnh
                                    </div>
                                )}

                                <div className="checkout-item__info">
                                    <Link to={`/products/${item.product.id}`}>
                                        {item.product.name}
                                    </Link>

                                    {item.model.name && (
                                        <p>Phân loại: {item.model.name}</p>
                                    )}

                                    <p>
                                        Đơn giá: {formatVnd(item.unitPrice)}
                                    </p>
                                </div>

                                <p className="checkout-item__quantity">
                                    Số lượng: {item.quantity}
                                </p>

                                <strong className="checkout-item__total">
                                    {formatVnd(item.lineTotal)}
                                </strong>
                            </li>
                        ))}
                    </ul>

                    <p className="checkout-shop__total">
                        Tổng tiền của shop:{" "}
                        <strong>{formatVnd(group.totalAmount)}</strong>
                    </p>
                </article>
            ))}

            <div className="checkout-panel checkout-payment">
                <h2>Phương thức thanh toán</h2>
                <p>Thanh toán khi nhận hàng (COD)</p>
            </div>

            <div className="checkout-panel checkout-summary">
                <h2>Chi tiết thanh toán</h2>

                <dl className="checkout-summary__amounts">
                    <div>
                        <dt>Tiền hàng ({summary.totalQuantity} sản phẩm)</dt>
                        <dd>{formatVnd(summary.subtotal)}</dd>
                    </div>

                    <div>
                        <dt>Phí vận chuyển</dt>
                        <dd>{formatVnd(summary.shippingTotal)}</dd>
                    </div>

                    <div>
                        <dt>Giảm giá</dt>
                        <dd>{formatVnd(summary.discountTotal)}</dd>
                    </div>

                    <div className="checkout-summary__grand-total">
                        <dt>Tổng thanh toán</dt>
                        <dd>{formatVnd(summary.grandTotal)}</dd>
                    </div>
                </dl>

                {!preview.canPlaceOrder && (
                    <p role="status">
                        Vui lòng thêm địa chỉ nhận hàng để tiếp tục.
                    </p>
                )}
            </div>
        </section>
    );
}