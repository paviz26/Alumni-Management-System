const API_BASE_URL = '/api';

const getErrorMessage = (data, status) => {
  const detail = data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => {
      const location = Array.isArray(item.loc) ? item.loc.filter((part) => part !== 'body').join('.') : '';
      return location ? `${location}: ${item.msg}` : item.msg;
    }).join('; ');
  }

  if (typeof detail === 'string') {
    return detail;
  }

  if (typeof data?.message === 'string') {
    return data.message;
  }

  const messages = {
    403: 'You do not have permission to perform this action.',
    404: 'The requested item is unavailable or could not be found.',
    409: 'This action conflicts with the current record state.',
    422: 'Please check the submitted information.',
  };
  return messages[status] || `Request failed with status ${status}.`;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
    return null;
  }

  const responseText = await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      if (response.ok) {
        const error = new Error('Invalid response from server');
        error.status = response.status;
        throw error;
      }
    }
  }

  if (!response.ok) {
    const error = new Error(getErrorMessage(data, response.status));
    error.status = response.status;
    error.detail = data?.detail;
    error.data = data;
    throw error;
  }

  const contentType = response.headers.get('content-type');
  if (!data || !contentType || !contentType.includes('application/json')) {
    const error = new Error('Invalid response from server');
    error.status = response.status;
    throw error;
  }

  return data;
};

const api = {
  get: async (endpoint, token) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    return handleResponse(response);
  },

  post: async (endpoint, data, token) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  put: async (endpoint, data, token) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  delete: async (endpoint, token) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    return handleResponse(response);
  },
};

export default api;
