import { api } from "../lib/api";
import type {
    UserAddress,
    CreateAddressPayload,
    UpdateAddressPayload,
    AddressMutationResponse,
    DeleteAddressResponse,
} from "../types/address";

export async function getMyAddresses(
    signal?: AbortSignal,
): Promise<UserAddress[]> {
    const { data } = await api.get<UserAddress[]>(
        "/api/addresses",
        { signal, timeout: 10000 },
    );

    return data;
}

export async function createAddress(
    payload: CreateAddressPayload,
): Promise<AddressMutationResponse> {
    const { data } = await api.post<AddressMutationResponse>(
        "/api/addresses",
        payload,
    );

    return data;
}

export async function updateAddress(
    addressId: string,
    payload: UpdateAddressPayload,
): Promise<AddressMutationResponse> {
    const { data } = await api.patch<AddressMutationResponse>(
        `/api/addresses/${addressId}`,
        payload,
    );

    return data;
}

export async function setDefaultAddress(
    addressId: string,
): Promise<AddressMutationResponse> {
    const { data } = await api.patch<AddressMutationResponse>(
        `/api/addresses/${addressId}/default`,
    );

    return data;
}

export async function deleteAddress(
    addressId: string,
): Promise<DeleteAddressResponse> {
    const { data } = await api.delete<DeleteAddressResponse>(
        `/api/addresses/${addressId}`,
    );

    return data;
}