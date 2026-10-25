import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { Prisma } from "../generated/prisma/client.js";
import { sendRegistrationOtp } from "../lib/mail.js";
import {
    generateOtp,
    hashOtp,
    OTP_TTL_MS,
    OTP_RESEND_COOLDOWN_MS,
    OTP_MAX_ATTEMPTS,
    verifyOtp,
} from "../lib/otp.js";
import { verifyGoogleIdToken } from "../lib/google.js";

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
        const rawIdentifier: unknown = req.body?.identifier;
        const password: unknown = req.body?.password;
        if (
            typeof rawIdentifier !== 'string' ||
            !rawIdentifier.trim() ||
            typeof password !== 'string' ||
            password.length === 0) {
            res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' })
            return
        }
        const identifier = parseIdentifier(rawIdentifier)
        if (!identifier) {
            res.status(400).json({ message: "Thông tin không hợp lệ" })
            return;
        }
        if (Buffer.byteLength(password, 'utf8') > 72) {
            res.status(400).json({ message: 'Mật khẩu vượt quá 72 byte' });
            return;
        }
        const user =
            identifier.type === "email"
                ? await prisma.user.findUnique({
                    where: {
                        email: identifier.value
                    },
                })
                : await prisma.user.findUnique({
                    where: {
                        phone: identifier.value
                    },
                });

        // Tài khoản đăng nhập bằng Google có thể chưa thiết lập mật khẩu.
        if (!user || user.passwordHash === null) {
            res.status(401).json({
                message: "Sai tài khoản hoặc mật khẩu",
            });
            return;
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
        if (user.deletedAt !== null) {
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
            { expiresIn: ACCESS_TOKEN_TTL, }
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
                email: user.email ?? null,
                phone: user.phone ?? null,
                username: user.username,
                role: user.role ?? "buyer",
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau" });
    }
}
export function logout(
    _req: Request,
    res: Response
): void {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: '/',
    });
    res.status(204).end();
}

export async function register(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const rawEmail: unknown = req.body?.email;
        const rawUsername: unknown = req.body?.username;
        const password: unknown = req.body?.password;

        // 1. Kiểm tra kiểu dữ liệu trước khi xử lý chuỗi
        if (
            typeof rawEmail !== "string" ||
            typeof rawUsername !== "string" ||
            typeof password !== "string"
        ) {
            res.status(400).json({
                message: "Vui lòng nhập email, tên đăng nhập và mật khẩu",
            });
            return;
        }

        const email = rawEmail.trim().toLowerCase();
        const username = rawUsername.trim();

        if (email.length > 255 || !EMAIL_REGEX.test(email)) {
            res.status(400).json({
                message: "Email không hợp lệ",
            });
            return;
        }

        if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
            res.status(400).json({
                message:
                    "Tên đăng nhập gồm 3–50 ký tự, chỉ gồm chữ không dấu, số và dấu gạch dưới",
            });
            return;
        }

        if (
            Array.from(password).length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            res.status(400).json({
                message: "Mật khẩu cần ít nhất 8 ký tự và không vượt quá 72 byte",
            });
            return;
        }

        // 2. Kiểm tra tài khoản đã tồn tại
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
            select: {
                id: true,
            },
        });

        if (existingUser) {
            res.status(409).json({
                message: "Email hoặc tên đăng nhập đã được sử dụng",
            });
            return;
        }

        // 3. Chuẩn bị dữ liệu đăng ký
        const passwordHash = await bcrypt.hash(password, 12);
        const registrationId = randomUUID();
        const otp = generateOtp();
        const otpHash = hashOtp(registrationId, otp);

        const now = new Date();
        const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
        const resendCutoff = new Date(
            now.getTime() - OTP_RESEND_COOLDOWN_MS,
        );
        // Lấy yêu cầu cũ của email còn tồn tại
        const currentPending = await prisma.pendingRegistration.findUnique({
            where: {
                email: email,
                expiresAt: { gte: new Date() },
            },
            select: {
                id: true,
                lastSentAt: true,
                failedAttempts: true,
            }
        })
        if (currentPending) {
            const elapsedMs = now.getTime() - currentPending.lastSentAt.getTime();

            if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
                const retryAfterSeconds = Math.ceil(
                    (OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000,
                );

                res.setHeader("Retry-After", String(retryAfterSeconds));
                res.status(429).json({
                    message: `Vui lòng chờ ${retryAfterSeconds} giây`,
                    retryAfterSeconds,
                });
                return;
            }
            if (currentPending.failedAttempts >= OTP_MAX_ATTEMPTS) {
                res.status(429).json({
                    message:
                        "Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng chờ yêu cầu hết hạn rồi đăng ký lại",
                });
                return;
            }
            //Cập nhập yêu cầu đăng ký có sẵn
            const updated = await prisma.pendingRegistration.updateMany({
                where: {
                    id: currentPending.id,
                    lastSentAt: currentPending.lastSentAt,
                    expiresAt: { gt: new Date() },
                    failedAttempts: { lt: OTP_MAX_ATTEMPTS },
                },
                data: {
                    id: registrationId,
                    username,
                    passwordHash,
                    otpHash,
                    expiresAt,
                    lastSentAt: now,
                },
            });

            if (updated.count !== 1) {
                res.status(409).json({
                    message: "Yêu cầu đã thay đổi. Vui lòng thử đăng ký lại",
                });
                return;
            }
        } else {
            // 4. Thay yêu cầu đã hết hạn bằng yêu cầu mới
            await prisma.$transaction(async (tx) => {
                await tx.pendingRegistration.deleteMany({
                    where: {
                        email,
                        expiresAt: { lte: now },
                        lastSentAt: { lte: resendCutoff },
                    },
                });

                await tx.pendingRegistration.create({
                    data: {
                        id: registrationId,
                        email,
                        username,
                        passwordHash,
                        otpHash,
                        expiresAt,
                        failedAttempts: 0,
                        lastSentAt: now,
                    },
                });
            });
        }
        // 5. Gửi email sau khi đã lưu yêu cầu
        try {
            await sendRegistrationOtp(email, otp, expiresAt);
        } catch {
            // Giữ yêu cầu để kiểm soát tần suất và hỗ trợ gửi lại.
            console.error("Không gửi được email OTP đăng ký");

            res.status(503).json({
                message:
                    "Chưa thể xác nhận việc gửi email. Vui lòng thử gửi lại mã sau.",
                registrationId,
                expiresAt: expiresAt.toISOString(),
            });
            return;
        }

        res.status(201).json({
            message: "Mã xác nhận đã được gửi. Vui lòng kiểm tra email",
            registrationId,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            res.status(409).json({
                message:
                    "Yêu cầu đăng ký bị trùng hoặc vừa được cập nhật. Vui lòng thử lại sau.",
            });
            return;
        }

        // Không log request body, mật khẩu hoặc OTP.
        console.error(
            "Register error:",
            error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : "UNKNOWN",
        );

        res.status(500).json({
            message: "Không thể đăng ký lúc này, vui lòng thử lại sau",
        });
    }
}

