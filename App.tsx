import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { SheetTable } from './components/SheetTable';
import { DownloadIcon, WhatsAppIcon, PlusIcon, SearchIcon, FilterIcon, WarningIcon } from './components/icons';
import { initialInventoryData } from './services/data';
import type { InventoryCategory, InventoryItem, ItemKey, Uom } from './types';


type ActiveFilters = {
  variance: 'all' | 'positive' | 'negative' | 'zero';
  stock: 'all' | 'outOfStock';
  status: 'all' | 'incomplete';
};

const defaultFilters: ActiveFilters = {
  variance: 'all',
  stock: 'all',
  status: 'all',
};

const App: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<InventoryCategory[]>(() => {
    try {
      const savedData = localStorage.getItem('inventoryData');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Failed to load inventory data from localStorage", error);
    }
    return initialInventoryData;
  });

  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(defaultFilters);
  const [tempFilters, setTempFilters] = useState<ActiveFilters>(defaultFilters);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
    } catch (error) {
      console.error("Failed to save inventory data to localStorage", error);
    }
  }, [inventoryData]);

  useEffect(() => {
    if (selectedCategoryFilter === 'all') return;
    const filterExists = inventoryData.some(cat => cat.id === selectedCategoryFilter);
    if (!filterExists) {
      setSelectedCategoryFilter('all');
    }
  }, [inventoryData, selectedCategoryFilter]);

  const handleItemChange = useCallback((categoryId: string, itemId: string, field: ItemKey, value: string) => {
    setInventoryData(prevData =>
      prevData.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            items: category.items.map(item =>
              item.id === itemId ? { ...item, [field]: value } : item
            ),
          };
        }
        return category;
      })
    );
  }, []);

  const handleAddItem = useCallback((categoryId: string) => {
    setInventoryData(prevData =>
      prevData.map(category => {
        if (category.id === categoryId) {
          const newItem: InventoryItem = {
            id: Date.now().toString(),
            name: '',
            uom: 'COUNT',
            opening: '',
            receiving: '',
            closing: '',
            price: '',
          };
          return {
            ...category,
            items: [...category.items, newItem],
          };
        }
        return category;
      })
    );
  }, []);
  
  const handleDeleteItem = useCallback((categoryId: string, itemId: string) => {
    setInventoryData(prevData =>
      prevData.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            items: category.items.filter(item => item.id !== itemId),
          };
        }
        return category;
      })
    );
  }, []);

  const handleConfirmAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNewName = newCategoryName.trim();
    if (!trimmedNewName) return;

    const isDuplicate = inventoryData.some(cat => cat.category.toLowerCase() === trimmedNewName.toLowerCase());
    if (isDuplicate) {
      setAlertModal({
        isOpen: true,
        title: 'Duplicate Category',
        message: `Category name "${trimmedNewName}" already exists. Please choose a unique name.`,
      });
      return;
    }

    const newCategory: InventoryCategory = {
      id: `cat-${Date.now().toString()}`,
      category: trimmedNewName,
      items: [{ id: Date.now().toString(), name: '', uom: 'COUNT', opening: '', receiving: '', closing: '', price: '' }],
    };
    
    setInventoryData(prevData => [...prevData, newCategory]);
    setIsAddCategoryModalOpen(false);
    setNewCategoryName('');
  };

  const handleDeleteCategory = useCallback((categoryIdToDelete: string) => {
    setCategoryToDelete(categoryIdToDelete);
    setIsDeleteCategoryModalOpen(true);
  }, []);

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      setInventoryData(prevData => prevData.filter(category => category.id !== categoryToDelete));
    }
    setIsDeleteCategoryModalOpen(false);
    setCategoryToDelete(null);
  };
  
  const handleCancelDelete = () => {
    setIsDeleteCategoryModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleUpdateCategoryName = useCallback((categoryId: string, newName: string) => {
    const trimmedNewName = newName.trim();

    if (!trimmedNewName) {
      setAlertModal({ isOpen: true, title: 'Invalid Name', message: 'Category name cannot be empty.' });
      return;
    }
    
    const categoryBeingEdited = inventoryData.find(cat => cat.id === categoryId);
    
    const isDuplicate = inventoryData.some(cat => 
        cat.category.toLowerCase() === trimmedNewName.toLowerCase() && 
        cat.category.toLowerCase() !== categoryBeingEdited?.category.toLowerCase()
    );

    if (isDuplicate) {
      setAlertModal({ isOpen: true, title: 'Duplicate Category', message: `Category name "${trimmedNewName}" already exists. Please choose a unique name.` });
      // Revert the input field visually by re-setting the data
      setInventoryData(prevData => [...prevData]);
      return;
    }
    
    setInventoryData(prevData => 
        prevData.map(category => category.id === categoryId ? { ...category, category: newName } : category)
    );
  }, [inventoryData]);

  const handleExportCSV = () => {
    const headers = ['S.NO', 'CATEGORY', 'ITEMS', 'UOM', 'PRICE', 'OPENING', 'RECEIVING', 'CLOSING', 'VARIANCE'];
    let csvContent = headers.join(',') + '\n';
    let serialNumber = 1;
    filteredData.forEach(category => {
      category.items.forEach(item => {
        const opening = parseFloat(String(item.opening)) || 0;
        const receiving = parseFloat(String(item.receiving)) || 0;
        const closing = parseFloat(String(item.closing)) || 0;
        const variance = opening + receiving - closing;
        const row = [serialNumber++, `"${category.category}"`, `"${item.name}"`, item.uom, item.price, item.opening, item.receiving, item.closing, variance].join(',');
        csvContent += row + '\n';
      });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `inventory_sheet_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateUsageReport = (): string => {
    const reportDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString();
    let report = `Inventory Usage Report - ${reportDate}\n\n`;
    
    const usedItems: { item: InventoryItem, usage: number, closing: number }[] = [];

    inventoryData.forEach(category => {
      category.items.forEach(item => {
        if (!item.name.trim()) return;

        const opening = parseFloat(String(item.opening)) || 0;
        const receiving = parseFloat(String(item.receiving)) || 0;
        const closing = parseFloat(String(item.closing)) || 0;
        const usage = opening + receiving - closing;
        
        if (usage > 0) {
          usedItems.push({ item, usage, closing });
        }
      });
    });

    if (usedItems.length === 0) {
      return `No items were used from the inventory on ${reportDate}. All stock is accounted for.`;
    }
    
    const closingStockLines = usedItems.map(({ item, closing }) => 
      `- ${item.name}: ${closing.toFixed(2)} ${item.uom}(closing number)`
    );

    let totalValueUsed = 0;
    const usageCostLines = usedItems.map(({ item, usage }) => {
      const price = parseFloat(String(item.price)) || 0;
      const value = usage * price;
      totalValueUsed += value;
      return `- ${item.name}: ${usage.toFixed(2)} ${item.uom} (Value Used: ${value.toFixed(2)})`;
    });
    
    report += closingStockLines.join('\n');
    report += '\n\n*Raw material Cost:*\n\n';
    report += usageCostLines.join('\n');
    report += `\n\n*Total Value of Items Used: ${totalValueUsed.toFixed(2)}*`;
    
    return report;
  };

  const handleSendWhatsApp = () => {
    if (!phoneNumber.trim()) {
      setAlertModal({ isOpen: true, title: 'Invalid Phone Number', message: 'Please enter a valid phone number with country code.' });
      return;
    }
    const cleanedPhoneNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (cleanedPhoneNumber.length < 10) {
      setAlertModal({ isOpen: true, title: 'Invalid Phone Number', message: 'Phone number seems too short. Please include country code, e.g., +919876543210.' });
      return;
    }
    const message = generateUsageReport();
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanedPhoneNumber.replace('+', '')}?text=${encodedMessage}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const handleNegativeVariance = useCallback((itemName: string) => {
    setAlertModal({
      isOpen: true,
      title: 'Inventory Alert',
      message: `The variance for "${itemName}" is negative. Please check the opening, receiving, and closing stock values as this is usually not possible.`,
    });
  }, []);

  const filteredData = useMemo(() => {
    let processedData = inventoryData;

    if (selectedCategoryFilter !== 'all') {
      processedData = processedData.filter(category => category.id === selectedCategoryFilter);
    }

    if (searchQuery.trim() !== '') {
      processedData = processedData.map(category => ({
        ...category,
        items: category.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        ),
      })).filter(category => category.items.length > 0);
    }

    const { variance, stock, status } = activeFilters;
    if (variance !== 'all' || stock !== 'all' || status !== 'all') {
      processedData = processedData.map(category => ({
        ...category,
        items: category.items.filter(item => {
          const opening = parseFloat(String(item.opening)) || 0;
          const receiving = parseFloat(String(item.receiving)) || 0;
          const closing = parseFloat(String(item.closing)) || 0;
          const itemVariance = opening + receiving - closing;

          const varianceMatch = variance === 'all' ||
            (variance === 'positive' && itemVariance > 0) ||
            (variance === 'negative' && itemVariance < 0) ||
            (variance === 'zero' && itemVariance === 0);

          const stockMatch = stock === 'all' ||
            (stock === 'outOfStock' && closing === 0 && (String(item.closing).trim() !== '' || String(item.opening).trim() !== ''));

          const statusMatch = status === 'all' ||
            (status === 'incomplete' && (
              item.name.trim() === '' ||
              String(item.opening).trim() === '' ||
              String(item.receiving).trim() === '' ||
              String(item.closing).trim() === '' ||
              String(item.price).trim() === ''
            ));

          return varianceMatch && stockMatch && statusMatch;
        }),
      })).filter(category => category.items.length > 0);
    }

    return processedData;
  }, [inventoryData, selectedCategoryFilter, searchQuery, activeFilters]);

  const handleApplyFilters = () => {
    setActiveFilters(tempFilters);
    setIsFilterModalOpen(false);
  };
  
  const handleClearFilters = () => {
    setActiveFilters(defaultFilters);
    setTempFilters(defaultFilters);
    setIsFilterModalOpen(false);
  };

  const openFilterModal = () => {
    setTempFilters(activeFilters);
    setIsFilterModalOpen(true);
  };

  const filtersAreActive = JSON.stringify(activeFilters) !== JSON.stringify(defaultFilters);
  const categoryToDeleteName = inventoryData.find(cat => cat.id === categoryToDelete)?.category || '';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-white tracking-tight">Inventory Management Sheet</h1>
            <p className="text-slate-400 mt-1">A dynamic spreadsheet for tracking stock levels.</p>
          </div>
          
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div>
                    <label htmlFor="phone-number" className="sr-only">Owner's WhatsApp Number</label>
                    <input
                      id="phone-number"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Owner's WhatsApp (+91...)"
                      className="w-full sm:w-56 bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400"
                      aria-label="Owner's WhatsApp Phone Number"
                    />
                  </div>
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={!phoneNumber.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                  >
                    <WhatsAppIcon />
                    Send Usage Report
                  </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-700 border border-slate-600 rounded-md px-3 text-slate-400 focus-within:text-white focus-within:ring-2 focus-within:ring-teal-500">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-40 bg-transparent py-2 text-slate-200 focus:outline-none placeholder-slate-400"
                        aria-label="Search for items"
                    />
                </div>
                <button
                  onClick={openFilterModal}
                  className={`relative w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-colors duration-200 ${filtersAreActive ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-slate-600 text-slate-200 hover:bg-slate-500 focus:ring-slate-400'}`}
                >
                  <FilterIcon />
                  Filters
                  {filtersAreActive && <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-slate-800/50"></span>}
                </button>
                <button
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200"
                  >
                  <PlusIcon />
                  Add Category
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-75 transition-colors duration-200"
                >
                  <DownloadIcon />
                  Export CSV
                </button>
              </div>
          </div>
           <div className="mt-4 p-2 bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col sm:flex-row items-center justify-start gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <label htmlFor="inventory-date" className="text-sm font-medium text-slate-300">Date:</label>
                <input
                  id="inventory-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  aria-label="Inventory Date"
                />
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="category-filter" className="text-sm font-medium text-slate-300">Category:</label>
                <select
                  id="category-filter"
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full sm:w-56 bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  aria-label="Filter by Category"
                >
                  <option value="all" className="bg-slate-800">All Categories</option>
                  {inventoryData.map(category => (
                    <option key={category.id} value={category.id} className="bg-slate-800">
                      {category.category}
                    </option>
                  ))}
                </select>
              </div>
          </div>
        </header>
        
        <main className="bg-slate-800 shadow-2xl rounded-xl overflow-hidden">
          {filteredData.length > 0 ? (
            <SheetTable
              data={filteredData}
              onItemChange={handleItemChange}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              onDeleteCategory={handleDeleteCategory}
              onUpdateCategoryName={handleUpdateCategoryName}
              onNegativeVariance={handleNegativeVariance}
            />
          ) : (
            <div className="text-center py-16 px-4">
                <h3 className="text-xl font-semibold text-white">No Items Found</h3>
                <p className="text-slate-400 mt-2">No items match your current search and filter criteria. Try adjusting your search or clearing the filters.</p>
                <button
                  onClick={() => { setSearchQuery(''); handleClearFilters(); }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Clear Search & Filters
                </button>
            </div>
          )}
        </main>

        {isFilterModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700">
              <h2 className="text-xl font-bold mb-6 text-white">Advanced Filters</h2>
              <div className="space-y-6">
                
                {/* Variance Filter */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Filter by Variance</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['all', 'positive', 'negative', 'zero'] as const).map(option => (
                      <label key={option} className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-colors ${tempFilters.variance === option ? 'bg-teal-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                        <input type="radio" name="variance" value={option} checked={tempFilters.variance === option} onChange={() => setTempFilters(f => ({ ...f, variance: option }))} className="sr-only" />
                        <span className="capitalize">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stock Filter */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Filter by Stock</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['all', 'outOfStock'] as const).map(option => (
                      <label key={option} className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-colors ${tempFilters.stock === option ? 'bg-teal-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                        <input type="radio" name="stock" value={option} checked={tempFilters.stock === option} onChange={() => setTempFilters(f => ({ ...f, stock: option }))} className="sr-only" />
                        <span>{option === 'outOfStock' ? 'Out of Stock' : 'All'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Filter by Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['all', 'incomplete'] as const).map(option => (
                      <label key={option} className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-colors ${tempFilters.status === option ? 'bg-teal-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                        <input type="radio" name="status" value={option} checked={tempFilters.status === option} onChange={() => setTempFilters(f => ({ ...f, status: option }))} className="sr-only" />
                         <span>{option === 'incomplete' ? 'Incomplete Entries' : 'All'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center gap-4">
                 <button type="button" onClick={handleClearFilters} className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg">Clear All Filters</button>
                 <div className="flex gap-4">
                    <button type="button" onClick={() => setIsFilterModalOpen(false)} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700">Cancel</button>
                    <button type="button" onClick={handleApplyFilters} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Apply Filters</button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {isAddCategoryModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-white">Add New Category</h2>
              <form onSubmit={handleConfirmAddCategory}>
                <div>
                  <label htmlFor="new-category-name" className="block text-sm font-medium text-slate-300 mb-2">Category Name</label>
                  <input id="new-category-name" type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g., 'Dairy Products'" className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400" autoFocus required />
                </div>
                <div className="mt-6 flex justify-end gap-4">
                  <button type="button" onClick={() => { setIsAddCategoryModalOpen(false); setNewCategoryName(''); }} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700">Cancel</button>
                  <button type="submit" disabled={!newCategoryName.trim()} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-500 disabled:cursor-not-allowed">Add Category</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteCategoryModalOpen && categoryToDelete && (
          <div className="fixed inset-0 bg-slate-900/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700">
              <h2 className="text-xl font-bold mb-2 text-white">Confirm Deletion</h2>
              <p className="text-slate-300 mb-6">Are you sure you want to delete the category "<strong>{categoryToDeleteName}</strong>"? All items within this category will be permanently removed. This action cannot be undone.</p>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={handleCancelDelete} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700">Cancel</button>
                <button type="button" onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700">Delete Category</button>
              </div>
            </div>
          </div>
        )}
        
        {alertModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <WarningIcon />
                </div>
                <div className="ml-4 text-left">
                  <h2 className="text-xl font-bold text-white" id="modal-title">{alertModal.title}</h2>
                  <p className="text-slate-300 mt-2">{alertModal.message}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;