import React, { useEffect, useState } from 'react';
import { inventory, products as productApi, categories as categoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, Download, AlertTriangle, Save, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { warehouseId } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // Form State
  const [isNewProductMode, setIsNewProductMode] = useState(false);
  const [newItem, setNewItem] = useState({ 
      product: '', 
      quantity: '',
      newProductName: '',
      newProductSku: '',
      newProductCategory: '',
      newProductDescription: '',
      newProductImage: null
  }); 
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [addFormMessage, setAddFormMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

    useEffect(() => {
      fetchInventory();
      fetchProducts();
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

  

    const fetchProducts = async () => {
      try {
        const response = await productApi.getAll();
        setAvailableProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
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


  

    const handleAddItem = async (e) => {
      e.preventDefault();
      if (!warehouseId) {
          setAddFormMessage({ type: 'error', text: t('dashboard.messages.noWarehouse') });
          return;
      }

      setIsSubmitting(true);
      setAddFormMessage({ type: '', text: '' }); 
      
      try {
        let productIdToUse = newItem.product;

        // If creating a new product first
        if (isNewProductMode) {
            if (!newItem.newProductName || !newItem.newProductSku || !newItem.newProductCategory) {
                setIsSubmitting(false);
                setAddFormMessage({ type: 'error', text: t('dashboard.messages.fillAllFields') });
                return;
            }

            const formData = new FormData();
            formData.append('name', newItem.newProductName);
            formData.append('sku', newItem.newProductSku);
            formData.append('category', parseInt(newItem.newProductCategory));
            formData.append('description', newItem.newProductDescription || t('dashboard.messages.addedViaDashboard'));
            if (newItem.newProductImage) {
                formData.append('image', newItem.newProductImage);
            }

            // Note: services/api.js should handle Content-Type automatically or we might need to specify it.
            // Axios usually handles FormData correctly.
            const productResponse = await productApi.create(formData);
            productIdToUse = productResponse.data.product_id;
            
            // Refresh product list for next time
            fetchProducts();
        }

        const payload = {
          warehouse: parseInt(warehouseId),
          product: parseInt(productIdToUse),
          quantity: parseInt(newItem.quantity)
        };

        if (isNaN(payload.warehouse) || isNaN(payload.product) || isNaN(payload.quantity)) {
           setIsSubmitting(false);
           setAddFormMessage({ type: 'error', text: t('dashboard.messages.invalidInput') });
           return;
        }

        await inventory.create(payload);
        setIsAddModalOpen(false);
        setNewItem({ 
            product: '', 
            quantity: '', 
            newProductName: '', 
            newProductSku: '', 
            newProductCategory: '',
            newProductDescription: '',
            newProductImage: null
        }); 
        setIsNewProductMode(false);
        fetchInventory();
        setAddFormMessage({ type: 'success', text: t('dashboard.messages.itemAdded') }); 
        setTimeout(() => setAddFormMessage({ type: '', text: '' }), 3000); 
      } catch (error) {
        console.error("Error adding item:", error);
        const errorMsg = error.response?.data 
          ? JSON.stringify(error.response.data) 
          : error.message;
        setAddFormMessage({ type: 'error', text: `${t('dashboard.messages.itemFailed')}${errorMsg}` });
      } finally {
          setIsSubmitting(false);
      }
    };


  

    const handleUpdateQuantity = async (id) => {

  
    try {
        const currentItem = inventoryItems.find(i => i.inventory_id === id);
        if (!currentItem) return;

        // Construct payload with ONLY the fields the serializer expects for a write
        // Now that 'product' (ID) is returned by the API, we can use it.
        const payload = {
            warehouse: currentItem.warehouse,
            product: currentItem.product,
            quantity: parseInt(editQuantity)
        };

        await inventory.update(id, payload);
        
        setEditingId(null);
        fetchInventory();
        setAddFormMessage({ type: 'success', text: t('dashboard.messages.qtyUpdated') }); 
        setTimeout(() => setAddFormMessage({ type: '', text: '' }), 3000); 
    } catch (error) {
        console.error("Error updating quantity:", error);
        const errorMsg = error.response?.data 
          ? JSON.stringify(error.response.data) 
          : error.message;
        setAddFormMessage({ type: 'error', text: `${t('dashboard.messages.qtyUpdateFailed')}${errorMsg}` });
    }
  };



  const handleDelete = async (id) => {
    if (window.confirm(t('dashboard.messages.deleteConfirm'))) {
      try {
        await inventory.delete(id);
        fetchInventory();
        setAddFormMessage({ type: 'success', text: t('dashboard.messages.itemDeleted') }); 
        setTimeout(() => setAddFormMessage({ type: '', text: '' }), 3000); 
      } catch (error) {
        console.error("Error deleting item:", error);
        const errorMsg = error.response?.data 
          ? JSON.stringify(error.response.data) 
          : error.message;
        setAddFormMessage({ type: 'error', text: `${t('dashboard.messages.deleteFailed')}${errorMsg}` });
      }
    }
  };

  const handleExport = () => {
    const dataToExport = filteredItems.map(item => ({
      SKU: item.product_details.sku,
      Name: item.product_details.name,
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

  const filteredItems = inventoryItems.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.product_details?.name.toLowerCase().includes(term) ||
      item.product_details?.sku.toLowerCase().includes(term)
    );
  });

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
        
        <div className="flex gap-3 w-full sm:w-auto">
            <button
                onClick={handleExport}
                className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3 border-2 border-gray-200 shadow-sm text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
                <Download className="h-5 w-5 mr-2" />
                {t('common.export')}
            </button>
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
                <Plus className="h-5 w-5 mr-2" />
                {t('dashboard.addItemButton')}
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-md overflow-hidden rounded-xl border border-gray-200">
        {loading ? (
           <div className="p-12 text-center text-gray-500">{t('common.loading')}</div> 
        ) : (
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('common.sku')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('common.productName')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('common.quantity')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                    <tr key={item.inventory_id} className={`transition-colors duration-150 ${item.quantity < 10 ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{item.product_details?.sku || t('common.na')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product_details?.name || t('common.unknownProduct')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingId === item.inventory_id ? (
                                <input 
                                    type="number" 
                                    className="w-24 border-2 border-blue-400 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    autoFocus
                                />
                            ) : (
                                <span className="font-semibold">{item.quantity}</span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity < 10 ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> {t('common.lowStock')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    {t('common.inStock')}
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {editingId === item.inventory_id ? (
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleUpdateQuantity(item.inventory_id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"><Save size={18} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"><X size={18} /></button>
                                </div>
                            ) : (
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => {
                                            setEditingId(item.inventory_id);
                                            setEditQuantity(item.quantity);
                                        }} 
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(item.inventory_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">{t('dashboard.noItemsFound')}</td>
                    </tr>
                )}
            </tbody>
            </table>
        )}
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Background backdrop */}
          <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity"></div>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              {/* Modal panel */}
              <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                <div className="bg-white px-6 pt-6 pb-6 sm:p-8">

                <h3 className="text-2xl font-bold text-gray-900 mb-6" id="modal-title">{t('dashboard.addInventoryItem')}</h3>
                {addFormMessage.text && (
                    <div className={`mb-6 p-4 rounded-xl border ${addFormMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        {addFormMessage.text}
                    </div>
                )}
                <form onSubmit={handleAddItem} className="space-y-6">
                    
                    {/* Toggle Mode */}
                    <div className="flex items-center justify-between p-1 bg-gray-100 rounded-xl mb-6">
                        <button
                            type="button"
                            onClick={() => setIsNewProductMode(false)}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isNewProductMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {t('dashboard.selectExisting')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsNewProductMode(true)}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isNewProductMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {t('dashboard.createNew')}
                        </button>
                    </div>

                    {!isNewProductMode ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.selectProduct')}</label>
                                <select 
                                    className="block w-full pl-4 pr-10 py-3 text-base border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl shadow-sm transition-all"
                                    value={newItem.product}
                                    onChange={(e) => setNewItem({...newItem, product: e.target.value})}
                                    required={!isNewProductMode}
                                >
                                    <option value="">{t('dashboard.selectProduct')}</option>
                                    {availableProducts.map(p => (
                                        <option key={p.product_id} value={p.product_id}>{p.name} ({p.sku})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('common.quantity')}</label>
                                <input 
                                    type="number" 
                                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.newProductName')}</label>
                                <input 
                                    type="text" 
                                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                    value={newItem.newProductName}
                                    onChange={(e) => setNewItem({...newItem, newProductName: e.target.value})}
                                    required={isNewProductMode}
                                    placeholder={t('dashboard.productNamePlaceholder')}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('common.sku')}</label>
                                <input 
                                    type="text" 
                                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                    value={newItem.newProductSku}
                                    onChange={(e) => setNewItem({...newItem, newProductSku: e.target.value})}
                                    required={isNewProductMode}
                                    placeholder={t('dashboard.skuPlaceholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('common.category')}</label>
                                <select 
                                    className="block w-full pl-4 pr-10 py-3 text-base border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl shadow-sm transition-all sm:text-sm"
                                    value={newItem.newProductCategory}
                                    onChange={(e) => setNewItem({...newItem, newProductCategory: e.target.value})}
                                    required={isNewProductMode}
                                >
                                    <option value="">{t('dashboard.selectCategory')}</option>
                                    {availableCategories.map(c => (
                                        <option key={c.category_id} value={c.category_id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('common.description')}</label>
                                <textarea 
                                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                    rows="3"
                                    value={newItem.newProductDescription}
                                    onChange={(e) => setNewItem({...newItem, newProductDescription: e.target.value})}
                                    placeholder={t('dashboard.briefDescription')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.productImage')}</label>
                                <input 
                                    type="file" 
                                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={(e) => setNewItem({...newItem, newProductImage: e.target.files[0]})}
                                    accept="image/*"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('dashboard.initialQuantity')}</label>
                                <input 
                                    type="number" 
                                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                    )}


                    <div className="mt-8 sm:grid sm:grid-cols-2 sm:gap-4 sm:grid-flow-row-dense pt-4 border-t border-gray-100">
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-4 py-3 text-base font-semibold text-white sm:col-start-2 
                                ${isSubmitting 
                                    ? 'bg-blue-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all duration-200'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('common.adding')}
                                </>
                            ) : (
                                t('dashboard.addItemButton')
                            )}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsAddModalOpen(false)} 
                            disabled={isSubmitting}
                            className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-200 shadow-sm px-4 py-3 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>

                </form>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;