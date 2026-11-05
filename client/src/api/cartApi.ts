import { api } from "../lib/api";
import type {
  AddCartItemPayload,
  AddCartItemResponse,
  CartResponse,
  UpdateCartItemSelectedResponse,
} from "../types/cart";

export async function addCartItem(payload: AddCartItemPayload): Promise<AddCartItemResponse> {
  const { data } = await api.post<AddCartItemResponse>("/api/cart/items",payload);
  return data;
}
export async function getCartItems():Promise<CartResponse>{
  const {data}=await api.get<CartResponse>("/api/cart/items");
  return data
}

export async function updateCartItemSelected( itemId: string,selected:boolean):Promise<UpdateCartItemSelectedResponse>{
  const {data}=await api.post<UpdateCartItemSelectedResponse>(`/api/cart/items/${itemId}/selected`,{selected});
  return data
}