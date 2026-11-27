import { Link } from "react-router";
import type { CreateCheckoutResponse } from "../../types/checkout";
import CartToast from "../CartToast";
import { formatVnd } from "../../lib/format";
import './CheckoutSuccess.css'


type CheckoutSuccessProps = {
    checkoutResult: CreateCheckoutResponse,
    showSuccessToast: boolean
    onCloseToast: () => void,
}

export function CheckoutSuccess({
    checkoutResult,
    showSuccessToast,
    onCloseToast
}: CheckoutSuccessProps
) {
    return (
        <section className="checkout-page">
            {showSuccessToast && (
                <CartToast
                    kind="success"
                    message={checkoutResult.message}
                    onClose={onCloseToast}
                />
            )}
            <div className="success-wrap">
                <div className="success-card">
                    <div className="success-icon">✓</div>
                    <h1>Đặt hàng thành công!</h1>
                    <p className="success-sub">
                        Cảm ơn bạn đã mua sắm. Shop sẽ sớm xác nhận đơn hàng.
                    </p>

                    <dl className="success-info">
                        <div><dt>Mã thanh toán</dt><dd>{checkoutResult.checkout.checkoutCode}</dd></div>
                        <div><dt>Phương thức</dt><dd>Thanh toán khi nhận hàng</dd></div>
                        <div className="total"><dt>Tổng thanh toán</dt><dd>{formatVnd(checkoutResult.checkout.grandTotal)}</dd></div>
                    </dl>

                    <div className="success-actions">
                        <Link to="/orders" className="btn-primary">Xem đơn hàng</Link>
                        <Link to="/" className="btn-outline">Tiếp tục mua sắm</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}