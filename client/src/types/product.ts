export type ProductCardData={
  id:string;
  name:string;
  minPrice:string;
  soldCount:number;
  imageUrl?:string|null;
}

import type {ShopProductDetailData} from './shop'
type ImageProductDetailData={
  id:string;
  position:number;
  url:string;
}
export type ProductDetailData={
  id:string;
  name:string;
  description?:string|null;
  minPrice:string;
  maxPrice:string;
  ratingAvg?:number;
  ratingCount?:number;
  soldCount:number;
  images:ImageProductDetailData[];
  shop:ShopProductDetailData;
}
