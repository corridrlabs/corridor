import React, { useState, useEffect, createContext, useContext } from 'react'
import { authApi, User, RegistrationData } from '../api/auth'
import { useNavigate } from 'react-router-dom'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: RegistrationData) => Promise<User>
  logout: () => void
  loginWithGoogle: (token: string) => Promise<User>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    localStorage.setItem('token', response.access_token)
    const userData = await authApi.getCurrentUser()
    setUser(userData)
    navigate('/dashboard')
    return userData
  }

  const register = async (data: RegistrationData) => {
    const response = await authApi.register(data)
    localStorage.setItem('token', response.access_token)
    const userData = await authApi.getCurrentUser()
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const loginWithGoogle = async (token: string) => {
    const response = await authApi.googleLogin(token)
    localStorage.setItem('token', response.access_token)
    const userData = await authApi.getCurrentUser()
    setUser(userData)
    navigate('/dashboard')
    return userData
  }

  return (
    <AuthContext.Provider value={{
      user,
      token: localStorage.getItem('token'),
      isAuthenticated,
      loading,
      login,
      register,
      logout,
      loginWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
