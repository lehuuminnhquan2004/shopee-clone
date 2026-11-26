import { randomBytes } from "node:crypto";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import {
    createCheckoutRequestHash,
    type CreateCheckoutInput,
} from "../validators/checkout.validator.js";

const MAX_BIGINT = 9223372036854775807n;

export class CheckoutError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = "CheckoutError";
    }
}
//Chuẩn bị dữ liệu
export async function prepareCheckout(
    tx: Prisma.TransactionClient,
    userId: bigint,
    input: CreateCheckoutInput,
) {
    // Địa chỉ phải thuộc người đang đặt hàng và chưa bị xóa.
    const address = await tx.userAddress.findFirst({
        where: {
            id: BigInt(input.addressId),
            userId,
            deletedAt: null,
        },
        select: {
            receiverName: true,
            receiverPhone: true,
            addressDetail: true,
            ward: {
                select: {
                    id: true,
                    name: true,
                    province: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    if (!address) {
        throw new CheckoutError(
            404,
            "ADDRESS_UNAVAILABLE",
            "Địa chỉ nhận hàng không tồn tại hoặc không còn khả dụng.",
        );
    }

    // Chỉ lấy đúng các dòng người dùng đang xác nhận đặt.
    const cartItems = await tx.cartItem.findMany({
        where: {
            userId,
            selected: true,
            id: {
                in: input.items.map((item) => BigInt(item.cartItemId)),
            },
        },
        orderBy: {
            modelId: "asc",
        },
        select: {
            id: true,
            quantity: true,
            model: {
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    price: true,
                    originalPrice: true,
                    status: true,
                    inventory: {
                        select: {
                            stock: true,
                            reservedStock: true,
                        },
                    },
                    tierOptions: {
                        orderBy: {
                            tierOption: {
                                tier: { position: "asc" },
                            },
                        },
                        select: {
                            tierOption: {
                                select: { imageUrl: true },
                            },
                        },
                    },
                    product: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            deletedAt: true,
                            images: {
                                orderBy: [
                                    { position: "asc" },
                                    { id: "asc" },
                                ],
                                take: 1,
                                select: { url: true },
                            },
                            shop: {
                                select: {
                                    id: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    // Validator đã chặn ID trùng.
    // Nếu thiếu dòng thì có dòng đã bị xóa, bỏ chọn hoặc không thuộc user.
    if (cartItems.length !== input.items.length) {
        throw new CheckoutError(
            409,
            "CART_CHANGED",
            "Giỏ hàng đã thay đổi. Vui lòng kiểm tra lại trước khi đặt.",
        );
    }

    const expectedItems = new Map(
        input.items.map((item) => [item.cartItemId, item]),
    );

    const items = cartItems.map((item) => {
        const expected = expectedItems.get(item.id.toString());
        const model = item.model;
        const product = model.product;
        const shop = product.shop;

        if (!expected || item.quantity !== expected.quantity) {
            throw new CheckoutError(
                409,
                "QUANTITY_CHANGED",
                "Số lượng trong giỏ hàng đã thay đổi. Vui lòng tải lại checkout.",
            );
        }

        if (
            shop.status !== "active" ||
            product.status !== "active" ||
            product.deletedAt !== null ||
            model.status !== "active"
        ) {
            throw new CheckoutError(
                409,
                "PRODUCT_UNAVAILABLE",
                `${product.name}: sản phẩm hiện không thể mua.`,
            );
        }

        if (model.price < 0n || model.originalPrice < 0n) {
            throw new CheckoutError(
                409,
                "INVALID_PRODUCT_PRICE",
                `${product.name}: giá sản phẩm không hợp lệ.`,
            );
        }

        if (model.price !== BigInt(expected.expectedUnitPrice)) {
            throw new CheckoutError(
                409,
                "PRICE_CHANGED",
                `${product.name}: giá đã thay đổi. Vui lòng tải lại checkout.`,
            );
        }

        const availableStock = model.inventory
            ? model.inventory.stock - model.inventory.reservedStock
            : 0;

        if (availableStock < item.quantity) {
            throw new CheckoutError(
                409,
                "INSUFFICIENT_STOCK",
                `${product.name}: không đủ số lượng còn có thể mua.`,
            );
        }

        const lineTotal = model.price * BigInt(item.quantity);

        if (lineTotal > MAX_BIGINT) {
            throw new CheckoutError(
                400,
                "AMOUNT_LIMIT_EXCEEDED",
                "Giá trị dòng hàng vượt giới hạn cho phép.",
            );
        }

        // Dữ liệu snapshot sẽ được ghi vào OrderItem.
        return {
            cartItemId: item.id,
            shopId: shop.id,
            productId: product.id,
            modelId: model.id,
            productName: product.name,
            modelName: model.name,
            sku: model.sku,
            imageUrl:
                model.tierOptions[0]?.tierOption.imageUrl ??
                product.images[0]?.url ??
                null,
            unitPrice: model.price,
            originalPrice: model.originalPrice,
            quantity: item.quantity,
            lineTotal,
        };
    });

    const subtotal = items.reduce(
        (total, item) => total + item.lineTotal,
        0n,
    );

    // Giữ cùng chính sách với API preview hiện tại.
    const shippingTotal = 0n;
    const discountTotal = 0n;
    const grandTotal = subtotal + shippingTotal - discountTotal;

    if (subtotal > MAX_BIGINT || grandTotal > MAX_BIGINT) {
        throw new CheckoutError(
            400,
            "AMOUNT_LIMIT_EXCEEDED",
            "Tổng giá trị đơn hàng vượt giới hạn cho phép.",
        );
    }

    if (grandTotal !== BigInt(input.expectedGrandTotal)) {
        throw new CheckoutError(
            409,
            "TOTAL_CHANGED",
            "Tổng thanh toán đã thay đổi. Vui lòng tải lại checkout.",
        );
    }

    return {
        items,
        subtotal,
        shippingTotal,
        discountTotal,
        grandTotal,

        // Sao chép địa chỉ để đơn cũ không đổi theo sổ địa chỉ.
        shippingAddressData: {
            receiverName: address.receiverName,
            receiverPhone: address.receiverPhone,
            shippingAddress: [
                address.addressDetail,
                address.ward.name,
                address.ward.province.name,
            ].join(", "),
            wardId: address.ward.id,
            provinceId: address.ward.province.id,
        },
    };
}

//Lấy kiểu dữ liệu hàm PreparedCheckout trả về
type PreparedCheckout = Awaited<
    ReturnType<typeof prepareCheckout>
>;
//Hàm dữ tồn kho
export async function reserveCheckoutStock(
    tx: Prisma.TransactionClient,
    items: PreparedCheckout["items"],
): Promise<void> {
    // Luôn cập nhật theo cùng thứ tự modelId.
    // Giúp giảm khả năng các transaction khóa chéo nhau.
    const sortedItems = [...items].sort((a, b) =>
        a.modelId < b.modelId
            ? -1
            : a.modelId > b.modelId
                ? 1
                : 0,
    );

    for (const item of sortedItems) {
        // Kiểm tra tồn kho và giữ hàng trong cùng một câu UPDATE.
        const affectedRows = await tx.$executeRaw`
            UPDATE "inventories"
            SET
                "reserved_stock" =
                    "reserved_stock" + ${item.quantity},
                "updated_at" = CURRENT_TIMESTAMP
            WHERE
                "model_id" = ${item.modelId}
                AND "stock" - "reserved_stock" >= ${item.quantity}
        `;

        if (affectedRows !== 1) {
            throw new CheckoutError(
                409,
                "INSUFFICIENT_STOCK",
                `${item.productName}: số lượng còn lại không đủ. Vui lòng tải lại checkout.`,
            );
        }
    }
}

// Dùng chung khi tạo mới và khi trả lại checkout đã tồn tại.
const checkoutResultSelect = {
    id: true,
    checkoutCode: true,
    grandTotal: true,
    paymentMethod: true,
    paymentStatus: true,
    orders: {
        orderBy: { id: "asc" },
        select: {
            id: true,
            orderCode: true,
            shopId: true,
            status: true,
            totalAmount: true,
        },
    },
} satisfies Prisma.CheckoutSelect;

function generateCode(prefix: "CO" | "OD"): string {
    return `${prefix}${randomBytes(12).toString("hex")}`;
}

//Tạo checkout và order
export async function createCheckout(
    userId: bigint,
    input: CreateCheckoutInput,
) {
    const requestHash = createCheckoutRequestHash(input);
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const result = await prisma.$transaction(
                async (tx) => {
                    // Phải kiểm tra yêu cầu cũ trước khi đọc giỏ hàng.
                    // Nếu đặt thành công trước đó, các dòng giỏ đã bị xóa.
                    const existing = await tx.checkout.findUnique({
                        where: {
                            userId_idempotencyKey: {
                                userId,
                                idempotencyKey: input.idempotencyKey,
                            },
                        },
                        select: {
                            ...checkoutResultSelect,
                            requestHash: true,
                        },
                    });

                    if (existing) {
                        if (existing.requestHash !== requestHash) {
                            throw new CheckoutError(
                                409,
                                "IDEMPOTENCY_KEY_REUSED",
                                "Mã yêu cầu này đã được dùng với nội dung đặt hàng khác.",
                            );
                        }

                        return {
                            checkout: existing,
                            reused: true,
                        };
                    }

                    // Kiểm tra lại dữ liệu và tính tiền từ database.
                    const prepared = await prepareCheckout(
                        tx,
                        userId,
                        input,
                    );

                    // Giữ hàng trong cùng transaction tạo đơn.
                    await reserveCheckoutStock(tx, prepared.items);

                    const checkout = await tx.checkout.create({
                        data: {
                            checkoutCode: generateCode("CO"),
                            userId,
                            subtotal: prepared.subtotal,
                            shippingTotal: prepared.shippingTotal,
                            discountTotal: prepared.discountTotal,
                            grandTotal: prepared.grandTotal,
                            paymentMethod: input.paymentMethod,
                            paymentStatus: "unpaid",
                            idempotencyKey: input.idempotencyKey,
                            requestHash,
                        },
                        select: {
                            id: true,
                        },
                    });

                    // Gom sản phẩm theo shop.
                    const shopGroups = new Map<
                        bigint,
                        PreparedCheckout["items"]
                    >();

                    for (const item of prepared.items) {
                        const group = shopGroups.get(item.shopId);

                        if (group) {
                            group.push(item);
                        } else {
                            shopGroups.set(item.shopId, [item]);
                        }
                    }

                    // Mỗi shop tạo một đơn riêng.
                    for (const [shopId, items] of shopGroups) {
                        const subtotal = items.reduce(
                            (total, item) => total + item.lineTotal,
                            0n,
                        );

                        // Hiện tại đồng bộ với preview: chưa tính
                        // phí vận chuyển hoặc giảm giá.
                        const shippingFee = 0n;
                        const shopVoucherDiscount = 0n;
                        const platformVoucherDiscount = 0n;

                        const totalAmount =
                            subtotal +
                            shippingFee -
                            shopVoucherDiscount -
                            platformVoucherDiscount;

                        await tx.order.create({
                            data: {
                                orderCode: generateCode("OD"),
                                checkoutId: checkout.id,
                                userId,
                                shopId,
                                status: "pending_confirm",

                                ...prepared.shippingAddressData,

                                subtotal,
                                shippingFee,
                                shopVoucherDiscount,
                                platformVoucherDiscount,
                                totalAmount,

                                items: {
                                    create: items.map((item) => ({
                                        productId: item.productId,
                                        modelId: item.modelId,
                                        productName: item.productName,
                                        modelName: item.modelName,
                                        sku: item.sku,
                                        imageUrl: item.imageUrl,
                                        unitPrice: item.unitPrice,
                                        originalPrice: item.originalPrice,
                                        quantity: item.quantity,
                                        lineTotal: item.lineTotal,
                                    })),
                                },
                            },
                            select: {
                                id: true,
                            },
                        });
                    }

                    // Chỉ xóa các dòng đã được đưa vào đơn.
                    const deleted = await tx.cartItem.deleteMany({
                        where: {
                            userId,
                            selected: true,
                            id: {
                                in: prepared.items.map(
                                    (item) => item.cartItemId,
                                ),
                            },
                        },
                    });

                    if (deleted.count !== prepared.items.length) {
                        throw new CheckoutError(
                            409,
                            "CART_CHANGED",
                            "Giỏ hàng đã thay đổi. Vui lòng tải lại checkout.",
                        );
                    }

                    const created = await tx.checkout.findUniqueOrThrow({
                        where: {
                            id: checkout.id,
                        },
                        select: checkoutResultSelect,
                    });

                    return {
                        checkout: created,
                        reused: false,
                    };
                },
                {
                    isolationLevel:
                        Prisma.TransactionIsolationLevel.Serializable,
                    maxWait: 5000,
                    timeout: 15000,
                },
            );

            // Chuyển bigint thành string trước khi trả cho controller.
            // Chỉ trả các trường được phép, không trả requestHash.
            return {
                reused: result.reused,
                checkout: {
                    id: result.checkout.id.toString(),
                    checkoutCode: result.checkout.checkoutCode,
                    grandTotal: result.checkout.grandTotal.toString(),
                    paymentMethod: result.checkout.paymentMethod,
                    paymentStatus: result.checkout.paymentStatus,
                    orders: result.checkout.orders.map((order) => ({
                        id: order.id.toString(),
                        orderCode: order.orderCode,
                        shopId: order.shopId.toString(),
                        status: order.status,
                        totalAmount: order.totalAmount.toString(),
                    })),
                },
            };
        } catch (error) {
            // Lỗi nghiệp vụ như hết hàng, đổi giá: trả ngay.
            if (error instanceof CheckoutError) {
                throw error;
            }

            if (
                error instanceof Prisma.PrismaClientKnownRequestError
            ) {
                // Câu SQL trực tiếp có thể trả lỗi xung đột
                // thông qua P2010 và mã lỗi PostgreSQL.
                const rawTransactionConflict =
                    error.code === "P2010" &&
                    (
                        error.meta?.code === "40001" ||
                        error.meta?.code === "40P01"
                    );

                const retryable =
                    error.code === "P2034" ||
                    error.code === "P2002" ||
                    rawTransactionConflict;

                if (retryable) {
                    if (attempt < maxAttempts) {
                        // Chờ ngắn rồi chạy lại TOÀN BỘ transaction.
                        await new Promise<void>((resolve) => {
                            setTimeout(resolve, attempt * 50);
                        });

                        continue;
                    }

                    throw new CheckoutError(
                        409,
                        "CHECKOUT_RETRY_REQUIRED",
                        "Chưa thể hoàn tất đặt hàng. Vui lòng thử lại với cùng mã yêu cầu.",
                    );
                }
            }

            throw error;
        }
    }

    // Phòng trường hợp vòng lặp kết thúc mà không trả kết quả.
    throw new CheckoutError(
        503,
        "CHECKOUT_UNAVAILABLE",
        "Hiện không thể tạo đơn hàng. Vui lòng thử lại.",
    );
}