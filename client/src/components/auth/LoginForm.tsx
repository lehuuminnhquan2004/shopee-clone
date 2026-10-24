import { useState } from "react";
import { login } from "../../api/authApi";
import type { LoginResponse } from "../../types/auth";
import { getApiErrorMessage } from "../../lib/api";
import './LoginForm.css'


export function LoginForm() {
    const [identifier, setIdentifier] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [result, setResult] = useState<LoginResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogin() {
        if (loading) return
        setLoading(true);
        setError(null);
        try {
            const data = await login({
                identifier: identifier.trim(),
                password: password
            })
            setResult(data);
            setPassword('')
        } catch (err) {
            setError(getApiErrorMessage(err, "Đăng nhập thất bại"))
        } finally {
            setLoading(false);
        }
    }
   
    return (
                    result ? (
                        <p className="login-success" role="status">
                            Đăng nhập thành công, {result.user.username}!
                        </p>
                    ) : (
                        <form
                            className="login-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void handleLogin();
                            }}
                        >
                            <div className="login-field">
                                <label htmlFor="identifier">
                                    Email hoặc số điện thoại
                                </label>

                                <input
                                    id="identifier"
                                    name="identifier"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Email hoặc số điện thoại"
                                    value={identifier}
                                    onChange={(event) =>
                                        setIdentifier(event.target.value)
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
                                    autoComplete="current-password"
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
                                disabled={
                                    loading || !identifier.trim() || !password
                                }
                            >
                                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </button>
                        </form>
                    )
    );


}