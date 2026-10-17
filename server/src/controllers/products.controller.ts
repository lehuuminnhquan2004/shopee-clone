import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getProducts(
    _req:Request,
    res: Response
):Promise<void>{
    try{
        const products=await prisma.product.findMany({
            where:{
                status:'active',
            },
            orderBy:[
                {createdAt: 'desc',}
            ],
            select:{
                id:true,
                name:true,
                slug: true,
                minPrice: true,
                soldCount: true,
                images:{
                    orderBy:[{position:'asc'}],
                    take:1,
                    select:{url:true},
                },
            },
        });
        res.status(200).json(
            products.map((product)=>({
                id: product.id.toString(),
                name:product.name,
                slug:product.slug,
                minPrice:product.minPrice.toString(),
                soldCount:product.soldCount,
                imageUrl: product.images[0]?.url??null,
            }))
        );
    }catch(error){
        console.error('Không lấy được sản phẩm',error);
        res.status(500).json({message:`Không lấy được sản phẩm`});
    }
    
}