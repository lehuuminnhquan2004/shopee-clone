import { api } from "../lib/api";
import axios from "axios";
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  VerifyRegistrationPayload,
  VerifyRegistrationResponse,
  ResendRegistrationOtpPayload,
  ResendRegistrationOtpResponse,
  AuthErrorResponse,
  RegistrationSession,
} from "../types/auth";

export async function login(payload:LoginPayload):Promise<LoginResponse> {
    const {data}= await api.post<LoginResponse>('/api/auth/login',payload)
    return data
}
export async function loginWithGoogle(credential:string):Promise<LoginResponse> {
  const {data}=await api.post<LoginResponse>(`/api/auth/google/`,{credential})
  return data
}
export async function logout():Promise<void>{
    await api.post('/api/auth/logout');
}
export async function register(payload:RegisterPayload):Promise<RegisterResponse> {
    const {data}=await api.post<RegisterResponse>('/api/auth/register',payload)
    return data
}
export async function verifyRegistration(payload:VerifyRegistrationPayload):Promise<VerifyRegistrationResponse> {
    const {data}=await api.post<VerifyRegistrationResponse>('/api/auth/register/verify',payload)
    return data
}
export async function resendRegistrationOtp(payload: ResendRegistrationOtpPayload,): Promise<ResendRegistrationOtpResponse> {
  const { data } = await api.post<ResendRegistrationOtpResponse>("/api/auth/register/resend",payload,);
  return data;
}
export function getRegistrationSessionFromError(
  error: unknown,
): RegistrationSession | null {
  if (!axios.isAxiosError<AuthErrorResponse>(error)) {
    return null;
  }

  if (error.response?.status !== 503) {
    return null;
  }

  const data = error.response.data;

  if (
    typeof data?.registrationId !== "string" ||
    !data.registrationId ||
    typeof data?.expiresAt !== "string" ||
    !Number.isFinite(Date.parse(data.expiresAt))
  ) {
    return null;
  }

  return {
    registrationId: data.registrationId,
    expiresAt: data.expiresAt,
  };
}
