import { useRef, useState } from "react";
import {
    GoogleLogin,
    type CredentialResponse,
} from "@react-oauth/google";
import { loginWithGoogle } from "../../api/authApi";
import { getApiErrorMessage } from "../../lib/api";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/AuthContext";

type GoogleLoginButtonProps = {
    loading: boolean;
    onLoadingChange: (loading: boolean) => void;
};

export default function GoogleLoginButton({
    loading,
    onLoadingChange,
}: GoogleLoginButtonProps) {
    const [error, setError] = useState<string | null>(null);
    //Luu session dang nhap
    const {setSession}=useAuth();
    const navigate=useNavigate();

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
            setSession({
                user:data.user,
                accessToken:data.accessToken
            })
            navigate('/',{replace:true})
        } catch (err) {
            setError(
                getApiErrorMessage(err, "Đăng nhập Google thất bại"),
            );
        } finally {
            submittingRef.current = false;
            onLoadingChange(false);
        }
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
                />
            )}

            {error && <p role="alert">{error}</p>}
        </div>
    );
}