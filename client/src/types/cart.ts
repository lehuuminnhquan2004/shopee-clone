export type AddCartItemPayload = {
  modelId: string;
  quantity: number;
};

export type AddCartItemResponse = {
  message: string;
  item: {
    id: string;
    modelId: string;
    quantity: number;
    selected: boolean;
  };
};

export type CartItemModel = {
  id: string;
  name: string|null;
  price: string;
};

export type CartItemProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type CartItemShop = {
  id: string;
  name: string;
};

export type CartItem = {
  id: string;
  quantity: number;
  selected: boolean;
  availableStock: number;
  canCheckout: boolean;
  unavailableReason: string|null;
  lineTotal: string;
  model: CartItemModel;
  product: CartItemProduct;
  shop: CartItemShop;
};

export type CartSummary = {
  itemCount: number;
  selectedItemCount: number;
  selectedQuantity: number;
  selectedSubtotal: string;
};

export type CartResponse = {
  items: CartItem[];
  summary: CartSummary;
};