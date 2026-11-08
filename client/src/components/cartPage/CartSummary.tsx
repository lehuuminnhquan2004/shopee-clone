import { useEffect, useRef } from "react";
import { formatVnd } from "../../lib/format";
import type { CartResponse } from "../../types/cart";
import "./CartSummary.css";
type Props = {
  summary: CartResponse["summary"];
  isUpdating: boolean;
  allSelected: boolean;
  partiallySelected: boolean;
  onSelectAll: (selected: boolean) => Promise<void>;
};
export function CartSummary({
  summary,
  isUpdating,
  allSelected,
  partiallySelected,
  onSelectAll,
}: Props) {
  const selectAllRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partiallySelected;
    }

  }, [partiallySelected])

  return (
    <aside className="cart-summary">
      <label className="cart-summary__select-all">
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={allSelected}
          disabled={isUpdating || summary.itemCount === 0}
          onChange={(event) => {
            void onSelectAll(event.currentTarget.checked);
          }}
        />

        <span>Chọn tất cả ({summary.itemCount})</span>
      </label>
      <p>Số sản phẩm đã chọn: {summary.selectedQuantity}</p>
      <strong>Tạm tính: {formatVnd(summary.selectedSubtotal)}</strong>
      <button type="button" disabled={
        isUpdating ||
        summary.selectedQuantity === 0
      }>Mua hàng</button>
    </aside>
  );
}
