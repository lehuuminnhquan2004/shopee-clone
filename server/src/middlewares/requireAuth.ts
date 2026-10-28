import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    res.setHeader("Cache-Control", "no-store");
    try {
        const accessSecret= process.env.JWT_ACCESS_SECRET;
        if (!accessSecret) {
            throw new Error("Không có JWT_ACCESS_SECRET ")
        }

        const authorization = req.get("Authorization");

        const match = authorization?.match(/^Bearer ([^\s]+)$/i);
        const accessToken = match?.[1];

        if (!accessToken || accessToken.length > 10000) {
            res.status(401).json({
                code: "UNAUTHORIZED",
                message: "Vui lòng đăng nhập"
            })
            return
        }
        const payload = jwt.verify(accessToken, accessSecret, { algorithms: ["HS256"] });

        if (typeof payload === "string" || typeof payload.exp !== "number") {
            res.status(401).json({
                code: "INVALID_ACCESS_TOKEN",
                message: "Thông tin xác thực không hợp lệ",
            })
            return
        }
        const rawUserId: unknown = payload.userId
        if (
            typeof rawUserId !== "string" ||
            !/^[1-9]\d{0,18}$/.test(rawUserId)
        ) {
            res.status(401).json({
                code: "INVALID_ACCESS_TOKEN",
                message: "Thông tin xác thực không hợp lệ",
            });
            return;
        }

        const userId = BigInt(rawUserId);

        if (userId > 9223372036854775807n) {
            res.status(401).json({
                code: "INVALID_ACCESS_TOKEN",
                message: "Thông tin xác thực không hợp lệ",
            });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                phone: true,
                username: true,
                role: true,
                status: true,
                deletedAt: true,
            },
        });

        if (!user) {
            res.status(401).json({
                code: "UNAUTHORIZED",
                message: "Tài khoản không còn tồn tại",
            });
            return;
        }

        if (user.status !== "active" || user.deletedAt !== null) {
            res.status(403).json({
                code: "ACCOUNT_UNAVAILABLE",
                message: "Tài khoản đã bị khóa hoặc đã xóa",
            });
            return;
        }
        req.authUser = {
            id: user.id,
            email: user.email,
            phone: user.phone,
            username: user.username,
            role: user.role,
        }

    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                code: "ACCESS_TOKEN_EXPIRED",
                message: "Access token đã hết hạn",
            })
            return
        }
        if (
            err instanceof jwt.JsonWebTokenError ||
            err instanceof jwt.NotBeforeError
        ) {
            res.status(401).json({
                code: "INVALID_ACCESS_TOKEN",
                message: "Thông tin xác thực không hợp lệ",
            });
            return;
        }
        console.error("Authentication error:", err);
        res.status(500).json({
            message: "Không thể xác thực yêu cầu. Vui lòng thử lại",
        });
        return;
    }
    next();
}