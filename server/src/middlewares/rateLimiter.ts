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