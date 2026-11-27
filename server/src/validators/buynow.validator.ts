const MAX_BIGINT = 9223372036854775807n;
const MAX_INT = 2147483647;

// Dữ liệu cần để xem trước một lần mua ngay.
// Chưa gồm địa chỉ hoặc idempotencyKey vì chưa đặt hàng.
export type BuyNowInput = {
    modelId: string;
    quantity: number;
};

type BuyNowValidationResult =
    | {
        success: true;
        data: BuyNowInput;
    }
    | {
        success: false;
        message: string;
    };

export function parseBuyNowInput(
    body: unknown,
): BuyNowValidationResult {
    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        return {
            success: false,
            message: "Dữ liệu mua ngay không hợp lệ.",
        };
    }

    const input = body as Record<string, unknown>;
    const modelId = input.modelId;
    const quantity = input.quantity;

    // ID phải là chuỗi số nguyên dương, không có số 0 ở đầu.
    if (
        typeof modelId !== "string" ||
        !/^[1-9]\d{0,18}$/.test(modelId)
    ) {
        return {
            success: false,
            message: "ID biến thể không hợp lệ.",
        };
    }

    // Chỉ chuyển sang bigint sau khi đã kiểm tra định dạng.
    if (BigInt(modelId) > MAX_BIGINT) {
        return {
            success: false,
            message: "ID biến thể vượt giới hạn cho phép.",
        };
    }

    if (
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > MAX_INT
    ) {
        return {
            success: false,
            message: "Số lượng phải là số nguyên dương hợp lệ.",
        };
    }

    // Chỉ trả các trường được phép.
    return {
        success: true,
        data: {
            modelId,
            quantity,
        },
    };
}