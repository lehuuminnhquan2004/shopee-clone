import type { UserAddress } from "./address";

export type CheckoutItem = {
    cartItemId: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    model: {
        id: string;
        name: string | null;
    };
    product: {
        id: string;
        name: string;
        imageUrl: string | null;
    };
    shop: {
        id: string;
        name: string;
    };
};

export type CheckoutGroup = {
    shop: CheckoutItem["shop"];
    items: CheckoutItem[];
    subtotal: string;
    shippingFee: string;
    discountAmount: string;
    totalAmount: string;
};

export type CheckoutPreview = {
    source: "cart";
    address: UserAddress | null;
    groups: CheckoutGroup[];
    paymentMethod: "cod";
    canPlaceOrder: boolean;
    summary: {
        itemCount: number;
        totalQuantity: number;
        subtotal: string;
        shippingTotal: string;
        discountTotal: string;
        grandTotal: string;
    };
};

// Dữ liệu client gửi lên khi đặt hàng.
export type CreateCheckoutPayload = {
    idempotencyKey: string;
    addressId: string;
    paymentMethod: "cod";

    items: {
        cartItemId: string;
        quantity: number;
        expectedUnitPrice: string;
    }[];

    expectedGrandTotal: string;
};

export type OrderStatus =
    | "pending_payment"
    | "pending_confirm"
    | "to_ship"
    | "shipping"
    | "delivered"
    | "completed"
    | "cancelled"
    | "return_refund";

export type PaymentMethod =
    | "cod"
    | "bank_transfer"
    | "card"
    | "ewallet";

export type PaymentStatus =
    | "unpaid"
    | "paid"
    | "failed"
    | "refunded";

// Thông tin đơn của từng shop trong response đặt hàng.
export type CheckoutOrder = {
    id: string;
    orderCode: string;
    shopId: string;
    status: OrderStatus;
    totalAmount: string;
};

// Kết quả checkout trả về từ server.
export type CheckoutResult = {
    id: string;
    checkoutCode: string;
    grandTotal: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    orders: CheckoutOrder[];
};

export type CreateCheckoutResponse = {
    message: string;
    reused: boolean;
    checkout: CheckoutResult;
};

// Dữ liệu gửi lên để xem trước Mua ngay.
export type BuyNowPreviewPayload = {
    modelId: string;
    quantity: number;
};

// Giống dòng checkout thông thường nhưng không có cartItemId.
export type BuyNowCheckoutItem = Omit<CheckoutItem,"cartItemId">;

// Thay kiểu items bằng các dòng mua ngay.
export type BuyNowCheckoutGroup = Omit<CheckoutGroup,"items"> & {
    items: BuyNowCheckoutItem[];
};

// Giữ cấu trúc địa chỉ, tổng tiền... của checkout hiện tại.
export type BuyNowCheckoutPreview = Omit<CheckoutPreview,"groups" | "source"> & {
    source: "buy_now";
    groups: BuyNowCheckoutGroup[];
};
// Dữ liệu gửi lên khi xác nhận đặt hàng Mua ngay.
export type CreateBuyNowCheckoutPayload = BuyNowPreviewPayload & {
    addressId: string;
    paymentMethod: "cod";
    expectedUnitPrice: string;
    expectedGrandTotal: string;
    idempotencyKey: string;
};