import React from 'react';
import { PlusIcon, XCircleIcon } from './icons';

interface CategoryHeaderProps {
  categoryName: string;
  onAddItem: () => void;
  onDeleteCategory: () => void;
  onUpdateCategoryName: (newName: string) => void;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({ categoryName, onAddItem, onDeleteCategory, onUpdateCategoryName }) => {
  return (
    <tr className="bg-slate-700 sticky top-[37px] z-10 group">
      <th colSpan={9} className="px-4 py-2 text-left text-sm font-bold text-white tracking-wider">
        <div className="flex items-center justify-between gap-4">
          <input
            type="text"
            value={categoryName}
            onChange={(e) => onUpdateCategoryName(e.target.value)}
            className="w-full bg-transparent p-1 -m-1 font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
            aria-label="Category name"
            placeholder="Category Name..."
          />
          <div className="flex items-center gap-4 flex-shrink-0">
            <button 
              onClick={onAddItem}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label={`Add item to ${categoryName}`}
            >
              <PlusIcon />
              Add Row
            </button>
            <button
              onClick={onDeleteCategory}
              className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label={`Delete category ${categoryName}`}
            >
                <XCircleIcon />
            </button>
          </div>
        </div>
      </th>
    </tr>
  );
};