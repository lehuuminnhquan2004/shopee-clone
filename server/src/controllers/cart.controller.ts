import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

const MAX_BIGINT = 9223372036854775807n;
const MAX_INT = 2147483647;
const MAX_ATTEMPTS = 3;

//Lỗi nghiệp vụ: du lieu hop le nhung khong thực hiện được thao tác
class CartError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string,
    ) {
        super(message)
    }
}
export async function addCartItem(
    req: Request,
    res: Response
): Promise<void> {
    const user = req.authUser;

    if (!user) {
        res.status(401).json({
            message: "Chưa đăng nhập",
        })
        return
    }
    const rawModelId:unknown = req.body?.modelId;
    const quantity:unknown = req.body?.quantity;

    if (
        typeof rawModelId !== "string" ||
        !/^[1-9]\d{0,18}$/.test(rawModelId)
    ) {
        res.status(400).json({
            message: "ID biến thể không hợp lệ",
        });
        return;
    }
    const modelId = BigInt(rawModelId);

    if (modelId > MAX_BIGINT) {
        res.status(400).json({
            message: "ID biến thể vượt giới hạn cho phép",
        });
        return;
    }
    // quantity phải là số nguyên dương trong giới hạn INTEGER.
    if (
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > MAX_INT
    ) {
        res.status(400).json({
            message: "Số lượng phải là số nguyên dương hợp lệ",
        });
        return;
    }

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        try {
            const cartItem = await prisma.$transaction(
                async (tx) => {
                    const model = await tx.productModel.findFirst({
                        where: {
                            id: modelId,
                            status: "active",
                            product: {
                                status: "active",
                                deletedAt: null,
                                shop: {
                                    status: "active",
                                },
                            },
                        },
                        select: {
                            id: true,
                            inventory: {
                                select: {
                                    stock: true,
                                    reservedStock: true,
                                },
                            },
                        },
                    })
                    if (!model) {
                        throw new CartError(
                            404,
                            "MODEL_UNAVAILABLE",
                            "Biến thể không tồn tại hoặc hiện không được bán",
                        );
                    }
                    const availableStock = model.inventory ? model.inventory.stock - model.inventory.reservedStock : 0;

                    const existingItem = await tx.cartItem.findUnique({
                        where: {
                            userId_modelId: {
                                userId: user.id,
                                modelId
                            }
                        }, select: {
                            quantity: true
                        }
                    })
                    const nextQuantity = quantity + (existingItem?.quantity ?? 0)

                    if (nextQuantity > availableStock) {
                        throw new CartError(
                            409,
                            "INSUFFICIENT_STOCK",
                            "Tổng số lượng trong giỏ vượt quá số lượng còn có thể mua",
                        );
                    }
                    return tx.cartItem.upsert({
                        where: {
                            userId_modelId: {
                                userId: user.id,
                                modelId
                            }
                        },
                        create: {
                            userId: user.id,
                            modelId,
                            quantity,
                        },
                        update: {
                            quantity: nextQuantity,
                        },
                        select: {
                            id: true,
                            modelId: true,
                            quantity: true,
                            selected: true,
                        },
                    })

                },
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
            );

            //Transaction hoan tat
            res.status(200).json({
                message: "Đã thêm sản phẩm vào giỏ hàng",
                item: {
                    id: cartItem.id.toString(),
                    modelId: cartItem.modelId.toString(),
                    quantity: cartItem.quantity,
                    selected: cartItem.selected,
                },
            });
            return;
        } catch (err) {
            const isConflict = err instanceof Prisma.PrismaClientKnownRequestError &&
                (err.code === "P2034" || err.code === "P2002");

            if (isConflict) {
                if (attempt < MAX_ATTEMPTS - 1) {
                    continue
                }
                res.status(409).json({
                    code: "CART_BUSY",
                    message: "Giỏ hàng đang bận vui lòng thử lại"
                })
                return
            }
            if (err instanceof CartError) {
                res.status(err.status).json({
                    code: err.code,
                    message: err.message,
                })
                return
            }
            console.error("Add cart item error:", err);

            res.status(500).json({
                message: "Không thể thêm vào giỏ hàng. Vui lòng thử lại",
            });
            return;
        }
    }
}