import { useEffect, useState } from "react";
import axios from "axios";
import { getMe } from "../api/authApi";
import { getApiErrorMessage } from "../lib/api";
import type { User } from "../types/user";

export default function AccountPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        async function loadAccount() {
            setLoading(true);
            setError(null);
            try {
                const data = await getMe(controller.signal)

                if (controller.signal.aborted) return
                setUser(data.user);
            } catch (error) {
                //request bi huy khi roi trang khong can hien bao loi
                if (controller.signal.aborted || axios.isCancel(error)) return

                setError(
                    getApiErrorMessage(
                        error,
                        "Không thể tải thông tin tài khoản. Vui lòng thử lại.",
                    ),
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }
        loadAccount();
        return () => {
            controller.abort();
        }

    }, [retryCount])

    function handleReload() {
        setError(null);
        setUser(null);
        setLoading(true);
        setRetryCount((previous) => previous + 1);
    }

    if (loading) {
        return <p role="status">Đang tải thông tin tài khoản...</p>;
    }

    if (error) {
        return (
            <section>
                <h1>Tài khoản của tôi</h1>

                <p role="alert">{error}</p>

                <button type="button" onClick={handleReload}>
                    Thử lại
                </button>
            </section>
        );
    }
    if (!user) {
        return <p>Không có thông tin tài khoản để hiển thị.</p>;
    }

    return (
        <section className="account-page">
            <h1>Tài khoản của tôi</h1>

            <dl>
                <dt>Tên đăng nhập</dt>
                <dd>{user.username}</dd>

                <dt>Email</dt>
                <dd>{user.email ?? "Chưa cập nhật"}</dd>

                <dt>Số điện thoại</dt>
                <dd>{user.phone ?? "Chưa cập nhật"}</dd>
            </dl>

            <button type="button" onClick={handleReload}>
                Tải lại thông tin
            </button>
        </section>
    );
}