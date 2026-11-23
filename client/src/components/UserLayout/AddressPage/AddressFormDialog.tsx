import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import "./AddressFormDialog.css";
import type { Province, Ward } from "../../../types/location";
import { getProvinces, getWardsByProvince } from "../../../api/locationsApi";
import { getApiErrorMessage } from "../../../lib/api";
import axios from "axios";
import { createAddress } from "../../../api/addressesApi";

type AddressFormDialogProps = {
    onDismiss: () => void;
    onCreated: (message: string) => void;
};

export default function AddressFormDialog({
    onDismiss,
    onCreated,
}: AddressFormDialogProps) {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);

    // Giá trị của select là chuỗi; "" nghĩa là chưa chọn.
    const [provinceId, setProvinceId] = useState("");
    const [wardId, setWardId] = useState("");

    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingWards, setLoadingWards] = useState(false);

    const [provinceError, setProvinceError] = useState<string | null>(null);
    const [wardError, setWardError] = useState<string | null>(null);

    const [provinceRetry, setProvinceRetry] = useState(0);
    const [wardRetry, setWardRetry] = useState(0);

    //dialogref để điều kiển dialog thêm địa chỉ
    const dialogRef = useRef<HTMLDialogElement>(null);

    //State xử lý sự kiện gửi yêu cầu thêm địa chỉ
    const [saving, setSaving] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Chặn hai lần submit liên tiếp trước khi React render lại.
    const savingRef = useRef(false);

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

    useEffect(() => {
        const controller = new AbortController();

        async function loadProvinces() {
            setLoadingProvinces(true);
            setProvinceError(null);

            try {
                const data = await getProvinces(controller.signal);
                if (controller.signal.aborted) return

                setProvinces(data)
            } catch (error) {
                if (controller.signal.aborted || axios.isCancel(error)) {
                    return
                }
                setProvinceError(getApiErrorMessage(error, "Không lấy được tỉnh"))
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingProvinces(false);
                }
            }
        }
        void loadProvinces();

        return () => controller.abort();
    }, [provinceRetry])

    //Lay danh sach xa sau khi chon tinh
    useEffect(() => {
        if (!provinceId) return

        const controller = new AbortController();

        async function loadWards() {
            setLoadingWards(true);
            setWardError(null);

            try {
                const data = await getWardsByProvince(Number(provinceId), controller.signal);

                if (controller.signal.aborted) return;

                setWards(data);
            } catch (error) {
                if (controller.signal.aborted || axios.isCancel(error)) {
                    return;
                }

                setWardError(
                    getApiErrorMessage(error, "Không thể tải xã/phường"),
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingWards(false);
                }
            }
        }
        void loadWards();

        return () => controller.abort();
    }, [provinceId, wardRetry])

    //Xử lý khi thay đổi lựa chọn tỉnh
    function handleProvinceChange(nextProvinceId: string) {
        setProvinceId(nextProvinceId);

        setWardId("");
        setWards([]);
        setWardError(null);

        setLoadingWards(nextProvinceId !== "");
    }
    //Xử lý thêm địa chỉ
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (savingRef.current) return

        setSubmitError(null)

        if (
            loadingProvinces ||
            loadingWards ||
            provinceError ||
            wardError
        ) {
            setSubmitError("Vui lòng tải xong tỉnh/thành phố và xã/phường.");
            return;
        }
        const selectedWard = wards.find((ward) => (
            String(ward.id) === wardId && String(ward.provinceId) === provinceId
        ))
        if (!selectedWard) {
            setSubmitError("Vui lòng chọn tỉnh/thành phố và xã/phường hợp lệ.");
            return;
        }
        // Đọc dữ liệu trước khi khóa các input.
        const formData = new FormData(event.currentTarget);

        const receiverName = String(
            formData.get("receiverName") ?? "",
        ).trim();

        const receiverPhone = String(
            formData.get("receiverPhone") ?? "",
        ).trim();

        const addressDetail = String(
            formData.get("addressDetail") ?? "",
        ).trim();

        const addressType = formData.get("addressType");
        const isDefault = formData.has("isDefault");

        if (!receiverName || Array.from(receiverName).length > 100) {
            setSubmitError("Tên người nhận phải có từ 1 đến 100 ký tự.");
            return;
        }

        if (!/^0\d{9}$/.test(receiverPhone)) {
            setSubmitError("Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.");
            return;
        }

        if (!addressDetail || Array.from(addressDetail).length > 255) {
            setSubmitError("Địa chỉ cụ thể phải có từ 1 đến 255 ký tự.");
            return;
        }

        if (addressType !== "home" && addressType !== "office") {
            setSubmitError("Vui lòng chọn loại địa chỉ hợp lệ.");
            return;
        }

        savingRef.current = true;
        setSaving(true);

        let successMessage: string;

        try {
            const data = await createAddress({
                receiverName,
                receiverPhone,
                addressDetail,
                wardId: selectedWard.id,
                addressType,
                isDefault,
            });

            successMessage = data.message;

        } catch (error) {
            if (!dialogRef.current?.open) return;

            setSubmitError(
                getApiErrorMessage(error, "Không thể thêm địa chỉ."),
            );
            return
        } finally {
            savingRef.current = false;

            if (dialogRef.current?.open) {
                setSaving(false);
            }
        }
        // Chỉ thông báo thành công nếu dialog vẫn còn tồn tại.
        if (dialogRef.current?.open) {
            onCreated(successMessage);
        }
    }
    //Chặn đóng dialog khi đang lưu
    function handleDismiss() {
        if (savingRef.current) return;
        onDismiss();
    }

    return (
        <dialog
            ref={dialogRef}
            className="address-dialog"
            aria-labelledby="address-dialog-title"
            onCancel={(event) => {
                // Đóng thông qua state của component cha.
                event.preventDefault();
                handleDismiss();
            }}
        >
            <div className="address-dialog__header">
                <h2 id="address-dialog-title">Địa chỉ mới</h2>

                <button
                    type="button"
                    className="address-dialog__close"
                    aria-label="Đóng form thêm địa chỉ"
                    onClick={handleDismiss}
                >
                    ×
                </button>
            </div>

            <form className="address-form" onSubmit={handleSubmit}>
                <fieldset
                    className="address-form__fields"
                    disabled={saving}
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
                                value={provinceId}
                                onChange={(e) => { handleProvinceChange(e.target.value) }}
                                disabled={
                                    loadingProvinces ||
                                    provinceError !== null ||
                                    provinces.length === 0
                                }
                                required
                            >
                                <option value="" disabled>
                                    {loadingProvinces
                                        ? "Đang tải tỉnh/thành phố..."
                                        : "Chọn tỉnh/thành phố"}
                                </option>
                                {provinces.map((province) => (
                                    <option key={province.id} value={province.id}>{province.name}</option>
                                ))}
                            </select>
                            {provinceError && (
                                <div className="address-form__load-error">
                                    <p role="alert">{provinceError}</p>

                                    <button
                                        type="button"
                                        onClick={() => setProvinceRetry((count) => count + 1)}
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            )}
                        </div>


                        <div className="address-form__field">
                            <label htmlFor="address-ward">
                                Xã/Phường
                            </label>

                            <select
                                id="address-ward"
                                name="wardId"
                                value={wardId}
                                onChange={(event) => setWardId(event.target.value)}
                                disabled={
                                    !provinceId ||
                                    loadingWards ||
                                    wardError !== null ||
                                    wards.length === 0
                                }
                                required
                            >
                                <option value="" disabled>
                                    {!provinceId
                                        ? "Chọn tỉnh/thành phố trước"
                                        : loadingWards
                                            ? "Đang tải xã/phường..."
                                            : "Chọn xã/phường"}
                                </option>
                                {provinceId && wards && (
                                    wards.map((ward) => (
                                        <option key={ward.id} value={ward.id}>{ward.name}</option>
                                    ))
                                )}
                            </select>
                            {wardError && (
                                <div className="address-form__load-error">
                                    <p role="alert">{wardError}</p>
                                    <button
                                        type="button"
                                        onClick={() => setWardRetry((count) => count + 1)}
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            )}
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
                </fieldset>
                {submitError && (
                    <p className="address-form__submit-error" role="alert">
                        {submitError}
                    </p>
                )}

                <div className="address-form__actions">
                    <button
                        type="button"
                        className="address-form__cancel"
                        onClick={handleDismiss}
                        disabled={saving}
                    >
                        Trở lại
                    </button>

                    <button
                        type="submit"
                        className="address-form__submit"
                        disabled={
                            saving ||
                            loadingProvinces ||
                            loadingWards ||
                            provinceError !== null ||
                            wardError !== null ||
                            !provinceId ||
                            !wardId
                        }
                    >
                        {saving ? "Đang lưu..." : "Hoàn thành"}
                    </button>
                </div>
            </form>
        </dialog>
    );
}