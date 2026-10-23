import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,              
  standardHeaders: true,    
  legacyHeaders: false,     
  message: { message: "Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau" },
});
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,                      
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút" },
});
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Bạn đăng ký quá nhiều lần, vui lòng thử lại sau 15 phút",
  },
});
export const verifyRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Bạn xác nhận quá nhiều lần, vui lòng thử lại sau",
  },
});
export const resendRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Bạn gửi lại OTP quá nhiều lần, vui lòng thử lại sau",
  },
});