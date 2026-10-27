import { Link, useNavigate } from "react-router";
import { useAuth } from "../../auth/AuthContext";
import '../Header.css'
import { useState } from "react";
import { logout } from "../../api/authApi";
import { getApiErrorMessage } from "../../lib/api";
import './UserMenu.css'

export function UserMenu() {
    const navigate = useNavigate();
    const { session, setSession } = useAuth();
    const [logingout, setLogingout] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const [openUserMenu, setOpenUserMenu] = useState(false);

    async function handleLogout() {
        if (logingout) return
        setLogingout(true)
        setLogoutError(null)

        try {
            await logout();

            setSession(null);

            navigate('/', { replace: true })
        } catch (error) {
            setLogoutError(getApiErrorMessage(error, 'lỗi không xác định'))
        } finally {
            setLogingout(false);
        }
    }
    return (
        <nav className='container container-navbar'>
            <div className="header-account">
                {session ? (
                    <div
                        className="user-menu"
                        onMouseEnter={() => setOpenUserMenu(true)}
                        onMouseLeave={() => setOpenUserMenu(false)}
                    >
                        <div className="user-menu__trigger">
                            <span>{session.user.username}</span>
                        </div>

                        <div
                            role="menu"
                            aria-hidden={!openUserMenu}
                            className={`user-menu__popover ${openUserMenu ? "user-menu__popover--show" : ""
                                }`}
                        >
                            <Link to="/account" onClick={() => setOpenUserMenu(false)}>
                                Tài Khoản Của Tôi
                            </Link>
                            <Link to="/orders" onClick={() => setOpenUserMenu(false)}>
                                Đơn Mua
                            </Link>
                            <button type="button" onClick={() => void handleLogout()}>
                                Đăng Xuất
                            </button>
                        </div>
                    </div>
                ) : (
                    <Link to="/auth">Đăng nhập / Đăng ký</Link>
                )}
            </div>
        </nav>
    )
}