import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Layout = ({ children }) => {
  const { user, logout, warehouseName } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center">
                <LayoutDashboard className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{t('nav.warehouseController')}</h1>
                  {warehouseName && <p className="text-xs text-gray-500">{warehouseName}</p>}
                </div>
              </div>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-4">
                <Link to="/" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">{t('nav.dashboard')}</Link>
                <Link to="/categories" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">{t('nav.categories')}</Link>
                <Link to="/inventory" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">{t('nav.inventory')}</Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />

              <div className="flex items-center text-gray-700">
                <div className="bg-blue-100 p-2 rounded-full mr-2">
                  <User size={20} className="text-blue-600" />
                </div>
                <span className="font-medium hidden sm:block">{user?.username || 'User'}</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut size={18} className="mr-2" />
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
