type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RequestOptions<TBody> = {
  method?: HttpMethod
  body?: TBody
  headers?: Record<string, string>
  skipAuth?: boolean  // Option to skip auth for login/register
}

export async function request<TResponse, TBody = unknown>(url: string, options: RequestOptions<TBody> = {}) {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options

  // Automatically add Authorization header if token exists
  const token = localStorage.getItem('token')
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401) {
    // Token expired or invalid - clear ALL storage and redirect to login
    console.warn("Unauthorized access - token may be expired")
    localStorage.clear()

    // Redirect to login page
    window.location.href = '/login'
    throw new Error('Session expired. Please login again.')
  }

  if (response.status === 403) {
    // Forbidden - likely trying to access admin route as student or vice versa
    console.warn("Access forbidden - insufficient permissions")
    throw new Error('Access forbidden. You do not have permission to access this resource.')
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  return (await response.json()) as TResponse
}

