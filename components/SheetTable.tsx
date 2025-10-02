import React from 'react';
import type { InventoryCategory, ItemKey } from '../types';
import { TableRow } from './TableRow';
import { CategoryHeader } from './CategoryHeader';

interface SheetTableProps {
  data: InventoryCategory[];
  onItemChange: (categoryId: string, itemId: string, field: ItemKey, value: string) => void;
  onAddItem: (categoryId: string) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onUpdateCategoryName: (categoryId: string, newCategoryName: string) => void;
  onNegativeVariance: (itemName: string) => void;
  isPriceEditMode: boolean;
}

export const SheetTable: React.FC<SheetTableProps> = ({ data, onItemChange, onAddItem, onDeleteItem, onDeleteCategory, onUpdateCategoryName, onNegativeVariance, isPriceEditMode }) => {
  let serialNumber = 1;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-300 uppercase bg-slate-700/50 sticky top-0 z-10">
          <tr>
            <th scope="col" className="px-4 py-3 w-16 text-center">S.NO.</th>
            <th scope="col" className="px-4 py-3 min-w-[250px]">Items</th>
            <th scope="col" className="px-4 py-3 w-24">UOM</th>
            <th scope="col" className="px-4 py-3 w-32">Price</th>
            <th scope="col" className="px-4 py-3 w-32">Opening</th>
            <th scope="col" className="px-4 py-3 w-32">Receiving</th>
            <th scope="col" className="px-4 py-3 w-32">Closing</th>
            <th scope="col" className="px-4 py-3 w-32">Variance</th>
            <th scope="col" className="px-4 py-3 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {data.map(category => (
            <React.Fragment key={category.id}>
              <CategoryHeader 
                categoryName={category.category} 
                onAddItem={() => onAddItem(category.id)}
                onDeleteCategory={() => onDeleteCategory(category.id)}
                onUpdateCategoryName={(newName) => onUpdateCategoryName(category.id, newName)}
                isPriceEditMode={isPriceEditMode}
              />
              {category.items.map((item, index) => {
                const currentSerialNumber = serialNumber + index;
                return (
                  <TableRow
                    key={item.id}
                    serialNumber={currentSerialNumber}
                    item={item}
                    onItemChange={(field, value) => onItemChange(category.id, item.id, field, value)}
                    onDeleteItem={() => onDeleteItem(category.id, item.id)}
                    onNegativeVariance={onNegativeVariance}
                    isPriceEditMode={isPriceEditMode}
                  />
                );
              })}
              {(() => {
                  serialNumber += category.items.length;
                  return null;
              })()}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};