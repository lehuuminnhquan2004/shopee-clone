import { createHash } from "node:crypto";

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


export type CreateBuyNowCheckoutInput = BuyNowInput & {
    addressId: string;
    paymentMethod: "cod";
    expectedUnitPrice: string;
    expectedGrandTotal: string;
    idempotencyKey: string;
};

type CreateBuyNowValidationResult =
    | {
        success: true;
        data: CreateBuyNowCheckoutInput;
    }
    | {
        success: false;
        message: string;
    };

function isBigIntString(
    value: unknown,
    allowZero = false,
): value is string {
    if (typeof value !== "string") return false;

    const pattern = allowZero
        ? /^(0|[1-9]\d{0,18})$/
        : /^[1-9]\d{0,18}$/;

    return pattern.test(value) && BigInt(value) <= MAX_BIGINT;
}

export function parseCreateBuyNowCheckoutInput(
    body: unknown,
): CreateBuyNowValidationResult {
    // Tái sử dụng kiểm tra body, modelId và quantity.
    const selection = parseBuyNowInput(body);

    if (!selection.success) {
        return {
            success: false,
            message: selection.message,
        };
    }

    // parseBuyNowInput đã xác nhận body là object hợp lệ.
    const input = body as Record<string, unknown>;

    if (!isBigIntString(input.addressId)) {
        return {
            success: false,
            message: "ID địa chỉ không hợp lệ.",
        };
    }

    if (input.paymentMethod !== "cod") {
        return {
            success: false,
            message: "Hiện chỉ hỗ trợ thanh toán khi nhận hàng.",
        };
    }

    if (!isBigIntString(input.expectedUnitPrice, true)) {
        return {
            success: false,
            message: "Đơn giá xác nhận không hợp lệ.",
        };
    }

    if (!isBigIntString(input.expectedGrandTotal, true)) {
        return {
            success: false,
            message: "Tổng thanh toán không hợp lệ.",
        };
    }

    if (
        typeof input.idempotencyKey !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            input.idempotencyKey,
        )
    ) {
        return {
            success: false,
            message: "Mã yêu cầu đặt hàng không hợp lệ.",
        };
    }

    // Chỉ trả các trường đã kiểm tra.
    return {
        success: true,
        data: {
            modelId: selection.data.modelId,
            quantity: selection.data.quantity,
            addressId: input.addressId,
            paymentMethod: input.paymentMethod,
            expectedUnitPrice: input.expectedUnitPrice,
            expectedGrandTotal: input.expectedGrandTotal,
            idempotencyKey: input.idempotencyKey.toLowerCase(),
        },
    };
}

// Chỉ gọi sau khi dữ liệu đã qua validator.
export function createBuyNowCheckoutRequestHash(
    input: CreateBuyNowCheckoutInput,
): string {
    const content = {
        source: "buy_now",
        modelId: input.modelId,
        quantity: input.quantity,
        addressId: input.addressId,
        paymentMethod: input.paymentMethod,
        expectedUnitPrice: input.expectedUnitPrice,
        expectedGrandTotal: input.expectedGrandTotal,
    };

    return createHash("sha256")
        .update(JSON.stringify(content))
        .digest("hex");
}