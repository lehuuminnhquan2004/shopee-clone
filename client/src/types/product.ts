// src/types/product.ts
// Kiểu dữ liệu phía frontend, bám theo các bảng trong schema.sql.
// Sản phẩm được "lồng" sẵn ảnh, thuộc tính, nhóm phân loại và biến thể
// giống kết quả một API trả về sau khi JOIN nhiều bảng.

// ---- bảng shops ----
export type Shop = {
  id: number;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  isOfficial: boolean;
  ratingAvg: number;
  ratingCount: number;
  followerCount: number;
};

// ---- bảng categories (cây nhiều cấp) ----
export type Category = {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  level: number;
  isLeaf: boolean;
};

// ---- bảng brands ----
export type Brand = {
  id: number;
  name: string;
};

// ---- bảng product_images ----
export type ProductImage = {
  id: number;
  url: string;
  position: number; // 0 = ảnh bìa
};

// ---- bảng product_attribute_values (thuộc tính mô tả: chất liệu, xuất xứ...) ----
export type ProductAttribute = {
  name: string;
  value: string;
};

// ---- bảng tier_options (Đen, Trắng, M, L...) ----
export type TierOption = {
  id: number;
  value: string;
  imageUrl?: string; // ảnh theo lựa chọn, thường dùng cho màu
};

// ---- bảng product_tiers (nhóm phân loại: Màu, Size). Tối đa 2 nhóm ----
export type ProductTier = {
  id: number;
  name: string;
  position: 1 | 2;
  options: TierOption[];
};

export type ModelStatus = 'active' | 'hidden';

// ---- bảng product_models + model_tier_options + inventories ----
export type ProductModel = {
  id: number;
  sku: string;
  name: string; // vd 'Đen, M' (rỗng với sản phẩm không có phân loại)
  optionIds: number[]; // các tier_option mà biến thể này dùng (bảng model_tier_options)
  originalPrice: number; // giá gốc (hiển thị giá gạch)
  price: number; // giá bán hiện hành
  stock: number; // inventories.stock
  reservedStock: number; // inventories.reserved_stock (đang giữ cho đơn chưa thanh toán)
  imageUrl?: string;
  status: ModelStatus;
};

export type ProductStatus = 'draft' | 'active' | 'hidden' | 'banned';

// ---- bảng products ----
export type Product = {
  id: number;
  shopId: number;
  categoryId: number;
  brandId: number | null;
  name: string;
  slug: string;
  description: string;
  conditionType: 'new' | 'used';
  weightGram: number;
  status: ProductStatus;
  hasVariants: boolean;

  images: ProductImage[];
  attributes: ProductAttribute[];
  tiers: ProductTier[];
  models: ProductModel[];

  // các cột phi chuẩn hóa trong bảng products
  soldCount: number;
  viewCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string; // ISO
};

// ---- bảng reviews (+ review_replies) ----
export type Review = {
  id: number;
  productId: number;
  modelId: number;
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  createdAt: string; // ISO
  shopReply?: string;
};