import { api } from "../lib/api";
import type { CheckoutPreview } from "../types/checkout";

export async function getCheckoutPreview(
    signal?: AbortSignal,
): Promise<CheckoutPreview> {
    const { data } = await api.get<CheckoutPreview>(
        "/api/checkout/preview",
        {
            signal,
            timeout: 10000,
        },
    );

    return data;
}