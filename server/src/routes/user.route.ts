import { Router } from "express";
import { getMe, uploadAvatar } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { avatarUploader, uploadAvatarError } from "../middlewares/uploadAvatar.js";

export const userRouter = Router();

userRouter.use(requireAuth);
userRouter.get("/me", getMe);
userRouter.patch(
    "/me/avatar",
    avatarUploader.single("avatar"),
    uploadAvatar,
    uploadAvatarError,
);
