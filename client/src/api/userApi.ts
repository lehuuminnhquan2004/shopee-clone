import { api } from "../lib/api";
import type { MeResponse } from "../types/user";

export async function getMe(signal?: AbortSignal): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>("/api/users/me", {
        signal,
        timeout: 10000,
    });
    return data;
}
