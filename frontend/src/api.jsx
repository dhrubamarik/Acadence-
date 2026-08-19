// src/api.js - Production Ready (No Debug Logs)
import axios from 'axios'

// ✅ Proper URL handling - force HTTP for localhost
const getAPIBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL
  if (envURL) {
    // Remove trailing slash
    let url = envURL.replace(/\/$/, '')
    
    // Force HTTP for localhost/127.0.0.1 (prevent HTTPS redirect)
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      url = url.replace('https://', 'http://')
    }
    
    return url
  }
  return 'http://127.0.0.1:8000' // Local development default
}

const API_BASE_URL = getAPIBaseURL()

// 🔇 Only log in development mode
const isDev = import.meta.env.DEV
if (isDev) {
  console.log('🔌 API Base URL:', API_BASE_URL)
}

const API = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  withCredentials: true,
})

// ── Track Cold Start State ─────────────────────────────────
let isWakingUp = false

// ── Request Interceptor ────────────────────────────────────
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // ✅ Only set Content-Type for JSON, NOT for FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }
    
    return config
  },
  error => Promise.reject(error)
)

// ── Response Interceptor (with Cold Start Handling) ────────
API.interceptors.response.use(
  response => {
    // 🔇 Only log in development
    if (isDev) {
      console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status)
    }
    
    // Reset cold start state on successful response
    if (isWakingUp) {
      isWakingUp = false
      window.dispatchEvent(new CustomEvent('api-server-awake'))
    }
    
    return response
  },
  async error => {
    // ✅ Cold Start Detection: No response = server sleeping
    if (!error.response && !isWakingUp) {
      isWakingUp = true
      window.dispatchEvent(new CustomEvent('api-cold-start'))
    }
    
    // 🔇 Only log errors in development
    if (isDev) {
      console.error('❌ API Error:', error.response?.status, error.config?.url, error.response?.data)
    }
    
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}/api/token/refresh/`,
            { refresh: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          )

          localStorage.setItem('access_token', data.access)
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return API(originalRequest)
        } catch (refreshError) {
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
    }
    return Promise.reject(error)
  }
)

export default API