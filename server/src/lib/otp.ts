import "dotenv/config";
import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

const secret = process.env.OTP_SECRET;

if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
  throw new Error("OTP_SECRET phải là chuỗi hex gồm 64 ký tự");
}

const otpSecret = Buffer.from(secret, "hex");

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return randomInt(0, 1_000_000)
    .toString()
    .padStart(6, "0");
}

export function hashOtp(
  registrationId: string,
  otp: string,
): string {
  return createHmac("sha256", otpSecret)
    .update(`registration:${registrationId}:${otp}`)
    .digest("hex");
}

export function verifyOtp(
  registrationId: string,
  otp: string,
  storedHash: string,
): boolean {
  if (!/^\d{6}$/.test(otp)) {
    return false;
  }

  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const receivedHash = Buffer.from(
    hashOtp(registrationId, otp),
    "hex",
  );

  const expectedHash = Buffer.from(storedHash, "hex");

  return timingSafeEqual(receivedHash, expectedHash);
}