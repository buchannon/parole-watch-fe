import { api } from './client'
import type { AuthUser } from '../types'

export async function loginRequest(username: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/auth/login/', { username, password })
  return data
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout/')
}

export async function meRequest(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me/')
  return data
}
