import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api', // Backend címe
});

// Kérés elkapó (Interceptor) a JWT Token hozzáadásához
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
