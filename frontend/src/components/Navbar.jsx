import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Market Manager</Link>
        <div className="space-x-4">
          <Link to="/" className="hover:text-blue-200">Dashboard</Link>
          <Link to="/products" className="hover:text-blue-200">Products</Link>
          <Link to="/categories" className="hover:text-blue-200">Categories</Link>
          <Link to="/inventory" className="hover:text-blue-200">Inventory</Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
