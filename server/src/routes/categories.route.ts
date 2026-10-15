import { Router } from "express";
import {
    getCategories,
    getCategoryChildren
} from '../controllers/categories.controller.js'

export const categoriesRouter=Router();

categoriesRouter.get('/',getCategories);
categoriesRouter.get('/:categoryId/children',getCategoryChildren);;

