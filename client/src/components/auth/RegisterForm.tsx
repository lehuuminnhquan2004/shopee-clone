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

export function RegisterForm() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [result, setResult] = useState<RegisterResponse | null>(null);
    const [verifyResponse, setVerifyResponse] = useState<VerifyRegistrationResponse | null>(null);
    const [resendResponse, setResendResponse] = useState<ResendRegistrationOtpResponse | null>(null)
    const [loading, setLoading] = useState(false);
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
    function startResendCooldown(seconds: number) {
        if (!Number.isFinite(seconds) || seconds < 0) return;
        const currentTime = Date.now();
        setNow(currentTime);
        setResendAvailableAt(currentTime + seconds * 1000)
    }
    useEffect(() => {
        if (!isWaitingToResend) return
        const timerId = window.setInterval(() => {
            setNow(Date.now());
        }, 1000)
        return () => {
            window.clearInterval(timerId);
        }
    }, [isWaitingToResend])

    async function handleRegister() {
        if (loading) return

        setError(null);
        setResult(null);

        if (Array.from(password).length < 8 || new TextEncoder().encode(password).length > 72) {
            setError("Mật khẩu phải lớn hơn 8 kí tự và không quá dài")
            return
        }
        setLoading(true);

        try {
            const data = await register({
                email: email,
                username: username,
                password: password,
            })
            setResult(data);
            setPassword('')
            startResendCooldown(60);
        } catch (err) {
            const pendingSession = getRegistrationSessionFromError(err);
            if (pendingSession) {
                setResult(() => ({
                    ...pendingSession,
                    message: "Yêu cầu đăng ký được lưu"
                }))
            }
            setPassword('')
            startResendCooldown(60);
            setError(getApiErrorMessage(err, "Không thể đăng ký lúc này"))
        } finally {
            setLoading(false);
        }
    }

    async function handleVerify() {
        if (loading) return
        if (!result) return
        setError(null);
        setVerifyResponse(null);

        const normalizedOtp = otp.trim();

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
    async function handleResend() {
        if (loading) return
        if (!result) return
        if (verifyResponse) return
        if (Date.now() < resendAvailableAt) return
        setError(null)
        setLoading(true);
        setResendResponse(null);
        try {
            const data = await resendRegistrationOtp({
                registrationId: result.registrationId,
            })
            setResendResponse(data);
            setOtp('')
            startResendCooldown(data.retryAfterSeconds);
        } catch (err) {
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
                        <label htmlFor="identifier">
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
                        disabled={loading || Array.from(otp).length < 6}
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
                    <label htmlFor="identifier">
                        Email hoặc số điện thoại
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="text"
                        autoComplete="username"
                        placeholder="Email hoặc số điện thoại"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        disabled={loading}
                        required
                    />
                </div>

                <div className="login-field">
                    <label htmlFor="identifier">
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
