import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { CartItem, CartResponse } from "../types/cart";
import { getCartItems, updateCartItemQuantity, updateCartItemSelected } from "../api/cartApi";
import { getApiErrorMessage } from "../lib/api";
import { Link } from "react-router";
import './CartPage.css'
import { CartShopGroup } from "../components/cartPage/CartShopGroup";
import { CartSummary } from "../components/cartPage/CartSummary";

export type ShopGroup = {
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
    const userId = session?.user.id;

    //state sử lý selected items
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const updatingRef = useRef(false);

    useEffect(() => {

        if (!userId) return;
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
    }, [userId, retryCount])

    //Bam chọn hoặc bỏ chọn sản phẩm
    async function handleSelectedChange(
        itemId: string,
        selected: boolean
    ): Promise<void> {
        if (!userId || updatingRef.current) return

        updatingRef.current = true;
        setUpdateError(null);
        setUpdatingItemId(itemId);

        let saved = false

        try {
            await updateCartItemSelected(itemId, selected)
            saved = true

            const updateCart = await getCartItems();
            setCart(updateCart)
        } catch (error) {
            if (saved) {
                setError("Đã lưu lựa chọn nhưng chưa tải lại được giỏ hàng. " +
                    "Vui lòng thử tải lại.",)
            } else {
                setUpdateError(getApiErrorMessage(error, "Thay đổi lựa chọn không thành công"))
            }
        } finally {
            updatingRef.current = false;
            setUpdatingItemId(null);
        }
    }
    //Bấm thay đổi số lượng
    async function handleQuantityChange(
        itemId:string,
        quantity:number
    ):Promise<boolean> {
        if(!userId||updatingRef.current)return false;

        setUpdatingItemId(itemId)
        updatingRef.current=true
        setUpdateError(null)

        let saved=false;
        try{
            await updateCartItemQuantity(itemId,quantity)
            saved=true

            const updateCart=await getCartItems();
            setCart(updateCart)

            return true;
        }catch(error){
            if(saved){
                setError("Đã lưu số lượng nhưng chưa tải lại được giỏ hàng. " +
                    "Vui lòng thử tải lại.",)
            }else{
                setUpdateError(getApiErrorMessage(error,"thay đổi số lượng không thành công"))
            }
            return false
        }finally{
            updatingRef.current=false
            setUpdatingItemId(null)
        }
    }

    if (loading) {
        return <p role="status">Đang tải giỏ hàng...</p>;
    }

    if (error) {
        return (
            <section className="cart-page">
                <h1>Giỏ hàng</h1>
                <p role="alert">{error}</p>
                <button
                    type="button"
                    onClick={() => {
                        setLoading(true);
                        setError(null);
                        setUpdateError(null);
                        setRetryCount((previous) => previous + 1);
                    }}
                >
                    Tải lại giỏ hàng
                </button>
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
            {updateError && (
                <p role="alert">{updateError}</p>
            )}

            {groups.map((group) => (
                <CartShopGroup
                    key={group.shop.id}
                    group={group}
                    isUpdating={updatingItemId !== null}
                    onSelectedChange={handleSelectedChange}
                    onQuantityChange={handleQuantityChange}
                />
            ))}

            <CartSummary summary={cart.summary} updatingItemId={updatingItemId} />
        </section>
    );
}