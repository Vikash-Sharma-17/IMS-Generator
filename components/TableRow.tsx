import React, { useMemo, useRef, useEffect } from 'react';
import type { InventoryItem, ItemKey, Uom } from '../types';
import { UOM_OPTIONS } from '../types';
import { TrashIcon } from './icons';

interface TableRowProps {
  serialNumber: number;
  item: InventoryItem;
  onItemChange: (field: ItemKey, value: string) => void;
  onDeleteItem: () => void;
  onNegativeVariance: (itemName: string) => void;
}

const MemoizedTableRow: React.FC<TableRowProps> = ({ serialNumber, item, onItemChange, onDeleteItem, onNegativeVariance }) => {

  const variance = useMemo(() => {
    const opening = parseFloat(String(item.opening)) || 0;
    const receiving = parseFloat(String(item.receiving)) || 0;
    const closing = parseFloat(String(item.closing)) || 0;
    return opening + receiving - closing;
  }, [item.opening, item.receiving, item.closing]);
  
  const prevVarianceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Check if the ref has been initialized to avoid firing on first render
    if (prevVarianceRef.current !== undefined) {
      // Check if variance crossed from non-negative to negative
      if (prevVarianceRef.current >= 0 && variance < 0) {
        onNegativeVariance(item.name || 'Unnamed Item');
      }
    }
    // Update the ref with the current value for the next render
    prevVarianceRef.current = variance;
  }, [variance, item.name, onNegativeVariance]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onItemChange(name as ItemKey, value);
  };
  
  const handleItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onItemChange('name', e.target.value);
  }

  const handleUomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onItemChange('uom', e.target.value as Uom);
  }

  const varianceColor = variance < 0 ? 'text-red-400' : 'text-green-400';

  return (
    <tr className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors duration-150 group">
      <td className="px-4 py-2 text-center text-slate-400">{serialNumber}</td>
      <td className="px-4 py-2">
        <input
            type="text"
            value={item.name || ''}
            onChange={handleItemNameChange}
            className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
            placeholder="Item name..."
        />
      </td>
      <td className="px-4 py-2">
        <select
          value={item.uom || 'COUNT'}
          onChange={handleUomChange}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-1 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          aria-label="Unit of Measurement"
        >
          {UOM_OPTIONS.map(uom => (
            <option key={uom} value={uom} className="bg-slate-800 text-slate-200">
              {uom}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          name="price"
          value={item.price || ''}
          onChange={handleInputChange}
          className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
          placeholder="0.00"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          name="opening"
          value={item.opening || ''}
          onChange={handleInputChange}
          className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
          placeholder="0"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          name="receiving"
          value={item.receiving || ''}
          onChange={handleInputChange}
          className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
          placeholder="0"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          name="closing"
          value={item.closing || ''}
          onChange={handleInputChange}
          className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
          placeholder="0"
        />
      </td>
      <td className={`px-4 py-2 font-mono font-semibold ${varianceColor}`}>
        {variance.toFixed(2)}
      </td>
      <td className="px-4 py-2 text-center">
        <button 
          onClick={onDeleteItem} 
          className="text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete item"
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
};

export const TableRow = React.memo(MemoizedTableRow);