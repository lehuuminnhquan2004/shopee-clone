import { api } from "../lib/api";
import type {
  AddCartItemPayload,
  AddCartItemResponse,
} from "../types/cart";

export async function addCartItem(payload: AddCartItemPayload): Promise<AddCartItemResponse> {
  const { data } = await api.post<AddCartItemResponse>("/api/cart/items",payload,);
  return data;
}