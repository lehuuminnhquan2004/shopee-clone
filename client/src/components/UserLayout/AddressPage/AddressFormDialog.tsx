import { useEffect, useRef } from "react";
import "./AddressFormDialog.css";

type AddressFormDialogProps = {
    onDismiss: () => void;
};

export default function AddressFormDialog({
    onDismiss,
}: AddressFormDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        // Mở dưới dạng modal, không chỉ hiển thị thẻ dialog.
        dialog.showModal();

        // Khóa cuộn trang phía sau.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            dialog.close();
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className="address-dialog"
            aria-labelledby="address-dialog-title"
            onCancel={(event) => {
                // Đóng thông qua state của component cha.
                event.preventDefault();
                onDismiss();
            }}
        >
            <div className="address-dialog__header">
                <h2 id="address-dialog-title">Địa chỉ mới</h2>

                <button
                    type="button"
                    className="address-dialog__close"
                    aria-label="Đóng form thêm địa chỉ"
                    onClick={onDismiss}
                >
                    ×
                </button>
            </div>

            <form
                className="address-form"
                onSubmit={(event) => {
                    // Bước sau sẽ gọi API tạo địa chỉ tại đây.
                    event.preventDefault();
                }}
            >
                <div className="address-form__row">
                    <div className="address-form__field">
                        <label htmlFor="address-receiver-name">
                            Họ và tên
                        </label>

                        <input
                            id="address-receiver-name"
                            name="receiverName"
                            type="text"
                            autoComplete="name"
                            placeholder="Họ và tên người nhận"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="address-form__field">
                        <label htmlFor="address-receiver-phone">
                            Số điện thoại
                        </label>

                        <input
                            id="address-receiver-phone"
                            name="receiverPhone"
                            type="tel"
                            autoComplete="tel-national"
                            placeholder="Số điện thoại người nhận"
                            pattern="0[0-9]{9}"
                            maxLength={10}
                            required
                        />
                    </div>
                </div>

                <div className="address-form__row">
                    <div className="address-form__field">
                        <label htmlFor="address-province">
                            Tỉnh/Thành phố
                        </label>

                        <select
                            id="address-province"
                            name="provinceId"
                            defaultValue=""
                            disabled
                        >
                            <option value="">Chọn tỉnh/thành phố</option>
                        </select>
                    </div>

                    <div className="address-form__field">
                        <label htmlFor="address-ward">
                            Xã/Phường
                        </label>

                        <select
                            id="address-ward"
                            name="wardId"
                            defaultValue=""
                            disabled
                        >
                            <option value="">Chọn xã/phường</option>
                        </select>
                    </div>
                </div>

                <div className="address-form__field">
                    <label htmlFor="address-detail">
                        Địa chỉ cụ thể
                    </label>

                    <textarea
                        id="address-detail"
                        name="addressDetail"
                        autoComplete="street-address"
                        placeholder="Số nhà, tên đường, tòa nhà..."
                        rows={3}
                        maxLength={255}
                        required
                    />
                </div>

                <fieldset className="address-form__types">
                    <legend>Loại địa chỉ</legend>

                    <label>
                        <input
                            type="radio"
                            name="addressType"
                            value="home"
                            defaultChecked
                        />
                        Nhà riêng
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="addressType"
                            value="office"
                        />
                        Văn phòng
                    </label>
                </fieldset>

                <label className="address-form__default">
                    <input
                        type="checkbox"
                        name="isDefault"
                    />
                    Đặt làm địa chỉ mặc định
                </label>

                <div className="address-form__actions">
                    <button
                        type="button"
                        className="address-form__cancel"
                        onClick={onDismiss}
                    >
                        Trở lại
                    </button>

                    {/* Bật nút sau khi nối API ở bước tiếp theo. */}
                    <button
                        type="submit"
                        className="address-form__submit"
                        disabled
                    >
                        Hoàn thành
                    </button>
                </div>
            </form>
        </dialog>
    );
}