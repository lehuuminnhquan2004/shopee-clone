import { api } from "../lib/api";
import type { Province, Ward } from "../types/location";

export async function getProvinces(signal?: AbortSignal): Promise<Province[]> {
    const { data } = await api.get<Province[]>("/api/locations/provinces",{ signal, timeout: 10000 },);

    return data;
}

export async function getWardsByProvince(
    provinceId: number,
    signal?: AbortSignal,
): Promise<Ward[]> {
    const { data } = await api.get<Ward[]>(`/api/locations/provinces/${provinceId}/wards`,{ signal, timeout: 10000 },);

    return data;
}