import { type Request, type Response } from "express";
import { prisma } from '../lib//prisma.js'

export async function getCategories(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
                parentId: null,
            },
            orderBy: [
                { position: 'asc' },
                { id: 'asc' },
            ],
            select: {
                id: true,
                name: true,
                iconUrl: true,
            },
        });

        const result = categories.map((category) => ({
            id: category.id.toString(),
            name: category.name,
            iconUrl: category.iconUrl,
        }));

        res.status(200).json(result)
    } catch (error) {
        console.error('Không lấy được danh mục', error);;

        res.status(500).json({
            message: "Không lấy được danh mục",
        });
    }
}

export async function getCategoryChildren(
    req: Request<{categoryId: string}>,
    res: Response
):Promise<void> {
    const {categoryId} = req.params;
    const MAX_BIGINT = 9223372036854775807n;
    if(!/^[0-9]{1,19}$/.test(categoryId)||BigInt(categoryId)>MAX_BIGINT){
        res.status(400).json({
            message: 'ID danh mục không hợp lệ!'
        })
        return
    }
    const parentId=BigInt(categoryId);;
    if (parentId > 9223372036854775807n) {
        res.status(400).json({
            message: 'ID danh mục vượt phạm vi cho phép',
        });
        return;
    }
    try{
        const parent=await prisma.category.findFirst({
            where:{
                id:parentId,
                isActive:true,
            },
            select:{
                id:true,
            },
        });

        if(!parent){
            res.status(400).json({
                message: 'Không tìm thấy danh mục'
            })
            return
        }

        const children = await prisma.category.findMany({
            where:{
                parentId:parent.id,
                isActive:true,
            },
            orderBy:[
                {position:'asc'},
                {id:'asc'},
            ],
            select:{
                id:true,
                name: true,
            },
        });

        const result=children.map((category)=>({
            id:category.id.toString(),
            name:category.name,
        }));

        res.status(200).json(result)
    }catch(error){
        console.error('Không thể lấy danh mục con:', error);

        res.status(500).json({
            message: 'Không thể lấy danh mục con',
        });
    }
}
export async function getCategoryById(
    req:Request<{id:string}>,
    res:Response,
):Promise<void>{
    const {id}=req.params;
    const MAX_BIGINT = 9223372036854775807n;
    if(!id||!/^[0-9]{1,19}$/.test(id)||BigInt(id)>MAX_BIGINT){
        res.status(400).json({message:"Dữ liệu không hợp lệ"})
        return
    }
    const id_bigint=BigInt(id)
    try{
        const category=await prisma.category.findFirst({
            where:{
                id:id_bigint,
                isActive:true,
            },
            select:{
                id:true,
                name: true,
            },
        })
        if(!category){
            res.status(404).json({message: "Không lấy được danh mục"})
            return
        }
        res.status(200).json({
            id:category.id.toString(),
            name:category.name
        })
    }catch(err){
        console.error(`Không lấy được dữ liệu`,err)
        res.status(500).json({message: "Không lấy được dữ liệu"})
    }
}
