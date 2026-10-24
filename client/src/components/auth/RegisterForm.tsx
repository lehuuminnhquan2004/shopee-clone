import { useState, useEffect } from "react";
import axios from "axios";
import type {
    RegisterResponse,
    VerifyRegistrationResponse,
    ResendRegistrationOtpResponse,
    AuthErrorResponse,
} from "../../types/auth";
import {
    register,
    getRegistrationSessionFromError,
    verifyRegistration,
    resendRegistrationOtp
} from '../../api/authApi'
import { getApiErrorMessage } from "../../lib/api";
import './LoginForm.css'

type RegisterFormProps = {
    // AuthPage giữ loading dùng chung để khóa cả form và nút chuyển đăng nhập/đăng ký.
    loading: boolean;
    onLoadingChange: (loading: boolean) => void;
};

export function RegisterForm({ loading, onLoadingChange: setLoading }: RegisterFormProps) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [result, setResult] = useState<RegisterResponse | null>(null);
    const [verifyResponse, setVerifyResponse] = useState<VerifyRegistrationResponse | null>(null);
    const [resendResponse, setResendResponse] = useState<ResendRegistrationOtpResponse | null>(null)
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState("");
    // Mốc thời gian được phép gửi lại, đơn vị milliseconds
    const [resendAvailableAt, setResendAvailableAt] = useState(0);
    // Thời gian hiện tại, cập nhật để giao diện đếm ngược
    const [now, setNow] = useState(() => Date.now());
    const retryAfterSeconds = Math.max(
        0,
        Math.ceil((resendAvailableAt - now) / 1000),
    );
    const isWaitingToResend =
        retryAfterSeconds > 0 && !verifyResponse;
    // Bắt đầu hoặc cập nhật thời gian chờ từ số giây server yêu cầu.
    function startResendCooldown(seconds: number) {
        if (!Number.isFinite(seconds) || seconds < 0) return;
        const currentTime = Date.now();
        setNow(currentTime);
        setResendAvailableAt(currentTime + seconds * 1000)
    }

    useEffect(() => {
        if (!isWaitingToResend) return
        // Đọc lại thời gian thực thay vì trừ 1, tránh đếm sai khi tab chạy nền.
        const timerId = window.setInterval(() => {
            setNow(Date.now());
        }, 1000)
        return () => {
            // Dọn timer khi hết thời gian chờ, xác nhận thành công hoặc rời component.
            window.clearInterval(timerId);
        }
    }, [isWaitingToResend])

    // Bước 1: kiểm tra thông tin, tạo/ghi đè yêu cầu đăng ký và yêu cầu gửi OTP.
    async function handleRegister() {
        // Không khởi chạy thêm thao tác khi một request của form đang được xử lý.
        if (loading) return

        setError(null);
        setResult(null);
        if (Array.from(password).length < 8 || new TextEncoder().encode(password).length > 72) {
            setError("Mật khẩu cần ít nhất 8 ký tự và không vượt quá 72 byte")
            return
        }
        if (password !== confirmPassword) {
            setError("Mật khẩu nhập lại không khớp");
            return;
        }
        setLoading(true);

        try {
            const data = await register({
                email: email,
                username: username,
                password: password,
            })
            // Lưu ID mới nhất để chuyển sang màn OTP; xóa mật khẩu khỏi state.
            setResult(data);
            setPassword('')
            setConfirmPassword("");
            // API register chưa trả số giây chờ; dùng 60 giây theo cấu hình server hiện tại.
            startResendCooldown(60);
        } catch (err) {
            // Lỗi gửi mail 503 vẫn có thể kèm yêu cầu đã lưu trong database.
            // Giữ ID đó để người dùng có thể gửi lại mã, không coi là đã xác nhận tài khoản.
            const pendingSession = getRegistrationSessionFromError(err);
            if (pendingSession) {
                setResult(() => ({
                    ...pendingSession,
                    message: "Yêu cầu đăng ký được lưu"
                }))
                setPassword('')
                setConfirmPassword("");
                startResendCooldown(60);
            }

            setError(getApiErrorMessage(err, "Không thể đăng ký lúc này"))
        } finally {
            // Mở khóa giao diện dù request thành công hay thất bại.
            setLoading(false);
        }
    }

    // Bước 2: gửi OTP cùng ID của yêu cầu đang chờ để server kiểm tra và tạo tài khoản.
    async function handleVerify() {
        if (loading) return
        if (!result) return
        setError(null);
        setVerifyResponse(null);

        const normalizedOtp = otp.trim();

        // Client kiểm tra định dạng; server vẫn kiểm tra mã, hạn dùng và số lần nhập sai.
        if (!/^\d{6}$/.test(normalizedOtp)) {
            setError("OTP phải gồm đúng 6 chữ số");
            return;
        }
        setLoading(true);
        try {
            const data = await verifyRegistration({
                registrationId: result.registrationId,
                otp: normalizedOtp
            })
            setVerifyResponse(data);
        } catch (err) {
            setError(getApiErrorMessage(err, "Lỗi xác thực OTP"))
        } finally {
            setLoading(false);
        }
    }
    // Yêu cầu thay OTP trên pending hiện tại, không tạo yêu cầu đăng ký mới.
    async function handleResend() {
        if (loading) return
        if (!result) return
        if (verifyResponse) return
        // Kiểm tra lại ngay lúc bấm, không chỉ dựa vào trạng thái disabled của nút.
        if (Date.now() < resendAvailableAt) return
        setError(null)
        setLoading(true);
        setResendResponse(null);
        try {
            const data = await resendRegistrationOtp({
                registrationId: result.registrationId,
            })
            setResendResponse(data);
            // Server đã thay mã, nên xóa mã cũ người dùng đang nhập.
            setOtp('')
            startResendCooldown(data.retryAfterSeconds);
        } catch (err) {
            // Lỗi 429 hoặc 503 cũng có thể yêu cầu chờ. Chỉ cập nhật khi có số giây trả về.
            if (axios.isAxiosError<AuthErrorResponse>(err)) {
                const seconds = err.response?.data?.retryAfterSeconds;

                if (typeof seconds === "number") {
                    startResendCooldown(seconds);
                }
            }
            setError(getApiErrorMessage(err, "Lỗi gửi OTP"))
        } finally {
            setLoading(false);
        }
    }

    // Ba trạng thái giao diện:
    // - Chưa có result: nhập thông tin đăng ký.
    // - Có result, chưa có verifyResponse: nhập OTP và gửi lại mã.
    // - Có verifyResponse: thông báo tài khoản đã được tạo thành công.
    return (
        result ? (
            verifyResponse ? (
                <p className="login-success" role="alert">
                    {verifyResponse?.message}
                </p>
            ) :
                <form
                    className="login-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleVerify();
                    }}
                >
                    <div className="login-field">
                        <label htmlFor="otp">
                            Nhập mã OTP gửi đến gmail
                        </label>

                        <input
                            id="otp"
                            name="otp"
                            inputMode="numeric"
                            type="text"
                            autoComplete="one-time-code"
                            placeholder=""
                            value={otp}
                            onChange={(event) =>
                                setOtp(event.target.value)
                            }
                            disabled={loading}
                            required
                        />
                    </div>
                    {error && (
                        <p className="login-error" role="alert">
                            {error}
                        </p>
                    )}
                    {resendResponse && !error && (
                        <p className="login-success" role="status">
                            {resendResponse.message}
                        </p>
                    )}
                    <p className="verify-resend">
                        Bạn chưa nhận được mã?
                        <button
                            type="button"
                            disabled={loading || retryAfterSeconds > 0}
                            onClick={() => void handleResend()}
                        >
                            {retryAfterSeconds > 0
                                ? `Gửi lại sau ${retryAfterSeconds}s`
                                : "Gửi lại"}
                        </button>
                    </p>

                    <button
                        className="login-submit"
                        type="submit"
                        disabled={loading || !/^\d{6}$/.test(otp.trim())}
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </form>

        ) : (
            <form
                className="login-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleRegister();
                }}
            >
                <div className="login-field">
                    <label htmlFor="email">
                        Email
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Nhập email nhận mã xác nhận"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        disabled={loading}
                        required
                    />
                </div>

                <div className="login-field">
                    <label htmlFor="username">
                        Tài khoản
                    </label>

                    <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        placeholder="username"
                        value={username}
                        onChange={(event) =>
                            setUsername(event.target.value)
                        }
                        disabled={loading}
                        required
                    />
                </div>


                <div className="login-field">
                    <label htmlFor="password">Mật khẩu</label>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        disabled={loading}
                        required
                    />
                </div>

                <div className="login-field">
                    <label htmlFor="confirm-password">Nhập lại mật khẩu</label>

                    <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        disabled={loading}
                        required
                    />
                </div>

                {error && (
                    <p className="login-error" role="alert">
                        {error}
                    </p>
                )}

                <button
                    className="login-submit"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>
            </form>
        )
    );
}
