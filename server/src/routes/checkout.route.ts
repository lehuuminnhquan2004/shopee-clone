import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
    getCheckoutPreview,
    placeCheckout,
    getBuyNowCheckoutPreview,
    placeBuyNowCheckout,
} from "../controllers/checkout.controller.js";

export const checkoutRouter = Router();

checkoutRouter.use(requireAuth);

checkoutRouter.get("/preview", getCheckoutPreview);
checkoutRouter.post("/", placeCheckout);
checkoutRouter.post("/buy-now/preview",getBuyNowCheckoutPreview);
checkoutRouter.post("/buy-now",placeBuyNowCheckout);