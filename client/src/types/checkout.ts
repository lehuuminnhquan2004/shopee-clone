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