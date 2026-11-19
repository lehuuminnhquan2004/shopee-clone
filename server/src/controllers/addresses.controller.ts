import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

export async function getMyAddresses(
    req: Request,
    res: Response,
): Promise<void> {
    const user = req.authUser;

    if (!user) {
        res.status(401).json({
            message: "Vui lòng đăng nhập",
        });
        return;
    }

    try {
        const addresses = await prisma.userAddress.findMany({
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

        const result = addresses.map((address) => ({
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
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error("Lấy danh sách địa chỉ thất bại:", error);

        res.status(500).json({
            message: "Không thể tải danh sách địa chỉ",
        });
    }
}

export async function createAddress(
    req: Request,
    res: Response,
): Promise<void> {
    const user = req.authUser;

    if (!user) {
        res.status(401).json({ message: "Vui lòng đăng nhập" });
        return;
    }

    const rawName: unknown = req.body?.receiverName;
    const rawPhone: unknown = req.body?.receiverPhone;
    const rawDetail: unknown = req.body?.addressDetail;
    const wardId: unknown = req.body?.wardId;
    const addressType: unknown = req.body?.addressType;
    const isDefault: unknown = req.body?.isDefault;

    // Kiểm tra kiểu trước khi gọi trim().
    if (
        typeof rawName !== "string" ||
        typeof rawPhone !== "string" ||
        typeof rawDetail !== "string"
    ) {
        res.status(400).json({
            message: "Tên, số điện thoại và địa chỉ phải là chuỗi",
        });
        return;
    }

    const receiverName = rawName.trim();
    const receiverPhone = rawPhone.trim();
    const addressDetail = rawDetail.trim();

    if (
        !receiverName ||
        Array.from(receiverName).length > 100
    ) {
        res.status(400).json({
            message: "Tên người nhận phải có từ 1 đến 100 ký tự",
        });
        return;
    }

    // Bản đầu hỗ trợ số điện thoại nội địa: 10 chữ số, bắt đầu bằng 0.
    // Đây là kiểm tra định dạng, không xác minh số đang hoạt động.
    if (!/^0\d{9}$/.test(receiverPhone)) {
        res.status(400).json({
            message: "Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0",
        });
        return;
    }

    if (
        !addressDetail ||
        Array.from(addressDetail).length > 255
    ) {
        res.status(400).json({
            message: "Địa chỉ chi tiết phải có từ 1 đến 255 ký tự",
        });
        return;
    }

    if (
        typeof wardId !== "number" ||
        !Number.isInteger(wardId) ||
        wardId <= 0 ||
        wardId > 2147483647
    ) {
        res.status(400).json({
            message: "ID xã/phường không hợp lệ",
        });
        return;
    }

    if (addressType !== "home" && addressType !== "office") {
        res.status(400).json({
            message: "Loại địa chỉ phải là home hoặc office",
        });
        return;
    }

    if (typeof isDefault !== "boolean") {
        res.status(400).json({
            message: "isDefault phải là true hoặc false",
        });
        return;
    }

    try {
        const address = await prisma.$transaction(
            async (tx) => {
                const ward = await tx.ward.findUnique({
                    where: { id: wardId },
                    select: { id: true },
                });

                if (!ward) return null;

                const currentDefault = await tx.userAddress.findFirst({
                    where: {
                        userId: user.id,
                        deletedAt: null,
                        isDefault: true,
                    },
                    select: { id: true },
                });

                // Nếu chưa có mặc định, tự chọn địa chỉ mới.
                const shouldBeDefault =
                    isDefault || currentDefault === null;

                if (shouldBeDefault) {
                    await tx.userAddress.updateMany({
                        where: {
                            userId: user.id,
                            deletedAt: null,
                            isDefault: true,
                        },
                        data: {
                            isDefault: false,
                        },
                    });
                }

                return tx.userAddress.create({
                    data: {
                        userId: user.id,
                        wardId,
                        receiverName,
                        receiverPhone,
                        addressDetail,
                        addressType,
                        isDefault: shouldBeDefault,
                    },
                    select: {
                        id: true,
                        isDefault: true,
                    },
                });
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            },
        );

        if (!address) {
            res.status(400).json({
                message: "Xã/phường không tồn tại",
            });
            return;
        }

        res.status(201).json({
            message: "Thêm địa chỉ thành công",
            address: {
                id: address.id.toString(),
                isDefault: address.isDefault,
            },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2034" || error.code === "P2002") {
                res.status(409).json({
                    message:
                        "Địa chỉ vừa được thay đổi bởi thao tác khác. " +
                        "Vui lòng thử lại",
                });
                return;
            }
        }

        console.error("Thêm địa chỉ thất bại:", error);

        res.status(500).json({
            message: "Không thể thêm địa chỉ. Vui lòng thử lại",
        });
    }
}

export async function setDefaultAddress(
    req: Request,
    res: Response
): Promise<void> {
    const user = req.authUser
    if (!user) {
        res.status(401).json({
            message: "Vui lòng đăng nhập"
        })
        return
    }

    const rawAddressId = req.params.addressId
    if (
        typeof rawAddressId !== "string" ||
        !/^[1-9]\d{0,18}$/.test(rawAddressId)
    ) {
        res.status(400).json({
            message: "ID địa chỉ không hợp lệ",
        });
        return;
    }

    const addressId = BigInt(rawAddressId)

    if (addressId > 9223372036854775807n) {
        res.status(400).json({
            message: "ID địa chỉ vượt giới hạn cho phép",
        });
        return;
    }

    try {
        const address = await prisma.$transaction(
            async (tx) => {
                const target = await tx.userAddress.findFirst({
                    where: {
                        userId: user.id,
                        id: addressId,
                        deletedAt: null
                    }, select: {
                        id: true,
                        isDefault: true
                    }
                })
                if (!target) return null
                if (target.isDefault) return target

                await tx.userAddress.updateMany({
                    where: {
                        userId: user.id,
                        deletedAt: null,
                        isDefault: true,
                    }, data: {
                        isDefault: false
                    },
                })

                return tx.userAddress.update({
                    where: {
                        id: addressId,
                        userId: user.id,
                        deletedAt: null,
                    },
                    data: {
                        isDefault: true,
                    },
                    select: {
                        id: true,
                        isDefault: true,
                    },
                });
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        )
        if (!address) {
            res.status(404).json({
                message: "Không tìm thấy địa chỉ",
            });
            return;
        }

        res.status(200).json({
            message: "Đã đặt địa chỉ mặc định",
            address: {
                id: address.id.toString(),
                isDefault: address.isDefault,
            },
        });

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2034" || error.code === "P2002") {
                res.status(409).json({
                    message: "Địa chỉ đã thay đổi bởi thao tác khác vui lòng thử lại"
                })
                return
            }

            if (error.code === "P2025") {
                res.status(404).json({
                    message: "Địa chỉ không còn khả dụng"
                })
                return
            }
        }
        console.error("Đặt địa chỉ mặc định thất bại:", error);
        res.status(500).json({
            message: "Không thể đặt địa chỉ mặc định",
        });

    }
}

export async function updateAddress(
    req: Request,
    res: Response,
): Promise<void> {
    const user = req.authUser;

    if (!user) {
        res.status(401).json({ message: "Vui lòng đăng nhập" });
        return;
    }

    // ID địa chỉ là BigInt, không chuyển qua Number.
    const rawAddressId = req.params.addressId;

    if (
        typeof rawAddressId !== "string" ||
        !/^[1-9]\d{0,18}$/.test(rawAddressId)
    ) {
        res.status(400).json({ message: "ID địa chỉ không hợp lệ" });
        return;
    }

    const addressId = BigInt(rawAddressId);

    if (addressId > 9223372036854775807n) {
        res.status(400).json({
            message: "ID địa chỉ vượt giới hạn cho phép",
        });
        return;
    }

    const rawName: unknown = req.body?.receiverName;
    const rawPhone: unknown = req.body?.receiverPhone;
    const rawDetail: unknown = req.body?.addressDetail;
    const wardId: unknown = req.body?.wardId;
    const addressType: unknown = req.body?.addressType;

    if (
        typeof rawName !== "string" ||
        typeof rawPhone !== "string" ||
        typeof rawDetail !== "string"
    ) {
        res.status(400).json({
            message: "Tên, số điện thoại và địa chỉ phải là chuỗi",
        });
        return;
    }

    const receiverName = rawName.trim();
    const receiverPhone = rawPhone.trim();
    const addressDetail = rawDetail.trim();

    if (!receiverName || Array.from(receiverName).length > 100) {
        res.status(400).json({
            message: "Tên người nhận phải có từ 1 đến 100 ký tự",
        });
        return;
    }

    if (!/^0\d{9}$/.test(receiverPhone)) {
        res.status(400).json({
            message: "Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0",
        });
        return;
    }

    if (!addressDetail || Array.from(addressDetail).length > 255) {
        res.status(400).json({
            message: "Địa chỉ chi tiết phải có từ 1 đến 255 ký tự",
        });
        return;
    }

    if (
        typeof wardId !== "number" ||
        !Number.isInteger(wardId) ||
        wardId <= 0 ||
        wardId > 2147483647
    ) {
        res.status(400).json({
            message: "ID xã/phường không hợp lệ",
        });
        return;
    }

    if (addressType !== "home" && addressType !== "office") {
        res.status(400).json({
            message: "Loại địa chỉ phải là home hoặc office",
        });
        return;
    }

    try {
        // Kiểm tra địa chỉ thuộc người đăng nhập và chưa bị xóa.
        const target = await prisma.userAddress.findFirst({
            where: {
                id: addressId,
                userId: user.id,
                deletedAt: null,
            },
            select: { id: true },
        });

        if (!target) {
            res.status(404).json({
                message: "Không tìm thấy địa chỉ",
            });
            return;
        }

        const ward = await prisma.ward.findUnique({
            where: { id: wardId },
            select: { id: true },
        });

        if (!ward) {
            res.status(400).json({
                message: "Xã/phường không tồn tại",
            });
            return;
        }

        const address = await prisma.userAddress.update({
            // Kiểm tra lại điều kiện ngay tại thao tác ghi.
            where: {
                id: addressId,
                userId: user.id,
                deletedAt: null,
            },
            // Chỉ cập nhật các trường được phép.
            data: {
                receiverName,
                receiverPhone,
                addressDetail,
                wardId,
                addressType,
            },
            select: {
                id: true,
                isDefault: true,
            },
        });

        res.status(200).json({
            message: "Cập nhật địa chỉ thành công",
            address: {
                id: address.id.toString(),
                isDefault: address.isDefault,
            },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Địa chỉ có thể bị xóa sau bước kiểm tra phía trên.
            if (error.code === "P2025") {
                res.status(404).json({
                    message: "Địa chỉ không còn khả dụng",
                });
                return;
            }

            // Xã/phường có thể bị xóa trước lúc cập nhật.
            if (error.code === "P2003") {
                res.status(400).json({
                    message: "Xã/phường không còn khả dụng",
                });
                return;
            }
        }

        console.error("Cập nhật địa chỉ thất bại:", error);

        res.status(500).json({
            message: "Không thể cập nhật địa chỉ. Vui lòng thử lại",
        });
    }
}

export async function deleteAddress(
    req: Request,
    res: Response,
): Promise<void> {
    const user = req.authUser;

    if (!user) {
        res.status(401).json({
            message: "Vui lòng đăng nhập",
        });
        return;
    }

    const rawAddressId = req.params.addressId;

    if (
        typeof rawAddressId !== "string" ||
        !/^[1-9]\d{0,18}$/.test(rawAddressId)
    ) {
        res.status(400).json({
            message: "ID địa chỉ không hợp lệ",
        });
        return;
    }

    const addressId = BigInt(rawAddressId);

    if (addressId > 9223372036854775807n) {
        res.status(400).json({
            message: "ID địa chỉ vượt giới hạn cho phép",
        });
        return;
    }

    try {
        const result = await prisma.$transaction(
            async (tx) => {
                const target = await tx.userAddress.findFirst({
                    where: {
                        id: addressId,
                        userId: user.id,
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        isDefault: true,
                    },
                });

                if (!target) return "not_found";

                // Không cho phép xóa địa chỉ đang là mặc định.
                if (target.isDefault) return "is_default";

                // Xóa mềm và bỏ trạng thái mặc định của địa chỉ này.
                await tx.userAddress.update({
                    where: {
                        id: addressId,
                        userId: user.id,
                        deletedAt: null,
                    },
                    data: {
                        deletedAt: new Date(),
                        isDefault: false,
                    },
                });

                return true;
            },
            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable,
            },
        );

        if (result === "not_found") {
            res.status(404).json({
                message: "Không tìm thấy địa chỉ",
            });
            return;
        }

        if (result === "is_default") {
            res.status(400).json({
                message:
                    "Vui lòng chọn địa chỉ khác làm mặc định trước khi xóa",
            });
            return;
        }

        res.status(200).json({
            message: "Xóa địa chỉ thành công",
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2034" || error.code === "P2002") {
                res.status(409).json({
                    message:
                        "Địa chỉ vừa được thay đổi bởi thao tác khác. " +
                        "Vui lòng thử lại",
                });
                return;
            }

            if (error.code === "P2025") {
                res.status(404).json({
                    message: "Địa chỉ không còn khả dụng",
                });
                return;
            }
        }

        console.error("Xóa địa chỉ thất bại:", error);

        res.status(500).json({
            message: "Không thể xóa địa chỉ. Vui lòng thử lại",
        });
    }
}