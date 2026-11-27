import { Link } from "react-router";
import { useAuth } from "../auth/AuthContext";
import {
    createCheckout,
    getCheckoutPreview,
} from "../api/checkoutApi";

import { getApiErrorMessage } from "../lib/api";
import { formatVnd } from "../lib/format";
import type {
    CheckoutPreview,
    CreateCheckoutPayload,
    CreateCheckoutResponse,
} from "../types/checkout";
import "./CheckoutPage.css";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { CheckoutSuccess } from "../components/checkout/CheckoutSuccess";

export default function CheckoutPage() {
    const { session } = useAuth();
    const userId = session?.user.id;

    const [preview, setPreview] = useState<CheckoutPreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const [showSuccessToast, setShowSuccessToast] = useState(false);

    //State cho nut mua hang
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [needsReload, setNeedsReload] = useState(false);

    const [checkoutResult, setCheckoutResult] =
        useState<CreateCheckoutResponse | null>(null);

    // Chặn nhấn liên tiếp ngay lập tức.
    const submittingRef = useRef(false);

    // Chặn gửi thêm sau khi đã nhận kết quả thành công.
    const completedRef = useRef(false);

    // Giữ nguyên cả key và dữ liệu khi thử lại.
    const pendingPayloadRef =
        useRef<CreateCheckoutPayload | null>(null);

    // Không cập nhật giao diện sau khi rời trang.
    const mountedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    //Xử lý sự kiện ấn nút mua hàng tạo đơn
    async function handlePlaceOrder() {
        if (
            !userId ||
            submittingRef.current ||
            completedRef.current ||
            loading ||
            error ||
            needsReload
        ) {
            return;
        }

        submittingRef.current = true;
        setSubmitting(true);
        setSubmitError(null);

        try {
            // Chỉ tạo payload khi chưa có yêu cầu đang chờ kết quả.
            if (!pendingPayloadRef.current) {
                if (!preview?.address || !preview.canPlaceOrder) {
                    setSubmitError(
                        "Vui lòng kiểm tra địa chỉ nhận hàng.",
                    );
                    return;
                }

                const items = preview.groups.flatMap((group) =>
                    group.items.map((item) => ({
                        cartItemId: item.cartItemId,
                        quantity: item.quantity,
                        expectedUnitPrice: item.unitPrice,
                    })),
                );

                if (items.length === 0 || items.length > 100) {
                    setSubmitError(
                        "Mỗi lần đặt hàng cần từ 1 đến 100 dòng sản phẩm.",
                    );
                    return;
                }

                pendingPayloadRef.current = {
                    idempotencyKey: crypto.randomUUID(),
                    addressId: preview.address.id,
                    paymentMethod: "cod",
                    items,
                    expectedGrandTotal: preview.summary.grandTotal,
                };
            }

            const result = await createCheckout(
                pendingPayloadRef.current,
            );
            // Thông báo cho cart Header tải lại số lượng ở giỏ hàng.
            window.dispatchEvent(new Event("cart-updated"));

            if (!mountedRef.current) return;

            completedRef.current = true;
            pendingPayloadRef.current = null;

            setCheckoutResult(result);
            setShowSuccessToast(true);
        } catch (error) {
            if (!mountedRef.current) return;

            const code = axios.isAxiosError<{ code?: unknown }>(error)
                ? error.response?.data?.code
                : undefined;

            // Lỗi do dữ liệu đã thay đổi không cố thử lại
            const reloadCodes = [
                "ADDRESS_UNAVAILABLE",
                "CART_CHANGED",
                "QUANTITY_CHANGED",
                "PRODUCT_UNAVAILABLE",
                "INVALID_PRODUCT_PRICE",
                "PRICE_CHANGED",
                "INSUFFICIENT_STOCK",
                "AMOUNT_LIMIT_EXCEEDED",
                "TOTAL_CHANGED",
            ];

            if (
                typeof code === "string" &&
                reloadCodes.includes(code)
            ) {
                pendingPayloadRef.current = null;
                setNeedsReload(true);

                setSubmitError(
                    getApiErrorMessage(
                        error,
                        "Thông tin đặt hàng đã thay đổi. Vui lòng tải lại.",
                    ),
                );
            } else {
                // Mất mạng, timeout, lỗi server hoặc yêu cầu thử lại:
                // giữ nguyên payload,không tự tạo key mới.
                setSubmitError(
                    getApiErrorMessage(
                        error,
                        "Chưa nhận được kết quả đặt hàng. Vui lòng thử lại yêu cầu.",
                    ),
                );
            }
        } finally {
            submittingRef.current = false;

            if (mountedRef.current) {
                setSubmitting(false);
            }
        }
    }

    //Xử lý trường hợp thông tin đơn hàng thay đổi cần reload checkout
    function handleReloadCheckout() {
        if (
            submittingRef.current ||
            completedRef.current ||
            !needsReload
        ) {
            return;
        }

        pendingPayloadRef.current = null;
        setSubmitError(null);
        setNeedsReload(false);

        // Chặn đặt hàng bằng preview cũ trong lúc chờ effect chạy.
        setLoading(true);
        setRetryCount((count) => count + 1);
    }

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

    //Hàm đóng toast truyền qua component con
    const closeSuccessToast = useCallback(() => {
        setShowSuccessToast(false)
    }, [])

    if (loading) {
        return <p role="status">Đang tải thông tin thanh toán...</p>;
    }

    if (checkoutResult) {
        return (
            <CheckoutSuccess
                checkoutResult={checkoutResult}
                showSuccessToast={showSuccessToast}
                onCloseToast={closeSuccessToast}
            />
        );
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

                {submitError && (
                    <p className="checkout-submit-error" role="alert">
                        {submitError}
                    </p>
                )}

                <div className="checkout-submit-actions">
                    {needsReload ? (
                        <button
                            type="button"
                            className="checkout-submit-button"
                            onClick={handleReloadCheckout}
                            disabled={submitting}
                        >
                            Tải lại thông tin thanh toán
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="checkout-submit-button"
                            onClick={handlePlaceOrder}
                            disabled={submitting || !preview.canPlaceOrder}
                            aria-busy={submitting}
                        >
                            {submitting
                                ? "Đang xử lý..."
                                : submitError
                                    ? "Thử lại yêu cầu đặt hàng"
                                    : "Đặt hàng"}
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}