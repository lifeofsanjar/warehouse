import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    // headers: { 'Content-Type': 'application/json' } // Removed to allow axios to set content-type automatically (e.g. for FormData)
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const auth = {
    login: (credentials) => api.post('/login/', credentials),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('warehouse_id');
    },
};

export const inventory = {
    getAll: () => api.get('/inventory/'), // Filtering by warehouse should ideally happen on backend or frontend
    create: (item) => api.post('/inventory/', item),
    update: (id, data) => api.put(`/inventory/${id}/`, data),
    delete: (id) => api.delete(`/inventory/${id}/`),
};

export const products = {
    getAll: () => api.get('/products/'),
    create: (data) => api.post('/products/', data),
};


export const categories = {
    getAll: (params) => api.get('/categories/', { params }),
    create: (data) => api.post('/categories/', data),
    delete: (id) => api.delete(`/categories/${id}/`),
};

export const warehouses = {
    get: (id) => api.get(`/warehouses/${id}/`),
};


export default api;