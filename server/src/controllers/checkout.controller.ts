import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
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
        }
    } catch (error) {
        console.error("Lấy thông tin checkout thất bại:", error);

        res.status(500).json({
            message: "Không thể tải thông tin thanh toán.",
        });
    }
}