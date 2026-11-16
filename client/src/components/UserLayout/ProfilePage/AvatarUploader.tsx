import { useRef, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { uploadAvatar } from "../../../api/userApi";
import './AvatarUploader.css'

const MAX_SIZE = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AvatarUploader() {
    const { session } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return

        if (!TYPES.includes(file.type)) return setError("Chỉ nhận ảnh JPG,PNG hoặc WEBP");
        if (file.size > MAX_SIZE) return setError("Ảnh tối đa 2MB");

        setError("");
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setUploading(true);

        try {
            await uploadAvatar(file);
        } catch (error) {
            setError("Không thể tải ảnh lên")
            setPreview(null);
        } finally {
            setUploading(false);
            URL.revokeObjectURL(objectUrl);
        }
    }
    return (
        <div className="avatar-uploader">
            <img
                className="avatar-uploader__img"
                src={preview ?? session?.user.avatarUrl ?? "/default-avatar.png"}
                alt=""
            />
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleFile}
            />
            <button
                type="button"
                className="avatar-uploader__btn"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
            >
                {uploading ? "Đang tải..." : "Chọn Ảnh"}
            </button>
            <p className="avatar-uploader__hint">
                Dung lượng file tối đa 2 MB<br />Định dạng: JPEG, PNG, WebP
            </p>
            {error && <p role="alert" className="avatar-uploader__error">{error}</p>}
        </div>
    );
}