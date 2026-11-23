import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../auth/AuthContext";
import { getMyAddresses } from "../../../api/addressesApi";
import { getApiErrorMessage } from "../../../lib/api";
import type { UserAddress } from "../../../types/address";
import "./AddressPage.css";
import AddressFormDialog from "./AddressFormDialog";

export default function AddressPage() {
    const { session } = useAuth();
    const userId = session?.user.id;

    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    //state dong mo them dia chi
    const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const controller = new AbortController();

        async function loadAddresses() {
            setLoading(true);
            setError(null);

            try {
                const data = await getMyAddresses(controller.signal);

                // Không cập nhật state nếu request đã bị hủy.
                if (controller.signal.aborted) return;

                setAddresses(data);
            } catch (error) {
                if (
                    controller.signal.aborted ||
                    axios.isCancel(error)
                ) {
                    return;
                }

                setError(
                    getApiErrorMessage(
                        error,
                        "Không thể tải danh sách địa chỉ",
                    ),
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadAddresses();

        // Hủy request khi rời trang hoặc effect chạy lại.
        return () => controller.abort();
    }, [userId, retryCount]);


    return (
        <section
            className="address-page"
            aria-labelledby="address-page-title"
        >
            {
                isAddressFormOpen && (
                    <AddressFormDialog
                        onDismiss={() => setIsAddressFormOpen(false)}
                    />
                )
            }
            <header className="address-page__header">
                <h1 id="address-page-title">Địa chỉ của tôi</h1>

                <button
                    type="button"
                    className="address-page__add"
                    onClick={() => setIsAddressFormOpen(true)}
                >
                    + Thêm địa chỉ mới
                </button>
            </header>

            <div className="address-page__content">
                {loading && (
                    <p role="status">Đang tải địa chỉ...</p>
                )}

                {!loading && error && (
                    <div className="address-page__error">
                        <p role="alert">{error}</p>

                        <button
                            type="button"
                            className="address-page__retry"
                            onClick={() =>
                                setRetryCount((count) => count + 1)
                            }
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {!loading && !error && addresses.length === 0 && (
                    <p className="address-page__empty">
                        Bạn chưa có địa chỉ nhận hàng.
                    </p>
                )}

                {!loading && !error && addresses.length > 0 && (
                    <ul className="address-page__list">
                        {addresses.map((address) => (
                            <li
                                key={address.id}
                                className="address-item"
                            >
                                <div className="address-item__receiver">
                                    <span className="address-item__name">
                                        {address.receiverName}
                                    </span>

                                    <span className="address-item__phone">
                                        {address.receiverPhone}
                                    </span>
                                </div>

                                <p className="address-item__detail">
                                    {address.addressDetail}
                                </p>

                                <p className="address-item__location">
                                    {address.ward.name},{" "}
                                    {address.province.name}
                                </p>

                                <div className="address-item__badges">
                                    {address.isDefault && (
                                        <span className="address-item__default">
                                            Mặc định
                                        </span>
                                    )}

                                    <span className="address-item__type">
                                        {address.addressType === "home"
                                            ? "Nhà riêng"
                                            : "Văn phòng"}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}