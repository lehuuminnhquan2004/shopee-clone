import { createHash } from "node:crypto";

const MAX_BIGINT = 9223372036854775807n;
const MAX_INT = 2147483647;

// Giới hạn số dòng cho một lần đặt hàng.
const MAX_CHECKOUT_ITEMS = 100;

export type CreateCheckoutInput = {
    idempotencyKey: string;
    addressId: string;
    paymentMethod: "cod";
    items: {
        cartItemId: string;
        quantity: number;
        expectedUnitPrice: string;
    }[];
    expectedGrandTotal: string;
}

type ValidationResult =
    | {
        success: true;
        data: CreateCheckoutInput;
    }
    | {
        success: false;
        message: string;
    }

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    )
}

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

//Ham kiem tra du lieu dau vao cua Checkout
export function parseCreateCheckoutInput(
    body: unknown,
): ValidationResult {
    if (!isRecord(body)) {
        return {
            success: false,
            message: "Dữ liệu đặt hàng không hợp lệ.",
        };
    }

    // Client sẽ tạo UUID v4 bằng crypto.randomUUID().
    if (
        typeof body.idempotencyKey !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            body.idempotencyKey,
        )
    ) {
        return {
            success: false,
            message: "Mã yêu cầu đặt hàng không hợp lệ.",
        };
    }

    if (!isBigIntString(body.addressId)) {
        return {
            success: false,
            message: "ID địa chỉ không hợp lệ.",
        };
    }

    if (body.paymentMethod !== "cod") {
        return {
            success: false,
            message: "Hiện chỉ hỗ trợ thanh toán khi nhận hàng.",
        };
    }

    if (!isBigIntString(body.expectedGrandTotal, true)) {
        return {
            success: false,
            message: "Tổng thanh toán không hợp lệ.",
        };
    }

    if (
        !Array.isArray(body.items) ||
        body.items.length === 0 ||
        body.items.length > MAX_CHECKOUT_ITEMS
    ) {
        return {
            success: false,
            message: `Mỗi lần đặt hàng cần từ 1 đến ${MAX_CHECKOUT_ITEMS} dòng sản phẩm.`,
        };
    }

    const items: CreateCheckoutInput["items"] = [];
    const seenIds = new Set<string>();

    for (const rawItem of body.items) {
        if (
            !isRecord(rawItem) ||
            !isBigIntString(rawItem.cartItemId)
        ) {
            return {
                success: false,
                message: "ID dòng giỏ hàng không hợp lệ.",
            };
        }

        if (seenIds.has(rawItem.cartItemId)) {
            return {
                success: false,
                message: "Danh sách đặt hàng có dòng giỏ hàng bị trùng.",
            };
        }

        if (
            typeof rawItem.quantity !== "number" ||
            !Number.isInteger(rawItem.quantity) ||
            rawItem.quantity <= 0 ||
            rawItem.quantity > MAX_INT
        ) {
            return {
                success: false,
                message: "Số lượng sản phẩm không hợp lệ.",
            };
        }

        if (!isBigIntString(rawItem.expectedUnitPrice, true)) {
            return {
                success: false,
                message: "Giá sản phẩm không hợp lệ.",
            };
        }

        seenIds.add(rawItem.cartItemId);

        // Chỉ lấy các trường được phép.
        items.push({
            cartItemId: rawItem.cartItemId,
            quantity: rawItem.quantity,
            expectedUnitPrice: rawItem.expectedUnitPrice,
        });
    }

    // Chuẩn hóa thứ tự để cùng các dòng hàng cho cùng một hash.
    items.sort((a, b) =>
        a.cartItemId < b.cartItemId
            ? -1
            : a.cartItemId > b.cartItemId
                ? 1
                : 0,
    );

    return {
        success: true,
        data: {
            idempotencyKey: body.idempotencyKey.toLowerCase(),
            addressId: body.addressId,
            paymentMethod: "cod",
            items,
            expectedGrandTotal: body.expectedGrandTotal,
        },
    };
}
// Hàm tạo hash cho checkout chỉ gọi sau khi đã kiểm tra 
export function createCheckoutRequestHash(
    input: CreateCheckoutInput,
): string {
    const content = {
        addressId: input.addressId,
        paymentMethod: input.paymentMethod,
        items: input.items,
        expectedGrandTotal: input.expectedGrandTotal,
    };

    return createHash("sha256")
        .update(JSON.stringify(content))
        .digest("hex");
}