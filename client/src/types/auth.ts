import type { User } from "./user";
//thông tin Đăng nhập
export type LoginPayload = {
    identifier: string;
    password: string;
}
export type LoginResponse={
    message:string;
    accessToken:string;
    user:User;
}
//Thông tin đăng kí
export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
};

// Thông tin cần giữ trong lúc người dùng nhập OTP
export type RegistrationSession = {
  registrationId: string;
  expiresAt: string;
};

export type RegisterResponse = RegistrationSession & {
  message: string;
};

//Thông tin verify otp mail
export type VerifyRegistrationPayload = {
  registrationId: string;
  otp: string;
};

export type VerifyRegistrationResponse = {
  message: string;
};

//Thông tin yc gửi lại otp vào mail
export type ResendRegistrationOtpPayload = {
  registrationId: string;
};

export type ResendRegistrationOtpResponse = RegistrationSession & {
  message: string;
  retryAfterSeconds: number;
};

// Các trường có thể xuất hiện trong response lỗi của auth
export type AuthErrorResponse = {
  message?: string;
  registrationId?: string;
  expiresAt?: string;
  retryAfterSeconds?: number;
};