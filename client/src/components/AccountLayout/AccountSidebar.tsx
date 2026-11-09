import { NavLink } from "react-router";
import { useAuth } from "../../auth/AuthContext";

type MenuItem = {
    label: string,
    to: string,
}

const ACCOUNT_ITEMS: MenuItem[] = [
    { label: "Hồ sơ", to: "/user/profile" },
    { label: "Ngân hàng", to: "/user/bank" },
    { label: "Địa chỉ", to: "/user/address" },
    { label: "Đổi mật khẩu", to: "/user/password" },
]
const TOP_ITEMS: MenuItem[] = [
    { label: "Đơn mua", to: "/user/purchase" },
    { label: "Kho voucher", to: "/user/voucher" },
]

export function AccountSidebar() {
    const { session } = useAuth()
    const user = session?.user

    const avatarUrl = user?.avatarUrl ?? undefined;
    return (
        <aside className="account-sidebar">
            <div className="account-sidebar__user">
                <img
                    className="account-sidebar__avatar"
                    src={avatarUrl}
                    alt=""
                />
                <div className="account-sidebar__info">
                    <strong className="account-sidebar__name">{user?.username ?? "Tài khoản"}</strong>
                    <NavLink to="/user/profile" className="account-sidebar__edit">
                        Sửa hồ sơ
                    </NavLink>
                </div>
            </div>

            <nav aria-label="Menu tài khoản">
                <p className="account-sidebar__group">Tài khoản của tôi</p>
                <ul className="account-sidebar__sub">
                    {ACCOUNT_ITEMS.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `account-sidebar__link ${isActive ? "account-sidebar__link--active" : ""}`
                                }
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <ul className="account-sidebar__main">
                    {TOP_ITEMS.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `account-sidebar__link ${isActive ? "account-sidebar__link--active" : ""}`
                                }
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}

