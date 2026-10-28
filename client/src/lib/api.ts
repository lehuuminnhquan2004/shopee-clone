import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})
export function setApiAccessToken(accessToken:string|null):void{
  if(accessToken){
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message
    return typeof message === 'string' && message.trim() ? message : fallback
  }

  return error instanceof Error ? error.message : fallback
}
