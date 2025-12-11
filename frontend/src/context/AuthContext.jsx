import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [warehouseId, setWarehouseId] = useState(localStorage.getItem('warehouse_id'));
  const [warehouseName, setWarehouseName] = useState(localStorage.getItem('warehouse_name'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await auth.login({ username, password });
      const { token, warehouse_id, warehouse_name, ...userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('warehouse_id', warehouse_id || '');
      localStorage.setItem('warehouse_name', warehouse_name || '');

      setToken(token);
      setUser(userData);
      setWarehouseId(warehouse_id);
      setWarehouseName(warehouse_name);
      return true;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const logout = () => {
    auth.logout();
    setToken(null);
    setUser(null);
    setWarehouseId(null);
    setWarehouseName(null);
    localStorage.removeItem('warehouse_name');
  };

  return (
    <AuthContext.Provider value={{ user, token, warehouseId, warehouseName, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);
