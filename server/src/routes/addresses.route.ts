import { Router } from "express";
import { createAddress, getMyAddresses, setDefaultAddress, updateAddress } from "../controllers/addresses.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const addressesRouter = Router();

// Mọi API quản lý địa chỉ cá nhân đều phải đăng nhập.
addressesRouter.use(requireAuth);

addressesRouter.get("/", getMyAddresses);
addressesRouter.post("/", createAddress);
addressesRouter.patch("/:addressId/default",setDefaultAddress,);
addressesRouter.patch("/:addressId", updateAddress);