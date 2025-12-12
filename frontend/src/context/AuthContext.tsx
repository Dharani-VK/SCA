import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Student } from '../services/auth'
import useAppStore from '../store/useAppStore'

interface AuthContextType {
    user: Student | null
    token: string | null
    login: (token: string, userData?: Student) => void
    logout: () => void
    isAuthenticated: boolean
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Student | null>(null)
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)
    const setFilesQueue = useAppStore((state) => state.setFilesQueue)

    useEffect(() => {
        const initAuth = () => {
            const storedToken = localStorage.getItem('token');
            const studentData = localStorage.getItem('student');
            const adminData = localStorage.getItem('admin');

            if (storedToken) {
                if (studentData) {
                    try {
                        setUser(JSON.parse(studentData));
                    } catch (e) {
                        console.error("Failed to parse student data", e);
                    }
                } else if (adminData) {
                    try {
                        setUser(JSON.parse(adminData));
                    } catch (e) {
                        console.error("Failed to parse admin data", e);
                    }
                }
            } else {
                setUser(null);
            }
            setLoading(false)
        }
        initAuth()
    }, [])

    const login = (newToken: string, userData?: Student) => {
        localStorage.setItem('token', newToken)
        setToken(newToken)

        if (userData) {
            setUser(userData)
            // Track current user for upload queue isolation
            const userKey = localStorage.getItem('student') || localStorage.getItem('admin')
            localStorage.setItem('sca-last-user', userKey || '')
        }

        // CRITICAL: Clear upload queue on login to ensure tenant isolation
        // Each user should start with a fresh upload queue
        setFilesQueue([])
    }

    const logout = () => {
        // Clear authentication tokens and user data
        localStorage.removeItem('token')
        localStorage.removeItem('student')
        localStorage.removeItem('admin')
        localStorage.removeItem('sca-last-user') // Clear user tracking
        setToken(null)
        setUser(null)

        // CRITICAL: Clear upload queue to prevent cross-tenant data leakage
        // This ensures that when a user logs out and another user logs in,
        // the upload queue doesn't show the previous user's files
        setFilesQueue([])

        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
