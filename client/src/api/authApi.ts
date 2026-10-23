import { api } from "../lib/api";
import type { LoginPayload,LoginResponse } from "../types/auth";

export async function login(payload:LoginPayload):Promise<LoginResponse> {
    const {data}= await api.post<LoginResponse>('/api/auth/login',payload)
    return data
}
export async function logout():Promise<void>{
    await api.post('/api/auth/logout');
}