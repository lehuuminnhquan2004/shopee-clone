import { Router } from "express";
import { getMyAddresses } from "../controllers/addresses.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const addressesRouter = Router();

// Mọi API quản lý địa chỉ cá nhân đều phải đăng nhập.
addressesRouter.use(requireAuth);

addressesRouter.get("/", getMyAddresses);