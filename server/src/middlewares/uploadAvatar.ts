import multer from "multer"
import crypto from 'crypto'
import path from "path"
import fs from 'fs'
import { UPLOAD_DIR } from "../config/upload.js"
import { Request,Response,NextFunction } from "express"

const AVATAR_DIR=path.join(UPLOAD_DIR,"avatars")
fs.mkdirSync(AVATAR_DIR,{recursive:true})

const EXT_BY_MIME:Record<string,string>={
    "image/jpeg":".jpg",
    "image/png":".png",
    "image/webp":".webp",
}

export const avatarUploader=multer({
    storage: multer.diskStorage({
        destination:(_req,_file,cb)=>cb(null,AVATAR_DIR),
        filename:(_req,file,cb)=>cb(null,`${crypto.randomUUID()}${EXT_BY_MIME[file.mimetype]}`)
    }),
    limits:{fileSize:2*1024*1024},
    fileFilter:(_req, file, cb) =>cb(null,file.mimetype in EXT_BY_MIME),
})

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
            res.status(413).json({ message: "Ảnh đại diện không được vượt quá 2 MB" });
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
