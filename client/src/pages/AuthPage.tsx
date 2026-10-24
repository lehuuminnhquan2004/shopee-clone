import './AuthPage.css'
import { LoginForm } from "../components/auth/LoginForm";
import { useState } from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';

export function AuthPage() {
    const [mode, setMode] = useState<"login" | "register">("login")

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
                    <h1 className="login-title">Đăng nhập</h1>
                    {mode === "login" ? <LoginForm /> : <RegisterForm />}
                    <div className='auth-switch'>
                        <p className="auth-switch__text">{mode==="login"?"Bạn chưa có tài khoản?":"Bạn đã có tài khoản?"}</p>
                        <button
                            type='button'
                            className='auth-switch__button'
                            onClick={() => setMode(mode === "login" ? "register" : "login")}
                        >{mode === "login" ? "Đăng ký" : "Đăng nhập"}</button>
                    </div>
                </section>
            </div>
        </div>
    );


}