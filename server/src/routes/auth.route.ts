import { Router } from "express";
import{
    login,
    logout,
}from '../controllers/auth.controller.js'
import { loginLimiter } from "../middlewares/rateLimiter.js";

export const authRouter=Router()

authRouter.post('/login',login)
authRouter.post('/logout',logout)