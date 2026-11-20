import type { Province, Ward } from "./location";

export type AddressType = "home" | "office";

    // Dữ liệu nhận từ GET /api/addresses.
    export type UserAddress = {
        id: string;
        receiverName: string;
        receiverPhone: string;
        addressDetail: string;
        addressType: AddressType;
        isDefault: boolean;
        ward: Pick<Ward, "id" | "code" | "name">;
        province: Province;
    };

// API sửa yêu cầu đầy đủ các trường thông tin này.
export type UpdateAddressPayload = {
    receiverName: string;
    receiverPhone: string;
    addressDetail: string;
    wardId: number;
    addressType: AddressType;
};

// Khi tạo mới, người dùng được chọn đặt làm mặc định.
export type CreateAddressPayload = UpdateAddressPayload & {
    isDefault: boolean;
};

// Cả tạo, sửa và đặt mặc định đều trả cấu trúc này.
export type AddressMutationResponse = {
    message: string;
    address: {
        id: string;
        isDefault: boolean;
    };
};

export type DeleteAddressResponse = {
    message: string;
};