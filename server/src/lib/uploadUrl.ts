import { PUBLIC_UPLOAD_URL } from "../config/upload.js";

export function toPublicUrl(value: string | null): string | null {
  if (!value) return null

  // Ảnh Google đã có URL đầy đủ.
  if (/^https?:\/\//i.test(value)) return value;
  
  const baseUrl = PUBLIC_UPLOAD_URL.replace(/\/+$/, "");
  return `${baseUrl}/${value.replace(/^\/+/, "")}`;
}