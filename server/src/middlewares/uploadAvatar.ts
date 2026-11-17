import multer from "multer"
import { Request,Response,NextFunction } from "express"

const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

export const avatarUploader = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 1,
    },

    fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_TYPES.has(file.mimetype));
    },
});

//Bat loi cua multer
export function uploadAvatarError(
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
): void {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            res.status(413).json({ message: "Ảnh đại diện không được vượt quá 20 MB" });
            return;
        }
        res.status(400).json({
            message: error.code === "LIMIT_UNEXPECTED_FILE"
                ? "Chỉ gửi một ảnh bằng field avatar"
                : "Dữ liệu upload không hợp lệ",
        });
        return;
    }

    console.error("Upload avatar thất bại:", error);
    res.status(500).json({ message: "Không thể tải ảnh lên. Vui lòng thử lại" });
}
