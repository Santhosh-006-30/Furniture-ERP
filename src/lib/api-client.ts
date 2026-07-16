const API_BASE = '/api';

function getToken() {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const isCustomerPortalPath = pathname === '/customer' || pathname.startsWith('/customer/');
    if (isCustomerPortalPath) {
      return localStorage.getItem('customer_portal_token');
    }
    return localStorage.getItem('mini_erp_token');
  }
  return null;
}

async function request(method: string, path: string, body?: any) {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, config);

  if (!response.ok) {
    const isAuthEndpoint =
      path.includes('/auth/login') ||
      path.includes('/auth/register') ||
      path.includes('/customer/login') ||
      path.includes('/customer/register');

    if (response.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      // Use '/customer/' with trailing slash so the admin '/customers' page
      // does NOT get mistakenly treated as a customer portal route.
      const isCustomerPortalPath = pathname === '/customer' || pathname.startsWith('/customer/');
      if (isCustomerPortalPath) {
        localStorage.removeItem('customer_portal_token');
        localStorage.removeItem('customer_portal_user');
        window.dispatchEvent(new CustomEvent('erp:session-expired', { detail: { customer: true } }));
      } else {
        localStorage.removeItem('mini_erp_token');
        localStorage.removeItem('mini_erp_user');
        window.dispatchEvent(new CustomEvent('erp:session-expired', { detail: { customer: false } }));
      }
      throw new Error('Session expired. Please log in again.');
    }

    const errText = await response.text();
    let errJson;
    try {
      errJson = JSON.parse(errText);
    } catch {
      // not JSON
    }
    throw new Error(errJson?.error || errJson?.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body: any) => request('POST', path, body),
  put: (path: string, body?: any) => request('PUT', path, body),
  patch: (path: string, body?: any) => request('PATCH', path, body),
  delete: (path: string) => request('DELETE', path),
};
export default api;
