import { api } from "../lib/api";
import type {
    CheckoutPreview,
    CreateCheckoutPayload,
    CreateCheckoutResponse,
    BuyNowPreviewPayload,
    BuyNowCheckoutPreview,
    CreateBuyNowCheckoutPayload,
} from "../types/checkout";

export async function getCheckoutPreview(signal?: AbortSignal): Promise<CheckoutPreview> {
    const { data } = await api.get<CheckoutPreview>("/api/checkout/preview",
        {
            signal,
            timeout: 10000,
        },
    );

    return data;
}
export async function createCheckout(payload: CreateCheckoutPayload): Promise<CreateCheckoutResponse> {
    const { data } = await api.post<CreateCheckoutResponse>("/api/checkout",payload,
        {
            timeout: 60000,
        },
    );

    return data;
}

export async function getBuyNowCheckoutPreview(payload: BuyNowPreviewPayload,signal?: AbortSignal,): Promise<BuyNowCheckoutPreview> {
    const { data } = await api.post<BuyNowCheckoutPreview>("/api/checkout/buy-now/preview",payload,
        {
            signal,
            timeout: 10000,
        },
    );
    return data;
}
export async function createBuyNowCheckout(payload: CreateBuyNowCheckoutPayload): Promise<CreateCheckoutResponse> {
    const { data } = await api.post<CreateCheckoutResponse>("/api/checkout/buy-now",payload,
        {
            timeout: 60000,
        },
    );

    return data;
}