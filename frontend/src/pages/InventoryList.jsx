import React, { useEffect, useState } from 'react';
import { inventory, categories as categoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Download, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';

const InventoryList = () => {
  const { warehouseId } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(''); 
  const { t } = useTranslation();

  useEffect(() => {
    fetchInventory();
    fetchCategories(); 
  }, [warehouseId]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await inventory.getAll();
      const filtered = warehouseId 
        ? response.data.filter(item => item.warehouse === parseInt(warehouseId))
        : response.data;
      setInventoryItems(filtered);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setAvailableCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleExport = () => {
    const dataToExport = sortedItems.map(item => ({
      Image: item.product_details?.image || t('common.noImage'),
      SKU: item.product_details.sku,
      Name: item.product_details.name,
      Category: item.product_details.category_details?.name || t('common.na'),
      Description: item.product_details?.description || t('inventoryList.noDescription'),
      Quantity: item.quantity,
      Status: item.quantity < 10 ? t('common.lowStock') : t('common.inStock'),
      LastUpdated: new Date(item.last_updated).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `inventory_warehouse_${warehouseId}.xlsx`);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSearchedItems = inventoryItems.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      item.product_details?.name.toLowerCase().includes(term) ||
      item.product_details?.sku.toLowerCase().includes(term)
    );
    const matchesCategory = selectedCategory 
        ? (item.product_details?.category === parseInt(selectedCategory)) 
        : true; 

    return matchesSearch && matchesCategory;
  });

  const sortedItems = [...filteredAndSearchedItems].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue, bValue;

    if (sortConfig.key === 'name') {
        aValue = a.product_details?.name.toLowerCase() || '';
        bValue = b.product_details?.name.toLowerCase() || '';
    } else if (sortConfig.key === 'quantity') {
        aValue = a.quantity;
        bValue = b.quantity;
    } else {
        return 0;
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const getSortIcon = (key) => {
      if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 inline-block ml-1 text-gray-400" />;
      return sortConfig.direction === 'ascending' 
        ? <ArrowUp className="w-4 h-4 inline-block ml-1 text-blue-600" /> 
        : <ArrowDown className="w-4 h-4 inline-block ml-1 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-base shadow-sm transition-all duration-200"
            placeholder={t('common.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Category Filter */}
        <div className="relative w-full sm:w-auto">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-500" />
            </div>
            <select
                className="block w-full sm:w-64 pl-11 pr-10 py-3 text-base border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl shadow-sm bg-white hover:bg-gray-50 cursor-pointer transition-all duration-200 text-gray-700 appearance-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
            >
                <option value="">{t('common.allCategories')}</option>
                {availableCategories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                    </option>
                ))}
            </select>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
            <button
                onClick={handleExport}
                className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3 border-2 border-gray-200 shadow-sm text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
                <Download className="h-5 w-5 mr-2" />
                {t('common.export')}
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        {loading ? (
           <div className="p-12 text-center text-gray-500">{t('common.loading')}</div> 
        ) : (
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.image')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.sku')}</th>
                <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('name')}
                >
                    {t('common.productName')} {getSortIcon('name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.description')}</th>
                <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('quantity')}
                >
                    {t('common.quantity')} {getSortIcon('quantity')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {sortedItems.length > 0 ? (
                    sortedItems.map((item) => (
                    <tr key={item.inventory_id} className={`hover:bg-gray-50 transition-colors duration-150 ${item.quantity < 10 ? "bg-red-50 hover:bg-red-100" : ""}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.product_details?.image ? (
                                <img src={item.product_details.image} alt={item.product_details.name} className="h-24 w-20 rounded-lg object-cover shadow-sm" />
                            ) : (
                                <div className="h-24 w-20 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs shadow-sm">{t('common.noImgShort')}</div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{item.product_details?.sku || t('common.na')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product_details?.name || t('common.unknownProduct')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.product_details?.category_details?.name || t('common.na')}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 overflow-hidden text-ellipsis max-w-xs" title={item.product_details?.description}>
                            {item.product_details?.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity < 10 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> {t('common.lowStock')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    {t('common.inStock')}
                                </span>
                            )}
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500 italic">{t('inventoryList.noItemsMatch')}</td>
                    </tr>
                )}
            </tbody>
            </table>
        )}
      </div>
    </div>
  );
};


export default InventoryList;