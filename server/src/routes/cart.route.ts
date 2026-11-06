import { Router } from "express";
import { 
    addCartItem,
    getCartItems, 
    updateCartItemQuantity, 
    updateCartItemSelected
} from "../controllers/cart.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const cartRouter = Router();

// Các API trong router giỏ hàng đều yêu cầu đăng nhập.
cartRouter.use(requireAuth);

cartRouter.post("/items", addCartItem);
cartRouter.get('/items',getCartItems)
cartRouter.patch('/items/:itemId/selected',updateCartItemSelected)
cartRouter.patch('/items/:itemId/quantity',updateCartItemQuantity)