// src/utils/productHelpers.ts
// Các hàm tiện ích cho giao diện, dùng chung với dữ liệu mẫu (và sau này dùng với dữ liệu API).

import type { Category, Product, ProductModel } from '../types/product';

/** 150000 -> "150.000đ" */
export function formatPrice(value: number): string {
  return `${value.toLocaleString('vi-VN')}đ`;
}

/** Biến thể đang được bán (không bị ẩn) */
export function getActiveModels(product: Product): ProductModel[] {
  return product.models.filter((m) => m.status === 'active');
}

/** Số lượng còn bán được = tồn kho - hàng đang giữ */
export function getAvailableStock(model: ProductModel): number {
  return Math.max(0, model.stock - model.reservedStock);
}

/** Tổng số lượng còn bán được của cả sản phẩm */
export function getTotalAvailable(product: Product): number {
  return getActiveModels(product).reduce((sum, m) => sum + getAvailableStock(m), 0);
}

/** Khoảng giá hiển thị ở danh sách: min - max (chỉ tính biến thể đang bán) */
export function getPriceRange(product: Product): { min: number; max: number } {
  const prices = getActiveModels(product).map((m) => m.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** "120.000đ" hoặc "120.000đ - 130.000đ" */
export function formatPriceRange(product: Product): string {
  const { min, max } = getPriceRange(product);
  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
}

/** Phần trăm giảm của một biến thể, vd 20 */
export function getDiscountPercent(model: ProductModel): number {
  if (model.originalPrice <= model.price) return 0;
  return Math.round(((model.originalPrice - model.price) / model.originalPrice) * 100);
}

/** Ảnh bìa của sản phẩm (position nhỏ nhất) */
export function getCoverImage(product: Product): string | undefined {
  return [...product.images].sort((a, b) => a.position - b.position)[0]?.url;
}

/**
 * Tìm biến thể ứng với các lựa chọn đã chọn.
 * selected: { [tierId]: optionId }, vd { 1: 11, 2: 21 } = Đen + M.
 * Chỉ trả về khi đã chọn đủ mọi nhóm.
 */
export function findModel(
  product: Product,
  selected: Record<number, number>,
): ProductModel | undefined {
  // Sản phẩm không có phân loại: dùng model mặc định
  if (product.tiers.length === 0) return getActiveModels(product)[0];

  const chosen = Object.values(selected);
  if (chosen.length !== product.tiers.length) return undefined;

  return getActiveModels(product).find(
    (m) =>
      m.optionIds.length === chosen.length &&
      chosen.every((optionId) => m.optionIds.includes(optionId)),
  );
}

/**
 * Một lựa chọn có bấm được không (còn hàng với các lựa chọn khác đang chọn)?
 * Dùng để làm mờ nút "Trắng" khi đang chọn size M mà Trắng M đã hết.
 */
export function isOptionAvailable(
  product: Product,
  tierId: number,
  optionId: number,
  selected: Record<number, number>,
): boolean {
  // Các lựa chọn ở nhóm khác đang được chọn
  const others = Object.entries(selected)
    .filter(([tId]) => Number(tId) !== tierId)
    .map(([, oId]) => oId);

  return getActiveModels(product).some(
    (m) =>
      m.optionIds.includes(optionId) &&
      others.every((o) => m.optionIds.includes(o)) &&
      getAvailableStock(m) > 0,
  );
}

/** Đường dẫn danh mục: ['Thời trang nam', 'Áo nam'] */
export function getCategoryPath(categoryId: number, categories: Category[]): string[] {
  const path: string[] = [];
  let current = categories.find((c) => c.id === categoryId);
  while (current) {
    path.unshift(current.name);
    current = current.parentId ? categories.find((c) => c.id === current!.parentId) : undefined;
  }
  return path;
}