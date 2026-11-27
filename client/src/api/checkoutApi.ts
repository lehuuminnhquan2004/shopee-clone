import { api } from "../lib/api";
import type {
    CheckoutPreview,
    CreateCheckoutPayload,
    CreateCheckoutResponse,
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