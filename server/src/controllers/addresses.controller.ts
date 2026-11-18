import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

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