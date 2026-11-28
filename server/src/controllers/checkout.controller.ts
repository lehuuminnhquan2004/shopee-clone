import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

import {
    CheckoutError,
    createCheckout,
    createBuyNowCheckout,
} from "../services/checkout.service.js";

import {
    parseCreateCheckoutInput,
} from "../validators/checkout.validator.js";
import {
    parseBuyNowInput,
    parseCreateBuyNowCheckoutInput,
} from "../validators/buynow.validator.js";


export async function getCheckoutPreview(
    req: Request,
    res: Response
): Promise<void> {
    const user = req.authUser;

    if (!user) {
        res.status(401).json({
            message: "vui lòng đăng nhập"
        })
        return
    }
    try {
        const cartItems = await prisma.cartItem.findMany({
            where: {
                userId: user.id,
                selected: true,
            }, orderBy: [
                { updatedAt: "asc" },
                { id: "asc" },
            ],
            select: {
                id: true,
                quantity: true,
                model: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
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
                                        name: true,
                                        status: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
        if (cartItems.length === 0) {
            res.status(400).json({
                code: "NO_SELECTED_ITEMS",
                message: "Vui lòng chọn sản phẩm trong giỏ hàng.",
            });
            return;
        }
        for (const item of cartItems) {
            const model = item.model;
            const product = model.product;
            const shop = product.shop;

            const availableStock = model.inventory
                ? Math.max(
                    0,
                    model.inventory.stock - model.inventory.reservedStock,
                )
                : 0;

            let reason: string | null = null;

            if (shop.status !== "active") {
                reason = "Shop hiện không hoạt động";
            } else if (
                product.status !== "active" ||
                product.deletedAt !== null
            ) {
                reason = "Sản phẩm hiện không được bán";
            } else if (model.status !== "active") {
                reason = "Biến thể hiện không được bán";
            } else if (item.quantity <= 0) {
                reason = "Số lượng sản phẩm không hợp lệ";
            } else if (availableStock === 0) {
                reason = "Biến thể đã hết hàng";
            } else if (item.quantity > availableStock) {
                reason = `Chỉ còn ${availableStock} sản phẩm`;
            } else if (model.price < 0n) {
                reason = "Giá sản phẩm không hợp lệ";
            }

            if (reason) {
                res.status(409).json({
                    code: "CART_ITEM_UNAVAILABLE",
                    message: `${product.name}: ${reason}. Vui lòng kiểm tra lại giỏ hàng.`,
                    cartItemId: item.id.toString(),
                });
                return;
            }

        }

        // Chuyển dữ liệu sản phẩm thành dạng có thể trả qua JSON.
        const items = cartItems.map((item) => {
            const model = item.model;
            const product = model.product;

            return {
                cartItemId: item.id.toString(),
                quantity: item.quantity,
                unitPrice: model.price.toString(),
                lineTotal: (
                    model.price * BigInt(item.quantity)
                ).toString(),
                model: {
                    id: model.id.toString(),
                    name: model.name,
                },
                product: {
                    id: product.id.toString(),
                    name: product.name,
                    imageUrl:
                        model.tierOptions[0]?.tierOption.imageUrl ??
                        product.images[0]?.url ??
                        null,
                },
                shop: {
                    id: product.shop.id.toString(),
                    name: product.shop.name,
                },
            };
        });
        // Mỗi shop là một nhóm
        type PreviewItem = (typeof items)[number]

        type ShopGroup = {
            shop: PreviewItem['shop'],
            items: PreviewItem[],
            subtotal: bigint,
        }
        const groupMap = new Map<string, ShopGroup>();

        for (const item of items) {
            const existingGroup = groupMap.get(item.shop.id)

            if (existingGroup) {
                existingGroup.items.push(item)
                existingGroup.subtotal += BigInt(item.lineTotal)
            } else {
                groupMap.set(item.shop.id, {
                    shop: item.shop,
                    items: [item],
                    subtotal: BigInt(item.lineTotal),
                })
            }
        }
        const groups = Array.from(groupMap.values()).map((group) => {
            const shippingFee = 0n
            const discountAmount = 0n

            return {
                shop: group.shop,
                items: group.items,
                subtotal: group.subtotal.toString(),
                shippingFee: shippingFee.toString(),
                discountAmount: discountAmount.toString(),
                totalAmount: (
                    group.subtotal + shippingFee - discountAmount
                ).toString(),
            }
        })
        // Lấy địa chỉ mặc định, nếu ko có mặc định thì lấy địa chỉ mới nhất
        const address = await prisma.userAddress.findFirst({
            where: {
                userId: user.id,
                deletedAt: null,
            },
            orderBy: [
                { isDefault: "desc" },
                { createdAt: "desc" },
                { id: "desc" },
            ],
            select: {
                id: true,
                receiverName: true,
                receiverPhone: true,
                addressDetail: true,
                addressType: true,
                isDefault: true,
                ward: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        province: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        const selectedAddress = address
            ? {
                id: address.id.toString(),
                receiverName: address.receiverName,
                receiverPhone: address.receiverPhone,
                addressDetail: address.addressDetail,
                addressType: address.addressType,
                isDefault: address.isDefault,
                ward: {
                    id: address.ward.id,
                    code: address.ward.code,
                    name: address.ward.name,
                },
                province: address.ward.province,
            }
            : null;

        const subtotal = groups.reduce(
            (total, group) => total + BigInt(group.subtotal),
            0n,
        );

        const shippingTotal = groups.reduce(
            (total, group) => total + BigInt(group.shippingFee),
            0n,
        );

        const discountTotal = groups.reduce(
            (total, group) => total + BigInt(group.discountAmount),
            0n,
        );

        res.status(200).json({
            source: "cart",
            address: selectedAddress,
            groups,
            paymentMethod: "cod",
            canPlaceOrder: selectedAddress !== null,
            summary: {
                itemCount: items.length,
                totalQuantity: items.reduce(
                    (total, item) => total + item.quantity,
                    0,
                ),
                subtotal: subtotal.toString(),
                shippingTotal: shippingTotal.toString(),
                discountTotal: discountTotal.toString(),
                grandTotal: (
                    subtotal + shippingTotal - discountTotal
                ).toString(),
            },
        });
    } catch (error) {
        console.error("Lấy thông tin checkout thất bại:", error);

        res.status(500).json({
            message: "Không thể tải thông tin thanh toán.",
        });
    }
}

//Controller xư lý đặt hàng
export async function placeCheckout(
    req: Request,
    res: Response,
): Promise<void> {
    const user = req.authUser;

    if (!user) {
        res.status(401).json({
            code: "UNAUTHORIZED",
            message: "Vui lòng đăng nhập.",
        });
        return;
    }

    try {
        // Kiểm tra và chuẩn hóa dữ liệu trước khi gọi service.
        const parsed = parseCreateCheckoutInput(req.body);

        if (!parsed.success) {
            res.status(400).json({
                code: "INVALID_CHECKOUT_INPUT",
                message: parsed.message,
            });
            return;
        }

        // User ID lấy từ thông tin xác thực, không lấy từ body.
        const result = await createCheckout(
            user.id,
            parsed.data,
        );

        // Tạo mới: 201. Trả lại checkout đã tạo: 200.
        res.status(result.reused ? 200 : 201).json({
            message: result.reused
                ? "Yêu cầu này đã được đặt hàng thành công trước đó."
                : "Đặt hàng thành công.",
            reused: result.reused,
            checkout: result.checkout,
        });
    } catch (error) {
        // Lỗi nghiệp vụ do service chủ động trả về.
        if (error instanceof CheckoutError) {
            res.status(error.status).json({
                code: error.code,
                message: error.message,
            });
            return;
        }

        // Lỗi ngoài dự kiến: ghi chi tiết ở server.
        console.error("Đặt hàng thất bại:", error);

        res.status(500).json({
            code: "CHECKOUT_FAILED",
            message: "Không thể hoàn tất yêu cầu. Vui lòng thử lại với cùng mã yêu cầu.",
        });
    }
}

export async function getBuyNowCheckoutPreview(
    req: Request,
    res: Response,
): Promise<void> {
    const user = req.authUser;

    if (!user) {
        res.status(401).json({
            code: "UNAUTHORIZED",
            message: "Vui lòng đăng nhập.",
        });
        return;
    }

    try {
        const parsed = parseBuyNowInput(req.body);

        if (!parsed.success) {
            res.status(400).json({
                code: "INVALID_BUY_NOW_INPUT",
                message: parsed.message,
            });
            return;
        }

        const { modelId, quantity } = parsed.data;

        // Đọc giá, tồn kho và trạng thái hiện tại từ database.
        const model = await prisma.productModel.findUnique({
            where: {
                id: BigInt(modelId),
            },
            select: {
                id: true,
                name: true,
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
                            tier: {
                                position: "asc",
                            },
                        },
                    },
                    select: {
                        tierOption: {
                            select: {
                                imageUrl: true,
                            },
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
                            select: {
                                url: true,
                            },
                        },

                        shop: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });

        if (!model) {
            res.status(404).json({
                code: "MODEL_UNAVAILABLE",
                message: "Biến thể không tồn tại.",
            });
            return;
        }

        const product = model.product;
        const shop = product.shop;

        if (
            model.status !== "active" ||
            product.status !== "active" ||
            product.deletedAt !== null ||
            shop.status !== "active"
        ) {
            res.status(409).json({
                code: "PRODUCT_UNAVAILABLE",
                message: "Sản phẩm hiện không thể mua.",
            });
            return;
        }

        const availableStock = model.inventory
            ? Math.max(
                0,
                model.inventory.stock -
                    model.inventory.reservedStock,
            )
            : 0;

        if (quantity > availableStock) {
            res.status(409).json({
                code: "INSUFFICIENT_STOCK",
                message: availableStock === 0
                    ? "Biến thể đã hết hàng."
                    : `Biến thể hiện chỉ còn ${availableStock} sản phẩm.`,
            });
            return;
        }

        if (model.price < 0n || model.originalPrice < 0n) {
            res.status(409).json({
                code: "INVALID_PRODUCT_PRICE",
                message: "Giá sản phẩm không hợp lệ.",
            });
            return;
        }

        // Tính tiền bằng bigint để giữ độ chính xác.
        const subtotal = model.price * BigInt(quantity);

        if (subtotal > 9223372036854775807n) {
            res.status(400).json({
                code: "AMOUNT_LIMIT_EXCEEDED",
                message: "Tổng giá trị đơn hàng vượt giới hạn cho phép.",
            });
            return;
        }

        // Dùng cùng chính sách với checkout giỏ hàng hiện tại.
        const shippingTotal = 0n;
        const discountTotal = 0n;
        const grandTotal =
            subtotal + shippingTotal - discountTotal;

        // Ưu tiên địa chỉ mặc định; nếu không có thì lấy địa chỉ mới nhất.
        const address = await prisma.userAddress.findFirst({
            where: {
                userId: user.id,
                deletedAt: null,
            },
            orderBy: [
                { isDefault: "desc" },
                { createdAt: "desc" },
                { id: "desc" },
            ],
            select: {
                id: true,
                receiverName: true,
                receiverPhone: true,
                addressDetail: true,
                addressType: true,
                isDefault: true,

                ward: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        province: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        const selectedAddress = address
            ? {
                id: address.id.toString(),
                receiverName: address.receiverName,
                receiverPhone: address.receiverPhone,
                addressDetail: address.addressDetail,
                addressType: address.addressType,
                isDefault: address.isDefault,
                ward: {
                    id: address.ward.id,
                    code: address.ward.code,
                    name: address.ward.name,
                },
                province: address.ward.province,
            }
            : null;

        const shopData = {
            id: shop.id.toString(),
            name: shop.name,
        };

        // Mua ngay không có cartItemId.
        const item = {
            quantity,
            unitPrice: model.price.toString(),
            lineTotal: subtotal.toString(),

            model: {
                id: model.id.toString(),
                name: model.name,
            },

            product: {
                id: product.id.toString(),
                name: product.name,
                imageUrl:
                    model.tierOptions[0]?.tierOption.imageUrl ??
                    product.images[0]?.url ??
                    null,
            },

            shop: shopData,
        };

        res.status(200).json({
            source: "buy_now",
            address: selectedAddress,
            paymentMethod: "cod",
            canPlaceOrder: selectedAddress !== null,

            // Giữ cấu trúc nhóm shop để dễ dùng chung giao diện.
            groups: [
                {
                    shop: shopData,
                    items: [item],
                    subtotal: subtotal.toString(),
                    shippingFee: shippingTotal.toString(),
                    discountAmount: discountTotal.toString(),
                    totalAmount: grandTotal.toString(),
                },
            ],

            summary: {
                itemCount: 1,
                totalQuantity: quantity,
                subtotal: subtotal.toString(),
                shippingTotal: shippingTotal.toString(),
                discountTotal: discountTotal.toString(),
                grandTotal: grandTotal.toString(),
            },
        });
    } catch (error) {
        console.error("Xem trước Mua ngay thất bại:", error);

        res.status(500).json({
            code: "BUY_NOW_PREVIEW_FAILED",
            message: "Không thể tải thông tin mua ngay.",
        });
    }
}
//Controller xử lý đặt hàng khi ấn nút mua ngay
export async function placeBuyNowCheckout(
    req: Request,
    res: Response,
): Promise<void> {
    const user = req.authUser;

    if (!user) {
        res.status(401).json({
            code: "UNAUTHORIZED",
            message: "Vui lòng đăng nhập.",
        });
        return;
    }

    try {
        // Kiểm tra đầy đủ dữ liệu xác nhận đặt hàng.
        const parsed = parseCreateBuyNowCheckoutInput(req.body);

        if (!parsed.success) {
            res.status(400).json({
                code: "INVALID_BUY_NOW_INPUT",
                message: parsed.message,
            });
            return;
        }

        // User ID lấy từ phiên đăng nhập.
        const result = await createBuyNowCheckout(
            user.id,
            parsed.data,
        );

        res.status(result.reused ? 200 : 201).json({
            message: result.reused
                ? "Yêu cầu này đã được đặt hàng thành công trước đó."
                : "Đặt hàng thành công.",
            reused: result.reused,
            checkout: result.checkout,
        });
    } catch (error) {
        if (error instanceof CheckoutError) {
            res.status(error.status).json({
                code: error.code,
                message: error.message,
            });
            return;
        }

        console.error("Đặt hàng Mua ngay thất bại:", error);

        res.status(500).json({
            code: "BUY_NOW_CHECKOUT_FAILED",
            message:
                "Không thể hoàn tất yêu cầu. Vui lòng thử lại với cùng mã yêu cầu.",
        });
    }
}
