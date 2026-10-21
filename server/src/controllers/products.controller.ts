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
                { createdAt: 'desc'},
                {id:'asc'},
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
    if (!/^[0-9]{1,19}$/.test(categoryId) || BigInt(categoryId) > MAX_BIGINT) {
        res.status(400).json({ message: "Thông tin không hợp lệ" })
        return
    }
    const category_id = BigInt(categoryId)
    try {
        const category = await prisma.category.findFirst({
            where: { id: category_id, },
            select: { isActive: true, },
        })
        if (!category || category.isActive === false) {
            res.status(400).json({ message: "Thông tin không hợp lệ" })
            return
        }
    } catch (error) {
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
export async function getProductById(
    req: Request<{ id: string }>,
    res: Response
): Promise<void> {
    const { id } = req.params
    const MAX_BIGINT = 9223372036854775807n;
    if (!id || !/^[0-9]{1,19}$/.test(id) || BigInt(id) > MAX_BIGINT) {
        res.status(400).json({ message: "Thông tin không hợp lệ" })
        return
    }
    const id_bigint = BigInt(id)
    try {
        const product = await prisma.product.findFirst({
            where: {
                id: id_bigint,
                status: 'active',
            }, select: {
                id: true,
                name: true,
                description: true,
                minPrice: true,
                maxPrice: true,
                ratingAvg: true,
                ratingCount: true,
                soldCount: true,
                images: {
                    orderBy: [{ position: 'asc' }],
                    select: {
                        id: true,
                        position: true,
                        url: true
                    },
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true
                    },
                },
                tiers: {
                    orderBy: { position: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        options: {
                            orderBy: { position: 'asc' },
                            select: {
                                id: true,
                                value: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
                models:{
                    where:{status:'active'},
                    orderBy: { id: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        optionKey:true,
                        price:true,
                    },
                }

            },
        })
        if (!product) {
            res.status(404).json({ message: "Không tìm thấy sản phẩm" })
            return
        }
        res.status(200).json({
            id: product.id.toString(),
            name: product.name,
            description: product.description ?? null,
            minPrice: product.minPrice.toString(),
            maxPrice: product.maxPrice.toString(),
            ratingAvg: product.ratingAvg.toString(),
            ratingCount: product.ratingCount,
            soldCount: product.soldCount,
            images: product.images.map((image) => {
                return ({
                    id: image.id.toString(),
                    position: image.position,
                    url: image.url
                })
            }),
            shop: {
                id: product.shop.id.toString(),
                name: product.shop.name,
                logoUrl: product.shop?.logoUrl ?? null,
            },
            tiers:product.tiers.map((tier)=>({
                id:tier.id.toString(),
                name:tier.name,
                options:tier.options.map((option)=>({
                    id:option.id.toString(),
                    value:option.value,
                    imageUrl:option.imageUrl??null,
                }))
            })),
            models:product.models.map((model)=>({
                id:model.id.toString(),
                name:model.name,
                optionKey:model.optionKey,
                price:model.price.toString(),
            }))
        })
    } catch (err) {
        console.error('Không lấy được sản phẩm', err)
        res.status(500).json({ message: "Không lấy được sản phẩm" })
    }

}