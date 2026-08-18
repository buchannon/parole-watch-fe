import axios, { AxiosError } from 'axios'
import { logError, logWarn } from './logger'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

const CSRF_COOKIE = 'csrftoken'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE'])

function readCookie(name: string): string | null {
  const value = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1]
  return value ? decodeURIComponent(value) : null
}

api.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toUpperCase()
  if (!SAFE_METHODS.has(method)) {
    const csrf = readCookie(CSRF_COOKIE)
    if (csrf) config.headers.set('X-CSRFToken', csrf)
  }
  return config
})

type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const url = error.config?.url
    const isLoginRequest = Boolean(url?.endsWith('/auth/login/'))
    if (status === 401 && !isLoginRequest) {
      logError('Unauthorized API request', url ?? '')
      unauthorizedHandler?.()
    } else if (status !== undefined && status >= 400) {
      logWarn('API request failed', url ?? '', status)
    }
    return Promise.reject(error)
  },
)
