export type ProductCardData={
  id:string;
  name:string;
  minPrice:string;
  soldCount:number;
  imageUrl:string|null;
}

import type {ShopProductDetailData} from './shop'
type ImageProductDetailData={
  id:string;
  position:number;
  url:string;
}
type OptionProductDetailData={
  id:string;
  value:string;
  imageUrl:string|null;
}
type TierProductDetailData={
  id:string;
  name:string;
  options:OptionProductDetailData[];
}
export type ModelProductDetailData={
  id:string;
  name:string|null;
  price:string;
  optionKey:string;
  inventory:InventoryData;
}
export type InventoryData={
  modelId:string;
  stock:number;
  reservedStock:number;
}
export type ProductDetailData={
  id:string;
  name:string;
  description:string|null;
  minPrice:string;
  maxPrice:string;
  ratingAvg:string;
  ratingCount:number;
  soldCount:number;
  images:ImageProductDetailData[];
  shop:ShopProductDetailData;
  tiers:TierProductDetailData[];
  models:ModelProductDetailData[];
}
