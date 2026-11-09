import path from "node:path";

export const UPLOAD_DIR = path.resolve(
    process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads")
)

export const PUBLIC_UPLOAD_URL = process.env.PUBLIC_UPLOAD_URL ?? "http://localhost:3000/uploads";
