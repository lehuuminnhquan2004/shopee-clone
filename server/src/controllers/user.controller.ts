import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { toPublicUrl } from "../lib/uploadUrl.js";
import { deleteUpload } from "../lib/deleteUpload.js";

export function getMe(req: Request, res: Response): void {
    const user = req.authUser;
    if (!user) {
        res.status(401).json({ message: "Vui lòng đăng nhập" });
        return;
    }

    res.status(200).json({
        user: {
            id: user.id.toString(),
            email: user.email,
            phone: user.phone,
            username: user.username,
            avatarUrl: toPublicUrl(user.avatarUrl),
            role: user.role,
        },
    });
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
        if (file) await removeAvatarSafely(`avatars/${file.filename}`);
        res.status(401).json({ message: "Vui lòng đăng nhập" });
        return;
    }

    if (!file) {
        res.status(400).json({ message: "Vui lòng chọn ảnh JPEG, PNG hoặc WebP" });
        return;
    }

    const newAvatarPath = `avatars/${file.filename}`;
    let savedAvatarPath: string | null;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: newAvatarPath },
            select: { avatarUrl: true },
        });
        savedAvatarPath = updatedUser.avatarUrl;
    } catch (error) {
        console.error("Cập nhật avatar thất bại:", error);
        // File đã được Multer lưu nhưng database chưa cập nhật được.
        await removeAvatarSafely(newAvatarPath);
        res.status(500).json({
            message: "Không thể cập nhật ảnh đại diện. Vui lòng thử lại",
        });
        return;
    }

    // Chỉ xóa ảnh cũ sau khi lưu thành công;
    if (user.avatarUrl !== savedAvatarPath) {
        await removeAvatarSafely(user.avatarUrl);
    }
    res.status(200).json({ avatarUrl: toPublicUrl(savedAvatarPath) });
}
