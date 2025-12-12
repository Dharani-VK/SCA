import { API_BASE_URL } from '../utils/constants'

export type LoginResponse = {
    access_token: string
    token_type: string
    user?: Student
}

export type Student = {
    university: string
    roll_no: string
    full_name?: string
}

export async function loginStudent(university: string, roll_no: string, full_name: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ university, roll_no, full_name, password }),
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
    }

    const data = await response.json()

    // Add user data to response for instant navigation
    return {
        ...data,
        user: { university, roll_no, full_name }
    }
}

export async function fetchCurrentUser(token: string): Promise<Student> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to fetch user')
    }

    return response.json()
}

export async function verifyUser(university: string, roll_no: string): Promise<{ exists: boolean, full_name?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ university, roll_no })
    })

    if (!response.ok) {
        throw new Error('Failed to verify user')
    }
    return response.json()
}
