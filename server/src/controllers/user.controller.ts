import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { toPublicUrl } from "../lib/uploadUrl.js";
import { deleteUpload } from "../lib/deleteUpload.js";
import { compressAvatar } from "../lib/compressAvatar.js";
import { randomUUID } from "node:crypto";
import { UPLOAD_DIR } from "../config/upload.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "../generated/prisma/client.js";

export async function getMe(req: Request, res: Response): Promise<void> {
    const authUser = req.authUser;
    if (!authUser) {
        res.status(401).json({ message: "Vui lòng đăng nhập" });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: {
                id: true,
                email: true,
                phone: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                gender: true,
                birthDate: true,
                role: true,
            },
        });

        if (!user) {
            res.status(404).json({ message: "Không tìm thấy tài khoản" });
            return;
        }

        res.status(200).json({
            user: {
                id: user.id.toString(),
                email: user.email,
                phone: user.phone,
                username: user.username,
                fullName: user.fullName,
                avatarUrl: toPublicUrl(user.avatarUrl),
                gender: user.gender,
                // Ngày sinh là ngày trên lịch, trả YYYY-MM-DD cho form.
                birthDate: user.birthDate?.toISOString().slice(0, 10) ?? null,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Lấy hồ sơ thất bại:", error);
        res.status(500).json({ message: "Không thể tải thông tin hồ sơ" });
    }
}

async function removeAvatarSafely(relativePath: string | null): Promise<void> {
    // Chỉ dọn ảnh local, không xử lý URL ảnh Google.
    if (!relativePath?.startsWith("avatars/")) return;

    try {
        await deleteUpload(relativePath);
    } catch (error) {
        console.error("Không thể xóa file avatar:", relativePath, error);
    }
}

export async function uploadAvatar(req: Request, res: Response): Promise<void> {
    const file = req.file;
    const user = req.authUser;

    if (!user) {
        res.status(401).json({ message: "Vui lòng đăng nhập" });
        return;
    }

    if (!file) {
        res.status(400).json({ message: "Vui lòng chọn ảnh JPEG, PNG hoặc WebP" });
        return;
    }

    let compressedImage: Buffer;
    try {
        compressedImage = await compressAvatar(file.buffer)
    } catch (error) {
        console.error("Xử lý ảnh đại diện thất bại:", error);

        res.status(400).json({
            message:
                "Không thể xử lý ảnh. Hãy chọn ảnh tĩnh JPEG, PNG hoặc WebP " +
                "không quá 20 megapixel.",
        });
        return;
    }


    const filename = `${randomUUID()}.webp`;
    const newAvatarPath = `avatars/${filename}`;
    const avatarDirectory = path.join(UPLOAD_DIR, "avatars");
    const absolutePath = path.join(avatarDirectory, filename);

    try {
        await mkdir(avatarDirectory, { recursive: true });

        //Xử lý ảnh đã giới hạn dung lượng
        await writeFile(absolutePath, compressedImage);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                avatarUrl: newAvatarPath,
            },
        });
    } catch (error) {
        console.error("Lưu ảnh đại diện thất bại:", error);

        // Dọn file mới nếu ghi file hoặc cập nhật database thất bại.
        await removeAvatarSafely(newAvatarPath);

        res.status(500).json({
            message: "Không thể lưu ảnh đại diện. Vui lòng thử lại",
        });
        return;
    }

    // Chỉ xóa ảnh cũ sau khi lưu thành công;
    if (user.avatarUrl !== newAvatarPath) {
        await removeAvatarSafely(user.avatarUrl);
    }
    res.status(200).json({ avatarUrl: toPublicUrl(newAvatarPath) });
}

function parseBirthDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    if (value.startsWith("0000-"))return null;

    const date=new Date(`${value}T00:00:00.000Z`);

    if(!Number.isFinite(date.getTime()))return null

    if(date.toISOString().slice(0,10)!==value)return null;

    //Lay ngay gio hien tai
    const parts = new Intl.DateTimeFormat("en-US",{
        timeZone:"Asia/Ho_Chi_Minh",
        year:"numeric",
        month:"2-digit",
        day:"2-digit",
    }).formatToParts(new Date());

    const getPart=(type:string)=>(
        parts.find((part)=>part.type==type)?.value??""
    )
    const today =`${getPart("year")}-${getPart("month")}-${getPart("day")}`;

    // So sanh dinh dang YYYY-MM-DD
    if (value > today) return null;

    return date;
}

export async function updateProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const authUser = req.authUser;

    if (!authUser) {
        res.status(401).json({
            message: "Vui lòng đăng nhập",
        });
        return;
    }

    // Dữ liệu từ client phải được kiểm tra trước khi sử dụng.
    const rawFullName: unknown = req.body?.fullName;
    const gender: unknown = req.body?.gender;
    const rawBirthDate: unknown = req.body?.birthDate;

    if (rawFullName !== null && typeof rawFullName !== "string") {
        res.status(400).json({
            message: "Tên hiển thị phải là chuỗi hoặc null",
        });
        return;
    }

    // Chuỗi rỗng hoặc chỉ có khoảng trắng được lưu thành null.
    const fullName =
        typeof rawFullName === "string"
            ? rawFullName.trim() || null
            : null;

    if (fullName && Array.from(fullName).length > 100) {
        res.status(400).json({
            message: "Tên hiển thị tối đa 100 ký tự",
        });
        return;
    }

    if (
        gender !== null &&
        gender !== "male" &&
        gender !== "female" &&
        gender !== "other"
    ) {
        res.status(400).json({
            message: "Giới tính không hợp lệ",
        });
        return;
    }

    let birthDate: Date | null = null;

    if (rawBirthDate !== null) {
        if (typeof rawBirthDate !== "string") {
            res.status(400).json({
                message: "Ngày sinh phải là chuỗi YYYY-MM-DD hoặc null",
            });
            return;
        }

        birthDate = parseBirthDate(rawBirthDate);

        if (!birthDate) {
            res.status(400).json({
                message:
                    "Ngày sinh không hợp lệ hoặc nằm trong tương lai",
            });
            return;
        }
    }

    try {
        const user = await prisma.user.update({
            // Chỉ sửa tài khoản đang đăng nhập.
            where: {
                id: authUser.id,
                status: "active",
                deletedAt: null,
            },

            // Liệt kê rõ các trường được phép cập nhật.
            data: {
                fullName,
                gender,
                birthDate,
            },

            select: {
                id: true,
                email: true,
                phone: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                gender: true,
                birthDate: true,
                role: true,
            },
        });

        res.status(200).json({
            message: "Cập nhật hồ sơ thành công",
            user: {
                id: user.id.toString(),
                email: user.email,
                phone: user.phone,
                username: user.username,
                fullName: user.fullName,
                avatarUrl: toPublicUrl(user.avatarUrl),
                gender: user.gender,
                birthDate:
                    user.birthDate?.toISOString().slice(0, 10) ?? null,
                role: user.role,
            },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            res.status(404).json({
                message: "Tài khoản không còn khả dụng",
            });
            return;
        }

        console.error("Cập nhật hồ sơ thất bại:", error);

        res.status(500).json({
            message: "Không thể cập nhật hồ sơ. Vui lòng thử lại",
        });
    }
}