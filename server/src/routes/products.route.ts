import{getProducts} from '../controllers/products.controller.js'
import { Router } from 'express'

export const productsRouter=Router();

productsRouter.get('/',getProducts);