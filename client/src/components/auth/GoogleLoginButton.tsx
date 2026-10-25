import { useRef, useState } from "react";
import {
    GoogleLogin,
    type CredentialResponse,
} from "@react-oauth/google";
import { loginWithGoogle } from "../../api/authApi";
import { getApiErrorMessage } from "../../lib/api";
import type { LoginResponse } from "../../types/auth";

type GoogleLoginButtonProps = {
    loading: boolean;
    onLoadingChange: (loading: boolean) => void;
};

export default function GoogleLoginButton({
    loading,
    onLoadingChange,
}: GoogleLoginButtonProps) {
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LoginResponse | null>(null);

    // Chặn callback gửi trùng request trước khi React cập nhật giao diện.
    const submittingRef = useRef(false);

    async function handleSuccess(response: CredentialResponse) {
        if (loading || submittingRef.current) return;

        if (!response.credential) {
            setError("Google chưa trả về thông tin xác thực");
            return;
        }

        submittingRef.current = true;
        onLoadingChange(true);
        setError(null);

        try {
            // Chỉ báo thành công sau khi API của mình xác minh xong.
            const data = await loginWithGoogle(response.credential);
            setResult(data);
        } catch (err) {
            setError(
                getApiErrorMessage(err, "Đăng nhập Google thất bại"),
            );
        } finally {
            submittingRef.current = false;
            onLoadingChange(false);
        }
    }

    if (result) {
        return (
            <p role="status">
                Đăng nhập Google thành công, {result.user.username}!
            </p>
        );
    }

    return (
        <div className="google-login">
            {loading ? (
                <p role="status">Đang xử lý...</p>
            ) : (
                <GoogleLogin
                    onSuccess={(response) => {
                        void handleSuccess(response);
                    }}
                    onError={() => {
                        setError("Không thể đăng nhập bằng Google");
                    }}
                    text="continue_with"
                />
            )}

            {error && <p role="alert">{error}</p>}
        </div>
    );
}