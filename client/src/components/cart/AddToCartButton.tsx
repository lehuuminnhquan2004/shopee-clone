import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { useAuth } from "../../auth/AuthContext";
import { addCartItem } from "../../api/cartApi";
import { getApiErrorMessage } from "../../lib/api";
import type { ModelProductDetailData } from "../../types/product";
import CartToast from "../CartToast";
import './AddToCartButton.css'

type AddToCartButtonProps = {
    selectedModel: ModelProductDetailData | undefined;
    quantity: number;
    hasVariants: boolean;
};

type CartNotice = {
    modelId: string | undefined;
    userId: string;
    quantity: number;
    kind: "success" | "error";
    message: string;
};


export default function AddToCartButton({
    selectedModel,
    quantity = 1,
    hasVariants
}: AddToCartButtonProps) {
    const { session } = useAuth();
    const navigate = useNavigate();

    const [notice, setNotice] = useState<CartNotice | null>(null)
    const [adding, setAdding] = useState(false);

    const submittingRef = useRef(false);

    const closeNotice = useCallback(() => setNotice(null), []);

    async function handleAddToCart() {
        if (submittingRef.current) return;

        if (!session) {
            navigate("/auth")
            return;
        }
        setNotice(null);

        const userId = session.user.id;
        if (!selectedModel) {
            setNotice({
                modelId: undefined,
                userId,
                quantity,
                kind: "error",
                message: hasVariants ? "Vui lòng chọn phân loại đầy đủ" : "Sản phẩm hiện chưa có mẫu sẵn để mua"
            })
            return
        }
        if (
            !Number.isInteger(quantity) ||
            quantity <= 0 ||
            quantity > 2147483647
        ) {
            setNotice({
                modelId: selectedModel.id,
                userId,
                quantity,
                kind: "error",
                message: "vui lòng chọn số lượng hợp lệ"
            })
            return
        }
        const modelId = selectedModel.id;
        submittingRef.current = true;
        setAdding(true);

        try {
            const data = await addCartItem({
                modelId,
                quantity
            })
            setNotice({
                modelId,
                userId,
                quantity,
                kind: "success",
                message: `Đã thêm ${quantity} sản phẩm thành công hiện có ${data.item.quantity} sản phẩm này trong giỏ`
            })
        } catch (error) {
            if (axios.isCancel(error)) return;
            setNotice({
                modelId,
                userId,
                quantity,
                kind: "error",
                message: getApiErrorMessage(
                    error,
                    "Không thể thêm vào giỏ hàng. Vui lòng thử lại.",
                ),
            });
        } finally {
            submittingRef.current = false;
            setAdding(false);
        }
    }

    // Không hiển thị thông báo của biến thể hoặc tài khoản trước.
    const visibleNotice =
        notice?.modelId === selectedModel?.id &&
            notice?.userId === session?.user.id
            ? notice
            : null;
    return (

        <div className="product-detail-cart">
            <button
                type="button"
                className="product-detail-actions-add-to-cart"
                disabled={adding}
                onClick={() => void handleAddToCart()}
            >
                {adding ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </button>

            {visibleNotice && (
                <CartToast
                    message={visibleNotice.message}
                    kind={visibleNotice.kind}
                    onClose={closeNotice}
                />
            )}
        </div>
    );

}