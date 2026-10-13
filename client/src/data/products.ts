import type { Product } from '../types/product';

export const products: Product[] = [
  {
    id: 1,
    name: 'Áo thun basic',
    description: 'Áo thun cotton mặc hằng ngày.',
    shopId: 1,
    categoryId: 1,
    variants: [
      { id: 101, color: 'Đen', size: 'M', price: 120000, stock: 10 },
      { id: 102, color: 'Đen', size: 'L', price: 125000, stock: 5 },
      { id: 103, color: 'Trắng', size: 'M', price: 120000, stock: 0 },
    ],
  },
  {
    id: 2,
    name: 'Quần jean slim fit',
    description: 'Quần jean co giãn nhẹ, form ôm vừa phải.',
    shopId: 1,
    categoryId: 2,
    variants: [
      { id: 201, color: 'Xanh đậm', size: '29', price: 350000, stock: 8 },
      { id: 202, color: 'Xanh đậm', size: '30', price: 350000, stock: 12 },
      { id: 203, color: 'Xanh đậm', size: '32', price: 360000, stock: 3 },
      { id: 204, color: 'Đen', size: '30', price: 350000, stock: 0 },
    ],
  },
  {
    id: 3,
    name: 'Áo khoác hoodie',
    description: 'Hoodie nỉ bông dày dặn, giữ ấm tốt.',
    shopId: 2,
    categoryId: 1,
    variants: [
      { id: 301, color: 'Xám', size: 'M', price: 280000, stock: 15 },
      { id: 302, color: 'Xám', size: 'L', price: 280000, stock: 7 },
      { id: 303, color: 'Xám', size: 'XL', price: 295000, stock: 2 },
      { id: 304, color: 'Be', size: 'L', price: 280000, stock: 6 },
    ],
  },
  {
    id: 4,
    name: 'Giày sneaker trắng',
    description: 'Sneaker đế cao su êm chân, dễ phối đồ.',
    shopId: 2,
    categoryId: 3,
    variants: [
      { id: 401, color: 'Trắng', size: '40', price: 450000, stock: 4 },
      { id: 402, color: 'Trắng', size: '41', price: 450000, stock: 9 },
      { id: 403, color: 'Trắng', size: '42', price: 450000, stock: 0 },
    ],
  },
  {
    id: 5,
    name: 'Nón lưỡi trai',
    description: 'Nón vải kaki, khóa điều chỉnh phía sau.',
    shopId: 3,
    categoryId: 4,
    variants: [
      { id: 501, color: 'Đen', size: 'Free size', price: 90000, stock: 30 },
      { id: 502, color: 'Xanh navy', size: 'Free size', price: 90000, stock: 18 },
      { id: 503, color: 'Kem', size: 'Free size', price: 95000, stock: 0 },
    ],
  },
];