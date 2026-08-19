// src/api.js
import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/`
    : 'https://<your-actual-render-backend-name>.onrender.com/api/', // ← Replace with your Render URL
  headers: {
    'Content-Type': 'application/json',
  }
})

API.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default API