const API_BASE_URL = 'http://10.0.2.2:3000/api';

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Login failed');
  }

  return response.json();
}

export async function uploadImage(token, image) {
  const formData = new FormData();
  formData.append('image', {
    uri: image.uri,
    name: image.fileName || `photo.${image.uri.split('.').pop()}`,
    type: image.type || 'image/jpeg',
  });

  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Upload failed');
  }

  return response.json();
}
