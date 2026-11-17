import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { uploadAvatar } from "../../../api/userApi";
import './AvatarUploader.css'
import { getApiErrorMessage } from "../../../lib/api";

const MAX_SIZE = 20 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AvatarUploader() {
    const { session, updateUserAvatar } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!preview) return;

        return () => {
            URL.revokeObjectURL(preview);
        };
    }, [preview]);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return
        const userId = session?.user.id;

        if (!userId) {
            setError("Vui lòng đăng nhập");
            return;
        }

        if (!TYPES.includes(file.type)) return setError("Chỉ nhận ảnh JPG,PNG hoặc WEBP");
        if (file.size > MAX_SIZE) return setError("Ảnh tối đa 20MB");

        setError("");
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setUploading(true);

        try {
            const { avatarUrl } = await uploadAvatar(file);

            //cap nhap session hien thi anh hien tai luu trong server
            updateUserAvatar(userId, avatarUrl);

            setPreview(null);
        } catch (error) {
            setError(
                getApiErrorMessage(error, "Không thể tải ảnh lên"),
            );
            setPreview(null);
        } finally {
            setUploading(false);
        }
    }
    return (
        <div className="avatar-uploader">
            <img
                className="avatar-uploader__img"
                src={preview ?? session?.user.avatarUrl ?? `${import.meta.env.VITE_API_BASE_URL}/uploads/avatars/avatar_default/avatar_default.png`}
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
                Dung lượng file tối đa 20 MB<br />Định dạng: JPEG, PNG, WebP
            </p>
            {error && <p role="alert" className="avatar-uploader__error">{error}</p>}
        </div>
    );
}