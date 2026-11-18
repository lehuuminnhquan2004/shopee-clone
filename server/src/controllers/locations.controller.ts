import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getProvinces(
    _req: Request,
    res: Response,
): Promise<void> {
    try {
        const provinces = await prisma.province.findMany({
            select: {
                id: true,
                code: true,
                name: true,
            },
            orderBy: [
                { name: "asc" },
                { id: "asc" },
            ],
        });

        res.status(200).json(provinces);
    } catch (error) {
        console.error("Lấy danh sách tỉnh thất bại:", error);

        res.status(500).json({
            message: "Không thể tải danh sách tỉnh/thành",
        });
    }
}

export async function getWardsByProvince(
    req: Request,
    res: Response,
): Promise<void> {
    const rawProvinceId = req.params.provinceId;

    // Province.id là PostgreSQL INTEGER: số nguyên dương tối đa 2147483647.
    if (
        typeof rawProvinceId !== "string" ||
        !/^[1-9]\d{0,9}$/.test(rawProvinceId)
    ) {
        res.status(400).json({
            message: "ID tỉnh/thành không hợp lệ",
        });
        return;
    }

    const provinceId = Number(rawProvinceId);

    if (provinceId > 2147483647) {
        res.status(400).json({
            message: "ID tỉnh/thành vượt giới hạn cho phép",
        });
        return;
    }

    try {
        const province = await prisma.province.findUnique({
            where: { id: provinceId },
            select: {
                wards: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        provinceId: true,
                    },
                    orderBy: [
                        { name: "asc" },
                        { id: "asc" },
                    ],
                },
            },
        });

        if (!province) {
            res.status(404).json({
                message: "Không tìm thấy tỉnh/thành",
            });
            return;
        }

        res.status(200).json(province.wards);
    } catch (error) {
        console.error("Lấy danh sách xã/phường thất bại:", error);

        res.status(500).json({
            message: "Không thể tải danh sách xã/phường",
        });
    }
}