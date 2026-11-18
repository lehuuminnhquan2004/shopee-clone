import { Router } from "express";
import {
    getProvinces,
    getWardsByProvince,
} from "../controllers/locations.controller.js";

export const locationsRouter = Router();

locationsRouter.get("/provinces", getProvinces);
locationsRouter.get("/provinces/:provinceId/wards",getWardsByProvince,);