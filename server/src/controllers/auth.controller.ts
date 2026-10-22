import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "15m"
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^0(3|5|7|8|9)\d{8}$/;

function normalizePhone(input: string): string {
    let phone = input.replace(/[\s.\-()]/g, "");
    if (phone.startsWith("+84")) phone = "0" + phone.slice(3);
    else if (phone.startsWith("84") && phone.length === 11) phone = "0" + phone.slice(2);
    return phone;
}
type Identifier =
    { type: "email"; value: string }
    | { type: "phone"; value: string }
    | null;

function parseIdentifier(raw: string): Identifier {
    const input = raw.trim();
    if (input.includes('@')) {
        const email = input.toLowerCase();
        return EMAIL_REGEX.test(email) ? { type: "email", value: email } : null;
    }
    const phone = normalizePhone(input);
    return PHONE_REGEX.test(phone) ? { type: "phone", value: phone } : null;
}
export async function login(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const rawIdentifier = String(req.body?.identifier ?? "");
        const password = String(req.body?.password ?? "");
        if (!rawIdentifier || !password) {
            res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' })
            return
        }
        const identifier = parseIdentifier(rawIdentifier)
        if (!identifier) {
            res.status(400).json({ message: "Thông tin không hợp lệ" })
            return;
        }
        if (password.length > 128) {
            res.status(400).json({ message: "Mật khẩu quá dài" });
            return;
        }
        const user =
            identifier.type === "email"
                ? await prisma.user.findFirst({
                    where: {
                        email: identifier.value
                    },
                })
                : await prisma.user.findFirst({
                    where: {
                        phone: identifier.value
                    },
                });

        if (!user) {
            res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" })
            return
        }
        const isMatch = await bcrypt.compare(
            password, user.passwordHash
        );
        if (!isMatch) {
            res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" })
            return
        }
        if (user.status === "locked") {
            res.status(403).json({ message: "Tài khoản đã bị khóa" });
            return;
        }
        if (user.status === "deleted") {
            res.status(403).json({ message: "Tài khoản đã xóa" });
            return;
        }

        const accessSecret = process.env.JWT_ACCESS_SECRET;
        const refreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!accessSecret || !refreshSecret) {
            throw new Error("Thiếu JWT_ACCESS_SECRET hoặc JWT_REFRESH_SECRET");
        }
        const accessToken = jwt.sign(
            { userId: user.id.toString(), role: user.role },
            accessSecret,
            { expiresIn: ACCESS_TOKEN_TTL,}
        );
        const refreshToken = jwt.sign(
            { userId: user.id.toString() },
            refreshSecret,
            { expiresIn: '7d', }
        );
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: REFRESH_TOKEN_TTL_MS,
        });
        res.status(200).json({
            message: "Đăng nhập thành công",
            accessToken,
            user: {
                id: user.id.toString(),
                email: user.email,
                phone: user.phone,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau" });
    }
}