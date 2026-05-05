const API_BASE_URL = 'http://192.168.123.134:3000/api';

console.log('[API] Base URL:', API_BASE_URL);

export async function login(email, password) {
  const url = `${API_BASE_URL}/auth/login`;
  console.log('[Login] Requesting:', url);
  
  const response = await fetch(url, {
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
  const url = `${API_BASE_URL}/upload/image`;
  console.log('[Upload] URL:', url);
  console.log('[Upload] Token:', token ? 'present' : 'missing');
  console.log('[Upload] Image:', {
    uri: image.uri,
    name: image.fileName,
    type: image.type,
  });

  try {
    console.log('[Upload] Fetching file from URI...');
    const response = await fetch(image.uri);
    const blob = await response.blob();
    console.log('[Upload] Blob created:', { size: blob.size, type: blob.type });

    // Blob을 Base64로 변환
    console.log('[Upload] Converting to Base64...');
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result.split(',')[1]; // "data:..." 부분 제거
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    console.log('[Upload] Base64 converted:', { length: base64.length });

    // Base64 JSON으로 전송
    console.log('[Upload] Sending Base64 request...');
    const uploadResponse = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64,
        filename: image.fileName || 'photo.jpg',
        mimetype: image.type || 'image/jpeg',
      }),
    });

    console.log('[Upload] Response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      let errorBody;
      try {
        errorBody = await uploadResponse.json();
      } catch (e) {
        errorBody = { error: `HTTP ${uploadResponse.status}` };
      }
      throw new Error(errorBody?.error || `Upload failed: ${uploadResponse.status}`);
    }

    const result = await uploadResponse.json();
    console.log('[Upload] Success:', result);
    return result;
  } catch (error) {
    console.error('[Upload] Error:', error.message);
    throw error;
  }
}
