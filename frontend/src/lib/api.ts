const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getAuthHeaders() {
  const token = sessionStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export const api = {
  async get(endpoint: string) {
    const headers = getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers })
    if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`)
    return response.json()
  },
  async post(endpoint: string, data: any) {
    const headers = getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers, body: JSON.stringify(data) })
    if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`)
    return response.json()
  },
  async put(endpoint: string, data: any) {
    const headers = getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'PUT', headers, body: JSON.stringify(data) })
    if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`)
    return response.json()
  },
  async delete(endpoint: string) {
    const headers = getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE', headers })
    if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`)
    return response.json()
  },
}
