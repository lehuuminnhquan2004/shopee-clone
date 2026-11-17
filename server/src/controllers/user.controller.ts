import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { toPublicUrl } from "../lib/uploadUrl.js";
import { deleteUpload } from "../lib/deleteUpload.js";
import { compressAvatar } from "../lib/compressAvatar.js";
import { randomUUID } from "node:crypto";
import { UPLOAD_DIR } from "../config/upload.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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
