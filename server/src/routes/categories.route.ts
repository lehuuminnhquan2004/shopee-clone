import { Router } from "express";
import {
    getCategories,
    getCategoryChildren,
    getCategoryById,
} from '../controllers/categories.controller.js'

export const categoriesRouter=Router();

categoriesRouter.get('/',getCategories);
categoriesRouter.get('/:categoryId/children',getCategoryChildren);
categoriesRouter.get('/:id',getCategoryById);

