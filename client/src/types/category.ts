export type Category = {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  level: number;
  path: string
  position: number;
  iconUrl: string;
  isLeaf: boolean;
  isActive: boolean;
};

export type CategoryCardData = {
  id: string;
  name: string;
  iconUrl: string | null;
};

export type CategoryChild = {
  id: string;
  name: string;
};