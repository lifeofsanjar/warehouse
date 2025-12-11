import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { categories } from '../services/api';
import { Plus, Trash2, Tag, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Categories = () => {
  const { warehouseId } = useAuth();
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { t } = useTranslation();

  useEffect(() => {
    if (warehouseId) {
      fetchCategories();
    }
  }, [warehouseId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categories.getAll({ warehouse: warehouseId });
      setCategoryList(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    if (!newCategoryName.trim()) {
        setIsSubmitting(false);
        setMessage({ type: 'error', text: t('categories.messages.nameEmpty') });
        return;
    }

    try {
      await categories.create({ name: newCategoryName, warehouse: warehouseId });
      setNewCategoryName('');
      setIsAddModalOpen(false);
      fetchCategories();
      setMessage({ type: 'success', text: t('categories.messages.created') });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error("Error creating category:", error);
      const errorMsg = error.response?.data 
        ? JSON.stringify(error.response.data) 
        : error.message;
      setMessage({ type: 'error', text: `${t('categories.messages.createFailed')}${errorMsg}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('categories.messages.deleteConfirm'))) {
      try {
        await categories.delete(id);
        fetchCategories();
        setMessage({ type: 'success', text: t('categories.messages.deleted') });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error("Error deleting category:", error);
        const errorMsg = error.response?.data 
            ? JSON.stringify(error.response.data) 
            : error.message;
        setMessage({ type: 'error', text: `${t('categories.messages.deleteFailed')}${errorMsg}` });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Tag className="text-blue-600" /> {t('categories.title')}
        </h1>
        <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
            <Plus className="h-5 w-5 mr-2" />
            {t('categories.addCategory')}
        </button>
      </div>

      {message.text && !isAddModalOpen && (
         <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
            <p className="font-medium">{message.text}</p>
         </div>
      )}

      <div className="bg-white shadow-md overflow-hidden rounded-xl border border-gray-200">
        {loading ? (
           <div className="p-12 text-center text-gray-500">{t('common.loading')}</div> 
        ) : (
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('common.id')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('common.name')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {categoryList.length > 0 ? (
                    categoryList.map((cat) => (
                    <tr key={cat.category_id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">#{cat.category_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDelete(cat.category_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic">{t('categories.noCategories')}</td>
                    </tr>
                )}
            </tbody>
            </table>
        )}
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity"></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-6 pt-6 pb-6 sm:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900" id="modal-title">{t('categories.addNew')}</h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                            <p className="font-medium">{message.text}</p>
                        </div>
                    )}

                    <form onSubmit={handleAddCategory} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('categories.nameLabel')}</label>
                            <input 
                                type="text" 
                                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                placeholder={t('categories.namePlaceholder')}
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mt-8 sm:grid sm:grid-cols-2 sm:gap-4 sm:grid-flow-row-dense">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={`w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-4 py-3 text-base font-semibold text-white sm:col-start-2 
                                    ${isSubmitting 
                                        ? 'bg-blue-400 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all duration-200'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('common.saving')}
                                    </>
                                ) : (
                                    t('categories.createButton')
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

export default Categories;
