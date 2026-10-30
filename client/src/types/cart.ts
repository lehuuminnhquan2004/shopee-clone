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