export async function verifyRegistration(
    req: Request,
    res: Response,
): Promise<void> {
    const rawRegistrationId: unknown = req.body?.registrationId;
    const rawOtp: unknown = req.body?.otp;

    if (
        typeof rawRegistrationId !== "string" ||
        typeof rawOtp !== "string"
    ) {
        res.status(400).json({
            message: "Vui lòng cung cấp mã yêu cầu đăng ký và OTP",
        });
        return;
    }

    const registrationId = rawRegistrationId.trim().toLowerCase();
    const otp = rawOtp.trim();

    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

    if (!uuidRegex.test(registrationId) || !/^\d{6}$/.test(otp)) {
        res.status(400).json({
            message: "Mã yêu cầu không hợp lệ hoặc OTP không đủ 6 chữ số",
        });
        return;
    }

    try {
        const result = await prisma.$transaction(
            async (tx) => {
                // 1. Tìm yêu cầu đăng ký
                const pending = await tx.pendingRegistration.findUnique({
                    where: { id: registrationId },
                });

                if (!pending) {
                    return {
                        status: 400,
                        message: "Yêu cầu đăng ký không tồn tại hoặc đã được sử dụng",
                    };
                }

                // 2. Kiểm tra thời hạn
                const now = new Date();

                if (pending.expiresAt.getTime() <= now.getTime()) {
                    return {
                        status: 400,
                        message: "OTP đã hết hạn",
                    };
                }

                // 3. Kiểm tra giới hạn nhập sai
                if (pending.failedAttempts >= OTP_MAX_ATTEMPTS) {
                    return {
                        status: 429,
                        message: "Bạn đã nhập sai OTP quá số lần cho phép",
                    };
                }

                // 4. Đối chiếu OTP
                const isValid = verifyOtp(
                    pending.id,
                    otp,
                    pending.otpHash,
                );

                if (!isValid) {
                    const updated = await tx.pendingRegistration.update({
                        where: { id: pending.id },
                        data: {
                            failedAttempts: { increment: 1 },
                        },
                        select: {
                            failedAttempts: true,
                        },
                    });

                    if (updated.failedAttempts >= OTP_MAX_ATTEMPTS) {
                        return {
                            status: 429,
                            message: "Bạn đã nhập sai OTP quá số lần cho phép",
                        };
                    }

                    return {
                        status: 400,
                        message: "OTP không chính xác",
                    };
                }

                // 5. Tạo tài khoản từ dữ liệu đã lưu ở server
                await tx.user.create({
                    data: {
                        email: pending.email,
                        username: pending.username,
                        passwordHash: pending.passwordHash,
                        emailVerifiedAt: now,
                        role: "buyer",
                        status: "active",
                    },
                    select: {
                        id: true,
                    },
                });

                // 6. Xóa yêu cầu để OTP không thể dùng lại
                await tx.pendingRegistration.delete({
                    where: { id: pending.id },
                });

                return {
                    status: 201,
                    message: "Đăng ký thành công. Bạn có thể đăng nhập",
                };
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            },
        );

        // Chỉ gửi response khi transaction đã hoàn tất
        res.status(result.status).json({
            message: result.message,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                res.status(409).json({
                    message:
                        "Email hoặc tên đăng nhập đã được sử dụng. Vui lòng đăng ký bằng thông tin khác",
                });
                return;
            }

            if (error.code === "P2034") {
                res.status(409).json({
                    message:
                        "Yêu cầu đang được xử lý đồng thời. Vui lòng thử xác nhận lại",
                });
                return;
            }
        }

        console.error(
            "Verify registration error:",
            error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : "UNKNOWN",
        );

        res.status(500).json({
            message: "Không thể xác nhận đăng ký lúc này",
        });
    }
}
export async function resendRegistrationOtp(
    req: Request,
    res: Response,
): Promise<void> {
    const rawRegistrationId: unknown = req.body?.registrationId;

    if (typeof rawRegistrationId !== "string") {
        res.status(400).json({
            message: "Vui lòng cung cấp mã yêu cầu đăng ký",
        });
        return;
    }

    const registrationId = rawRegistrationId.trim().toLowerCase();

    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

    if (!uuidRegex.test(registrationId)) {
        res.status(400).json({
            message: "Mã yêu cầu đăng ký không hợp lệ",
        });
        return;
    }

    try {
        const pending = await prisma.pendingRegistration.findUnique({
            where: { id: registrationId },
        });

        if (!pending) {
            res.status(400).json({
                message: "Yêu cầu đăng ký không tồn tại hoặc đã được sử dụng",
            });
            return;
        }

        const now = new Date();

        if (pending.expiresAt.getTime() <= now.getTime()) {
            res.status(400).json({
                message: "Yêu cầu đã hết hạn. Vui lòng đăng ký lại",
            });
            return;
        }

        if (pending.failedAttempts >= OTP_MAX_ATTEMPTS) {
            res.status(429).json({
                message:
                    "Bạn đã nhập sai quá số lần cho phép. Vui lòng chờ yêu cầu hết hạn rồi đăng ký lại",
            });
            return;
        }

        const nextSendAt =
            pending.lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS;

        if (now.getTime() < nextSendAt) {
            const retryAfterSeconds = Math.ceil(
                (nextSendAt - now.getTime()) / 1000,
            );

            res.setHeader("Retry-After", String(retryAfterSeconds));
            res.status(429).json({
                message: `Vui lòng chờ ${retryAfterSeconds} giây để gửi lại`,
                retryAfterSeconds,
            });
            return;
        }

        // Tạo mã khác với mã hiện tại
        let otp: string;
        let otpHash: string;

        do {
            otp = generateOtp();
            otpHash = hashOtp(pending.id, otp);
        } while (otpHash === pending.otpHash);

        // Chỉ cập nhật nếu yêu cầu vẫn còn hợp lệ
        // và chưa bị một request khác thay đổi mã.
        const updated = await prisma.pendingRegistration.updateMany({
            where: {
                id: pending.id,
                otpHash: pending.otpHash,
                lastSentAt: pending.lastSentAt,
                expiresAt: { gt: new Date() },
                failedAttempts: { lt: OTP_MAX_ATTEMPTS },
            },
            data: {
                otpHash,
                lastSentAt: now,
            },
        });

        if (updated.count === 0) {
            res.status(409).json({
                message:
                    "Yêu cầu đã thay đổi hoặc không còn hợp lệ. Vui lòng kiểm tra lại",
            });
            return;
        }

        try {
            await sendRegistrationOtp(
                pending.email,
                otp,
                pending.expiresAt,
            );
        } catch {
            console.error("Không gửi được email OTP đăng ký");

            res.status(503).json({
                message:
                    "Chưa thể xác nhận việc gửi email. Vui lòng chờ 60 giây trước khi thử lại",
                retryAfterSeconds: OTP_RESEND_COOLDOWN_MS / 1000,
                expiresAt: pending.expiresAt.toISOString(),
            });
            return;
        }

        res.status(200).json({
            message: "Đã gửi lại mã xác nhận",
            registrationId: pending.id,
            expiresAt: pending.expiresAt.toISOString(),
            retryAfterSeconds: OTP_RESEND_COOLDOWN_MS / 1000,
        });
    } catch {
        console.error("Lỗi xử lý gửi lại OTP đăng ký");

        res.status(500).json({
            message: "Không thể gửi lại OTP lúc này",
        });
    }
}
export async function googleLogin(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const clientOrigin = process.env.CLIENT_ORIGIN;
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const accessSecret = process.env.JWT_ACCESS_SECRET;
        const refreshSecret = process.env.JWT_REFRESH_SECRET;

        if (
            !clientOrigin ||
            !googleClientId ||
            !accessSecret ||
            !refreshSecret
        ) {
            throw new Error("Thiếu cấu hình đăng nhập Google");
        }
        if (req.get("origin") !== clientOrigin) {
            res.status(403).json({ message: "Nguồn yêu cầu không hợp lệ" })
            return
        }
        if (!req.is("application/json")) {
            console.error({ message: "Yêu cầu phải sử dụng application/json" })
            res.status(415).json({ message: "Thông tin yêu cầu sai" })
            return
        }
        const credential: unknown = req.body?.credential;

        if (!credential || typeof (credential) !== "string" || !credential.trim() || credential.length > 10000) {
            res.status(400).json({ message: "Google credential không hợp lệ" })
            return
        }
        let payload: Awaited<ReturnType<typeof verifyGoogleIdToken>>;

        try {
            payload = await verifyGoogleIdToken(credential)
        } catch {
            res.status(401).json({ message: "Xác thực thất bại" })
            return
        }
        //Kiểm tra đã có tài khoản GG sub chưa
        let user = await prisma.user.findUnique({
            where: {
                googleSub: payload.sub,
            }
        })
        //Chưa có tài khoản nào tạo bằng GG này
        if (!user) {
            const email = payload.email?.trim().toLowerCase();

            if (
                !email ||
                email.length > 255 ||
                !EMAIL_REGEX.test(email) ||
                payload.email_verified !== true
            ) {
                res.status(400).json({
                    message: "Email Google không hợp lệ hoặc chưa được xác minh",
                });
                return;
            }

            if (!email.endsWith("@gmail.com") && !payload.hd) {
                res.status(403).json({
                    message: "Vui lòng đăng ký bằng email và xác thực OTP",
                });
                return;
            }
            user = await prisma.user.findUnique({
                where: {
                    email,
                }
            })
            //Chưa có tài khoản nào cùng gmail với gg này
            if (!user) {
                const username = `user_${randomUUID().replaceAll("-", "")}`;
                user = await prisma.$transaction(async (tx) => {
                    const createdUser = await tx.user.create({
                        data: {
                            username,
                            email,
                            googleSub: payload.sub,
                            passwordHash: null,
                            fullName: payload.name
                                ? Array.from(payload.name).slice(0, 100).join("")
                                : null,
                            avatarUrl:
                                payload.picture &&
                                    payload.picture.length <= 500
                                    ? payload.picture
                                    : null,
                            emailVerifiedAt: new Date(),
                            role: "buyer",
                            status: "active",
                        }
                    })

                    //Xoa cac yeu cau cũ cua gmail tài khoản GG này
                    await tx.pendingRegistration.deleteMany({
                        where: { email },
                    });
                    return createdUser;
                })
            } else {
                //Co tai khoan trung voi gmail nay
                res.status(409).json({
                    message:
                        "Email đã được sử dụng. Vui lòng đăng nhập bằng phương thức hiện có",
                });
                return;
            }
        }
        if (user.status !== "active" || user.deletedAt !== null) {
            res.status(403).json({
                message: "Tài khoản đã bị khóa hoặc đã xóa",
            });
            return;
        }
        const accessToken = jwt.sign(
            {
                userId: user.id.toString(),
                role: user.role,
            },
            accessSecret,
            { expiresIn: ACCESS_TOKEN_TTL }
        )
        const refreshToken = jwt.sign(
            { userId: user.id.toString() },
            refreshSecret,
            { expiresIn: "7d" },
        )
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
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
        // Hai request đồng thời có thể cùng thấy tài khoản chưa tồn tại.
        // Unique constraint trong database sẽ ngăn tạo trùng.
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            res.status(409).json({
                message:
                    "Thông tin tài khoản vừa được cập nhật. Vui lòng thử đăng nhập lại",
            });
            return;
        }

        console.error("Google login error:", error);

        res.status(500).json({
            message: "Lỗi server, vui lòng thử lại sau",
        });
    }
}