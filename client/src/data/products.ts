// src/data/products.ts
// Dữ liệu mẫu cho giao diện, bám theo schema.sql.
// Ảnh dùng picsum.photos (cần có internet); thay bằng ảnh thật khi có.

import type { Brand, Category, Product, Review, Shop } from '../types/product';

const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`;

// ====================== shops ======================
export const shops: Shop[] = [
  {
    id: 1,
    name: 'MiQ Fashion Store',
    slug: 'miq-fashion-store',
    description: 'Thời trang nam basic, chất liệu tốt, giá hợp lý.',
    logoUrl: img('shop-1'),
    isOfficial: true,
    ratingAvg: 4.8,
    ratingCount: 1520,
    followerCount: 12400,
  },
  {
    id: 2,
    name: 'Urban Wear VN',
    slug: 'urban-wear-vn',
    description: 'Streetwear và giày sneaker cho giới trẻ.',
    logoUrl: img('shop-2'),
    isOfficial: false,
    ratingAvg: 4.6,
    ratingCount: 830,
    followerCount: 5200,
  },
  {
    id: 3,
    name: 'Nhà Nón Phụ Kiện',
    slug: 'nha-non-phu-kien',
    description: 'Nón, túi, phụ kiện thời trang.',
    logoUrl: img('shop-3'),
    isOfficial: false,
    ratingAvg: 4.4,
    ratingCount: 210,
    followerCount: 980,
  },
  {
    id: 4,
    name: 'Gia Dụng Xanh',
    slug: 'gia-dung-xanh',
    description: 'Đồ gia dụng thân thiện môi trường.',
    logoUrl: img('shop-4'),
    isOfficial: false,
    ratingAvg: 4.7,
    ratingCount: 460,
    followerCount: 2300,
  },
];

// ====================== categories (cây 2 cấp) ======================
export const categories: Category[] = [
  { id: 1, parentId: null, name: 'Thời trang nam', slug: 'thoi-trang-nam', level: 1, isLeaf: false },
  { id: 2, parentId: 1, name: 'Áo nam', slug: 'ao-nam', level: 2, isLeaf: true },
  { id: 3, parentId: 1, name: 'Quần nam', slug: 'quan-nam', level: 2, isLeaf: true },
  { id: 4, parentId: 1, name: 'Giày dép nam', slug: 'giay-dep-nam', level: 2, isLeaf: true },
  { id: 5, parentId: null, name: 'Phụ kiện thời trang', slug: 'phu-kien-thoi-trang', level: 1, isLeaf: false },
  { id: 6, parentId: 5, name: 'Nón', slug: 'non', level: 2, isLeaf: true },
  { id: 7, parentId: null, name: 'Nhà cửa & đời sống', slug: 'nha-cua-doi-song', level: 1, isLeaf: false },
  { id: 8, parentId: 7, name: 'Bình & ly', slug: 'binh-ly', level: 2, isLeaf: true },
];

// ====================== brands ======================
export const brands: Brand[] = [
  { id: 1, name: 'MiQ' },
  { id: 2, name: 'UrbanWear' },
  { id: 3, name: 'CapCo' },
  { id: 4, name: 'EcoHome' },
];

// ====================== products ======================
// Quy ước id để dễ đọc:
//   tier id       : 1..9
//   tier_option id: 11-13, 21-23 (sp1) | 31-32, 41-43 (sp2) | 51-52, 61-63 (sp3)
//                   71-72, 81-83 (sp4) | 91-93 (sp5)
//   model id      : 101.. (sp1) | 201.. (sp2) | ... | 601 (sp6)
export const products: Product[] = [
  // ---------- 1. Áo thun: 2 nhóm (Màu x Size), không đủ mọi tổ hợp ----------
  {
    id: 1,
    shopId: 1,
    categoryId: 2,
    brandId: 1,
    name: 'Áo thun basic cotton',
    slug: 'ao-thun-basic-cotton',
    description:
      'Áo thun cotton 100% mặc hằng ngày, thấm hút mồ hôi, form regular dễ phối đồ.',
    conditionType: 'new',
    weightGram: 220,
    status: 'active',
    hasVariants: true,
    images: [
      { id: 1, url: img('p1-1'), position: 0 },
      { id: 2, url: img('p1-2'), position: 1 },
      { id: 3, url: img('p1-3'), position: 2 },
    ],
    attributes: [
      { name: 'Chất liệu', value: 'Cotton 100%' },
      { name: 'Kiểu dáng', value: 'Regular fit' },
      { name: 'Xuất xứ', value: 'Việt Nam' },
    ],
    tiers: [
      {
        id: 1,
        name: 'Màu sắc',
        position: 1,
        options: [
          { id: 11, value: 'Đen', imageUrl: img('p1-den') },
          { id: 12, value: 'Trắng', imageUrl: img('p1-trang') },
          { id: 13, value: 'Be', imageUrl: img('p1-be') },
        ],
      },
      {
        id: 2,
        name: 'Kích cỡ',
        position: 2,
        options: [
          { id: 21, value: 'M' },
          { id: 22, value: 'L' },
          { id: 23, value: 'XL' },
        ],
      },
    ],
    models: [
      { id: 101, sku: 'AT-DEN-M', name: 'Đen, M', optionIds: [11, 21], originalPrice: 150000, price: 120000, stock: 10, reservedStock: 0, status: 'active' },
      { id: 102, sku: 'AT-DEN-L', name: 'Đen, L', optionIds: [11, 22], originalPrice: 150000, price: 125000, stock: 5, reservedStock: 2, status: 'active' },
      { id: 103, sku: 'AT-DEN-XL', name: 'Đen, XL', optionIds: [11, 23], originalPrice: 150000, price: 130000, stock: 0, reservedStock: 0, status: 'active' },
      { id: 104, sku: 'AT-TRANG-M', name: 'Trắng, M', optionIds: [12, 21], originalPrice: 150000, price: 120000, stock: 0, reservedStock: 0, status: 'active' },
      { id: 105, sku: 'AT-TRANG-L', name: 'Trắng, L', optionIds: [12, 22], originalPrice: 150000, price: 125000, stock: 8, reservedStock: 0, status: 'active' },
      // Be chỉ có size M: kiểm tra trường hợp thiếu tổ hợp
      { id: 106, sku: 'AT-BE-M', name: 'Be, M', optionIds: [13, 21], originalPrice: 150000, price: 120000, stock: 3, reservedStock: 1, status: 'active' },
    ],
    soldCount: 1280,
    viewCount: 15400,
    ratingAvg: 4.67,
    ratingCount: 3,
    createdAt: '2026-08-15T09:00:00.000Z',
  },

  // ---------- 2. Quần jean: size dạng số, có giá khác nhau theo size ----------
  {
    id: 2,
    shopId: 1,
    categoryId: 3,
    brandId: 1,
    name: 'Quần jean slim fit co giãn',
    slug: 'quan-jean-slim-fit-co-gian',
    description: 'Quần jean co giãn nhẹ, form ôm vừa phải, màu bền, không phai sau nhiều lần giặt.',
    conditionType: 'new',
    weightGram: 520,
    status: 'active',
    hasVariants: true,
    images: [
      { id: 4, url: img('p2-1'), position: 0 },
      { id: 5, url: img('p2-2'), position: 1 },
    ],
    attributes: [
      { name: 'Chất liệu', value: 'Denim co giãn' },
      { name: 'Kiểu dáng', value: 'Slim fit' },
      { name: 'Xuất xứ', value: 'Việt Nam' },
    ],
    tiers: [
      {
        id: 3,
        name: 'Màu sắc',
        position: 1,
        options: [
          { id: 31, value: 'Xanh đậm', imageUrl: img('p2-xanh') },
          { id: 32, value: 'Đen', imageUrl: img('p2-den') },
        ],
      },
      {
        id: 4,
        name: 'Size',
        position: 2,
        options: [
          { id: 41, value: '29' },
          { id: 42, value: '30' },
          { id: 43, value: '32' },
        ],
      },
    ],
    models: [
      { id: 201, sku: 'QJ-XD-29', name: 'Xanh đậm, 29', optionIds: [31, 41], originalPrice: 450000, price: 350000, stock: 8, reservedStock: 0, status: 'active' },
      { id: 202, sku: 'QJ-XD-30', name: 'Xanh đậm, 30', optionIds: [31, 42], originalPrice: 450000, price: 350000, stock: 12, reservedStock: 3, status: 'active' },
      { id: 203, sku: 'QJ-XD-32', name: 'Xanh đậm, 32', optionIds: [31, 43], originalPrice: 450000, price: 360000, stock: 3, reservedStock: 0, status: 'active' },
      { id: 204, sku: 'QJ-DEN-30', name: 'Đen, 30', optionIds: [32, 42], originalPrice: 450000, price: 350000, stock: 0, reservedStock: 0, status: 'active' },
      { id: 205, sku: 'QJ-DEN-32', name: 'Đen, 32', optionIds: [32, 43], originalPrice: 450000, price: 360000, stock: 6, reservedStock: 0, status: 'active' },
    ],
    soldCount: 642,
    viewCount: 9800,
    ratingAvg: 3.5,
    ratingCount: 2,
    createdAt: '2026-08-20T09:00:00.000Z',
  },

  // ---------- 3. Hoodie: giá tăng theo size XL ----------
  {
    id: 3,
    shopId: 2,
    categoryId: 2,
    brandId: 2,
    name: 'Áo khoác hoodie nỉ bông',
    slug: 'ao-khoac-hoodie-ni-bong',
    description: 'Hoodie nỉ bông dày dặn, mũ 2 lớp, giữ ấm tốt, phù hợp mùa lạnh.',
    conditionType: 'new',
    weightGram: 650,
    status: 'active',
    hasVariants: true,
    images: [
      { id: 6, url: img('p3-1'), position: 0 },
      { id: 7, url: img('p3-2'), position: 1 },
      { id: 8, url: img('p3-3'), position: 2 },
    ],
    attributes: [
      { name: 'Chất liệu', value: 'Nỉ bông' },
      { name: 'Mùa', value: 'Thu đông' },
      { name: 'Xuất xứ', value: 'Việt Nam' },
    ],
    tiers: [
      {
        id: 5,
        name: 'Màu sắc',
        position: 1,
        options: [
          { id: 51, value: 'Xám', imageUrl: img('p3-xam') },
          { id: 52, value: 'Be', imageUrl: img('p3-be') },
        ],
      },
      {
        id: 6,
        name: 'Kích cỡ',
        position: 2,
        options: [
          { id: 61, value: 'M' },
          { id: 62, value: 'L' },
          { id: 63, value: 'XL' },
        ],
      },
    ],
    models: [
      { id: 301, sku: 'HD-XAM-M', name: 'Xám, M', optionIds: [51, 61], originalPrice: 350000, price: 280000, stock: 15, reservedStock: 0, status: 'active' },
      { id: 302, sku: 'HD-XAM-L', name: 'Xám, L', optionIds: [51, 62], originalPrice: 350000, price: 280000, stock: 7, reservedStock: 0, status: 'active' },
      { id: 303, sku: 'HD-XAM-XL', name: 'Xám, XL', optionIds: [51, 63], originalPrice: 370000, price: 295000, stock: 2, reservedStock: 0, status: 'active' },
      { id: 304, sku: 'HD-BE-L', name: 'Be, L', optionIds: [52, 62], originalPrice: 350000, price: 280000, stock: 6, reservedStock: 0, status: 'active' },
      { id: 305, sku: 'HD-BE-XL', name: 'Be, XL', optionIds: [52, 63], originalPrice: 370000, price: 295000, stock: 0, reservedStock: 0, status: 'active' },
    ],
    soldCount: 905,
    viewCount: 11200,
    ratingAvg: 4.67,
    ratingCount: 3,
    createdAt: '2026-09-01T09:00:00.000Z',
  },

  // ---------- 4. Giày sneaker: size 40-42, một biến thể ẩn ----------
  {
    id: 4,
    shopId: 2,
    categoryId: 4,
    brandId: 2,
    name: 'Giày sneaker đế cao su',
    slug: 'giay-sneaker-de-cao-su',
    description: 'Sneaker đế cao su êm chân, chống trơn trượt, dễ phối với nhiều phong cách.',
    conditionType: 'new',
    weightGram: 900,
    status: 'active',
    hasVariants: true,
    images: [
      { id: 9, url: img('p4-1'), position: 0 },
      { id: 10, url: img('p4-2'), position: 1 },
    ],
    attributes: [
      { name: 'Chất liệu', value: 'Da tổng hợp' },
      { name: 'Loại đế', value: 'Cao su' },
      { name: 'Xuất xứ', value: 'Việt Nam' },
    ],
    tiers: [
      {
        id: 7,
        name: 'Màu sắc',
        position: 1,
        options: [
          { id: 71, value: 'Trắng', imageUrl: img('p4-trang') },
          { id: 72, value: 'Đen', imageUrl: img('p4-den') },
        ],
      },
      {
        id: 8,
        name: 'Size',
        position: 2,
        options: [
          { id: 81, value: '40' },
          { id: 82, value: '41' },
          { id: 83, value: '42' },
        ],
      },
    ],
    models: [
      { id: 401, sku: 'SN-TRANG-40', name: 'Trắng, 40', optionIds: [71, 81], originalPrice: 550000, price: 450000, stock: 4, reservedStock: 0, status: 'active' },
      { id: 402, sku: 'SN-TRANG-41', name: 'Trắng, 41', optionIds: [71, 82], originalPrice: 550000, price: 450000, stock: 9, reservedStock: 1, status: 'active' },
      { id: 403, sku: 'SN-TRANG-42', name: 'Trắng, 42', optionIds: [71, 83], originalPrice: 550000, price: 450000, stock: 0, reservedStock: 0, status: 'active' },
      { id: 404, sku: 'SN-DEN-41', name: 'Đen, 41', optionIds: [72, 82], originalPrice: 570000, price: 470000, stock: 5, reservedStock: 0, status: 'active' },
      // Biến thể bị shop ẩn: giao diện không được hiển thị
      { id: 405, sku: 'SN-DEN-42', name: 'Đen, 42', optionIds: [72, 83], originalPrice: 570000, price: 470000, stock: 7, reservedStock: 0, status: 'hidden' },
    ],
    soldCount: 318,
    viewCount: 7600,
    ratingAvg: 5,
    ratingCount: 1,
    createdAt: '2026-09-10T09:00:00.000Z',
  },

  // ---------- 5. Nón: chỉ 1 nhóm phân loại (Màu) ----------
  {
    id: 5,
    shopId: 3,
    categoryId: 6,
    brandId: 3,
    name: 'Nón lưỡi trai kaki',
    slug: 'non-luoi-trai-kaki',
    description: 'Nón vải kaki, khóa điều chỉnh phía sau, một size vừa mọi người.',
    conditionType: 'new',
    weightGram: 90,
    status: 'active',
    hasVariants: true,
    images: [
      { id: 11, url: img('p5-1'), position: 0 },
      { id: 12, url: img('p5-2'), position: 1 },
    ],
    attributes: [
      { name: 'Chất liệu', value: 'Vải kaki' },
      { name: 'Kích cỡ', value: 'Free size' },
    ],
    tiers: [
      {
        id: 9,
        name: 'Màu sắc',
        position: 1,
        options: [
          { id: 91, value: 'Đen', imageUrl: img('p5-den') },
          { id: 92, value: 'Xanh navy', imageUrl: img('p5-navy') },
          { id: 93, value: 'Kem', imageUrl: img('p5-kem') },
        ],
      },
    ],
    models: [
      { id: 501, sku: 'NON-DEN', name: 'Đen', optionIds: [91], originalPrice: 110000, price: 90000, stock: 30, reservedStock: 0, status: 'active' },
      { id: 502, sku: 'NON-NAVY', name: 'Xanh navy', optionIds: [92], originalPrice: 110000, price: 90000, stock: 18, reservedStock: 2, status: 'active' },
      { id: 503, sku: 'NON-KEM', name: 'Kem', optionIds: [93], originalPrice: 115000, price: 95000, stock: 0, reservedStock: 0, status: 'active' },
    ],
    soldCount: 2104,
    viewCount: 18900,
    ratingAvg: 4,
    ratingCount: 1,
    createdAt: '2026-07-25T09:00:00.000Z',
  },

  // ---------- 6. Bình giữ nhiệt: KHÔNG có phân loại (chỉ 1 model mặc định) ----------
  {
    id: 6,
    shopId: 4,
    categoryId: 8,
    brandId: 4,
    name: 'Bình giữ nhiệt inox 500ml',
    slug: 'binh-giu-nhiet-inox-500ml',
    description: 'Bình giữ nhiệt inox 304 hai lớp, giữ nóng 12 giờ, giữ lạnh 24 giờ.',
    conditionType: 'new',
    weightGram: 380,
    status: 'active',
    hasVariants: false,
    images: [
      { id: 13, url: img('p6-1'), position: 0 },
      { id: 14, url: img('p6-2'), position: 1 },
    ],
    attributes: [
      { name: 'Chất liệu', value: 'Inox 304' },
      { name: 'Dung tích', value: '500ml' },
    ],
    tiers: [],
    models: [
      { id: 601, sku: 'BGN-500', name: '', optionIds: [], originalPrice: 220000, price: 179000, stock: 40, reservedStock: 0, status: 'active' },
    ],
    soldCount: 3560,
    viewCount: 25100,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: '2026-06-18T09:00:00.000Z',
  },
];

// ====================== reviews ======================
export const reviews: Review[] = [
  { id: 1, productId: 1, modelId: 101, userName: 'nguyen***an', rating: 5, content: 'Vải mát, mặc rất thoải mái. Giao nhanh, đóng gói cẩn thận.', createdAt: '2026-09-02T10:20:00.000Z', shopReply: 'Cảm ơn bạn đã ủng hộ shop!' },
  { id: 2, productId: 1, modelId: 102, userName: 'tran***hung', rating: 4, content: 'Áo đẹp, form ổn. Màu hơi đậm hơn trong ảnh một chút.', createdAt: '2026-09-05T14:05:00.000Z' },
  { id: 3, productId: 1, modelId: 105, userName: 'le***linh', rating: 5, content: 'Chất cotton dày dặn, giặt không bị xù.', createdAt: '2026-09-12T08:45:00.000Z' },
  { id: 4, productId: 2, modelId: 201, userName: 'pham***tu', rating: 4, content: 'Quần co giãn tốt, mặc vừa vặn.', createdAt: '2026-09-08T19:30:00.000Z' },
  { id: 5, productId: 2, modelId: 203, userName: 'vo***nam', rating: 3, content: 'Quần ổn nhưng size 32 hơi chật hơn mình nghĩ.', createdAt: '2026-09-15T11:10:00.000Z', shopReply: 'Shop xin lỗi bạn, lần sau bạn có thể chọn lớn hơn một size nhé.' },
  { id: 6, productId: 3, modelId: 301, userName: 'hoang***mai', rating: 5, content: 'Áo dày, ấm, mũ đẹp. Rất đáng tiền.', createdAt: '2026-09-18T09:00:00.000Z' },
  { id: 7, productId: 3, modelId: 302, userName: 'do***khoa', rating: 5, content: 'Mặc đi mưa phùn vẫn ấm, form rộng thoải mái.', createdAt: '2026-09-20T16:40:00.000Z' },
  { id: 8, productId: 3, modelId: 304, userName: 'bui***ha', rating: 4, content: 'Màu be đẹp, nhưng nỉ hơi bám bụi.', createdAt: '2026-09-25T13:15:00.000Z' },
  { id: 9, productId: 4, modelId: 402, userName: 'dang***quan', rating: 5, content: 'Giày êm chân, đi cả ngày không đau.', createdAt: '2026-09-28T07:50:00.000Z' },
  { id: 10, productId: 5, modelId: 501, userName: 'ngo***lan', rating: 4, content: 'Nón đẹp, khóa chỉnh dễ. Giao hơi chậm.', createdAt: '2026-08-30T12:00:00.000Z' },
];