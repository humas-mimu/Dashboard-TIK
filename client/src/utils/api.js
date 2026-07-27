/**
 * API fetch wrapper to handle auth errors and base configurations.
 */
export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  // Handle FormData headers (browser handles boundary automatically if Content-Type is omitted)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Token expired or invalid, auto logout
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.')
  }

  return response
}
