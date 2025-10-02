export const UOM_OPTIONS = [
  'COUNT',
  'KG.',
  'LTR.',
  'PKT.',
  'UNIT',
  'BOX',
  'ROLL',
  'SET',
  'G.',
] as const;

export type Uom = typeof UOM_OPTIONS[number];

export interface InventoryItem {
  id: string;
  name: string;
  uom: Uom;
  opening: number | string;
  receiving: number | string;
  closing: number | string;
  price: number | string;
}

export type ItemKey = keyof Omit<InventoryItem, 'id'>;

export interface InventoryCategory {
  id: string;
  category: string;
  items: InventoryItem[];
}