import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
    getCheckoutPreview,
    placeCheckout,
} from "../controllers/checkout.controller.js";

export const checkoutRouter = Router();

checkoutRouter.use(requireAuth);

checkoutRouter.get("/preview", getCheckoutPreview);
checkoutRouter.post("/", placeCheckout);