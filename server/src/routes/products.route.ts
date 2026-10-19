import{
    getProducts,
    getCategoryIdProducts,
    getProductById,
} from '../controllers/products.controller.js'
import { Router } from 'express'

export const productsRouter=Router();

productsRouter.get('/',getProducts);
productsRouter.get('/:categoryId/products',getCategoryIdProducts);
productsRouter.get('/:id',getProductById);