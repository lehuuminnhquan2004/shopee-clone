import './AuthPage.css'
import { LoginForm } from "../components/auth/LoginForm";
import { useState } from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

export function AuthPage() {
    const [mode, setMode] = useState<"login" | "register">("login")
    const [loading, setLoading] = useState(false);

    return (
        <div className="login-page">
            <div className="login-layout">
                <div className="login-brand">


                    <p className="login-brand-name">MiQ</p>
                    <p className="login-brand-description">
                        Nền tảng thương mại điện tử
                        <br />
                        yêu thích ở Đông Nam Á &amp; Đài Loan
                    </p>
                </div>
                <section className="auth-card">
                    <h1 className="login-title">{mode === "login" ? "Đăng nhập" : "Đăng ký"}</h1>
                    {mode === "login" ? (
                        <LoginForm loading={loading} onLoadingChange={setLoading} />
                    ) : (
                        <RegisterForm loading={loading} onLoadingChange={setLoading} />
                    )}
                    <div className='social-login'>
                        <GoogleLoginButton
                            loading={loading}
                            onLoadingChange={setLoading}
                        />
                    </div>
                    <div className='auth-switch'>
                        <p className="auth-switch__text">{mode === "login" ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}</p>
                        <button
                            type='button'
                            className='auth-switch__button'
                            disabled={loading}
                            onClick={() => {
                                if (loading) return;
                                setMode((previous) => previous === "login" ? "register" : "login");
                            }}
                        >{mode === "login" ? "Đăng ký" : "Đăng nhập"}</button>
                    </div>
                </section>
            </div>
        </div>
    );


}
