import { Router } from "express";
import {
    login,
    logout,
    register,
    verifyRegistration,
    resendRegistrationOtp,
    googleLogin,
    refresh,
} from '../controllers/auth.controller.js'
import {
    loginLimiter,
    registerLimiter,
    verifyRegistrationLimiter,
    resendRegistrationLimiter
} from "../middlewares/rateLimiter.js";

export const authRouter = Router()

authRouter.post('/login', loginLimiter, login)
authRouter.post('/logout', logout)
authRouter.post("/register", registerLimiter, register);
authRouter.post("/register/verify", verifyRegistrationLimiter, verifyRegistration,);
authRouter.post("/register/resend", resendRegistrationLimiter, resendRegistrationOtp,);
authRouter.post("/google", loginLimiter, googleLogin);
authRouter.post("/refresh", refresh);