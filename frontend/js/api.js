// =============================================
// API HELPER - COMPLETE REWRITE
// =============================================

const API = {

  // ===== BASE REQUEST =====
  async request(endpoint, options = {}) {

    // Get token from storage
    const token = localStorage.getItem('tsr_token');

    // Build headers
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge with any extra headers passed in
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Build full URL
    const url = `${CONFIG.API_URL}${endpoint}`;

    console.log(`API ${options.method || 'GET'} → ${url}`);

    try {
      const response = await fetch(url, {
        method:  options.method  || 'GET',
        headers: headers,
        body:    options.body    || undefined
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error ${response.status}`);
      }

      return data;

    } catch (error) {
      // Network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(
          'Cannot connect to server. ' +
          'Check your internet connection or the backend may be sleeping. ' +
          'Please wait 30 seconds and try again.'
        );
      }
      throw error;
    }
  },

  // ===== GET =====
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  // ===== POST =====
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body:   JSON.stringify(body)
    });
  },

  // ===== PUT =====
  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body:   JSON.stringify(body)
    });
  },

  // ===== DELETE =====
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // ===== UPLOAD (FormData - no Content-Type header) =====
  async upload(endpoint, formData, onProgress) {
    const token = localStorage.getItem('tsr_token');
    const url   = `${CONFIG.API_URL}${endpoint}`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.message || 'Upload failed'));
          }
        } catch (e) {
          reject(new Error('Invalid server response'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', url);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }
};