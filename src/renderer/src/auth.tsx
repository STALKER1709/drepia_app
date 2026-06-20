import React, { createContext, useContext, useState } from 'react'
import { User } from '@shared/types'

interface AuthState {
  user: User | null
  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)

  const login = async (username: string, password: string): Promise<string | null> => {
    const res = await window.api.auth.login(username, password)
    if (!res.ok || !res.user) return res.error || 'Erreur de connexion'
    setUser(res.user)
    return null
  }

  const logout = (): void => setUser(null)

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function canEnter(role: string, allowed: string[]): boolean {
  return allowed.includes(role)
}
