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



