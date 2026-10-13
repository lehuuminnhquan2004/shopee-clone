export type ProductVariant ={
    id:number;
    color?:string;
    size?:string;
    price:number;
    stock:number;
};

export type Product={
    id:number;
    name:string;
    description?:string;
    shopId:number;
    categoryId:number;
    variants:ProductVariant[];
}