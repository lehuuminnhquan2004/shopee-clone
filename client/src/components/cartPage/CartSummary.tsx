import { formatVnd } from "../../lib/format";
import type { CartResponse } from "../../types/cart";
import "./CartSummary.css";
type Props = {
  summary: CartResponse["summary"];
  updatingItemId: string|null;
}
export function CartSummary({ summary, updatingItemId }: Props) {
  return (
    <aside className="cart-summary">
      <p>Số sản phẩm đã chọn: {summary.selectedQuantity}</p>
      <strong>Tạm tính: {formatVnd(summary.selectedSubtotal)}</strong>
      <button type="button" disabled={
        updatingItemId !== null ||
        summary.selectedQuantity === 0
      }>Mua hàng</button>
    </aside>
  );
}
