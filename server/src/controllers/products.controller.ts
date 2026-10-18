import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getProducts(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const products = await prisma.product.findMany({
            where: {
                status: 'active',
            },
            orderBy: [
                { createdAt: 'desc', }
            ],
            select: {
                id: true,
                name: true,
                slug: true,
                minPrice: true,
                soldCount: true,
                images: {
                    orderBy: [{ position: 'asc' }],
                    take: 1,
                    select: { url: true },
                },
            },
        });
        res.status(200).json(
            products.map((product) => ({
                id: product.id.toString(),
                name: product.name,
                slug: product.slug,
                minPrice: product.minPrice.toString(),
                soldCount: product.soldCount,
                imageUrl: product.images[0]?.url ?? null,
            }))
        );
    } catch (error) {
        console.error('Không lấy được sản phẩm', error);
        res.status(500).json({ message: `Không lấy được sản phẩm` });
        return
    }

}
export async function getCategoryIdProducts(
    req: Request<{ categoryId: string }>,
    res: Response
): Promise<void> {
    const { categoryId } = req.params;
    const MAX_BIGINT = 9223372036854775807n;
    if (!/^[0-9]{1,19}$/.test(categoryId)||BigInt(categoryId)>MAX_BIGINT) {
        res.status(400).json({ message: "Thông tin không hợp lệ" })
        return
    }
    const category_id = BigInt(categoryId)
    try{
        const category= await prisma.category.findFirst({
            where:{id:category_id,},
            select:{isActive:true,},
        })
        if(!category||category.isActive===false){
            res.status(400).json({ message: "Thông tin không hợp lệ" })
            return
        }
    }catch (error) {
        console.error('Không lấy được danh mục', error);
        res.status(500).json({ message: `Không lấy được danh mục` });
        return
    }
    try {
        const products = await prisma.product.findMany({
            where: {
                status: 'active',
                OR: [
                    { categoryId: category_id },
                    { category: { parentId: category_id, isActive: true } },
                ],
            },
            orderBy: [
                { createdAt: 'desc' },
            ],
            select: {
                id: true,
                name: true,
                slug: true,
                minPrice: true,
                soldCount: true,
                images: {
                    orderBy: [{ position: 'asc' }],
                    take: 1,
                    select: { url: true },
                },
            },
        })
        res.status(200).json(
            products.map((product) => ({
                id: product.id.toString(),
                name: product.name,
                slug: product.slug,
                minPrice: product.minPrice.toString(),
                soldCount: product.soldCount,
                imageUrl: product.images[0]?.url ?? null,
            }))
        );
    } catch (error) {
        console.error('Không lấy được sản phẩm', error);
        res.status(500).json({ message: `Không lấy được sản phẩm` });
    }

}