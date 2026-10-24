import { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { loginWithGoogle } from "../../api/authApi";
import { getApiErrorMessage } from '../../lib/api';
import { useAuth } from "../../auth/AuthContext";

export default function GoogleLoginButton() {
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSuccess(response: CredentialResponse) {
    if (!response.credential || loading) return;

    setLoading(true);
    setError(null);
    try {
      const data = await loginWithGoogle(response.credential);
      setUser(data.user);
    } catch (err) {
      setError(getApiErrorMessage(err, "Đăng nhập Google thất bại"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => setError("Không thể đăng nhập bằng Google")}
        text="continue_with"
        locale="vi"
      />
      {loading && <p role="status">Đang đăng nhập...</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}