import Constants from 'expo-constants';

function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;
  const devHost = hostUri?.split(':')[0];

  if (devHost) {
    return `http://${devHost}:3000/api`;
  }

  // Android emulator fallback
  return 'http://10.0.2.2:3000/api';
}

const API_BASE_URL = resolveApiBaseUrl();
const REQUEST_TIMEOUT_MS = 10000;

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function isApiUsingHttps() {
  return API_BASE_URL.startsWith('https://');
}

if (__DEV__ && !isApiUsingHttps()) {
  console.warn(
    '[MOJI] 개발 모드: API가 HTTP로 연결됩니다. 운영 배포 시 EXPO_PUBLIC_API_BASE_URL을 https:// 로 설정하세요.'
  );
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Check API server and network.');
    }
    throw new Error('Network request failed. Check API server address.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function login(email, password) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
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

export async function signup(email, password) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Signup failed');
  }

  return response.json();
}

export async function uploadImage(token, image, patternType = 'crown') {
  const fileResponse = await fetch(image.uri);
  const blob = await fileResponse.blob();

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const response = await fetchWithTimeout(`${API_BASE_URL}/upload/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Pattern-Type': patternType,
    },
    body: JSON.stringify({
      file: base64,
      filename: image.fileName || `photo.${image.uri.split('.').pop() || 'jpg'}`,
      mimetype: image.type || 'image/jpeg',
      patternType,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Upload failed');
  }

  return response.json();
}

export async function getAnalysisHistory(token, patternType = null) {
  const query = patternType ? `?patternType=${encodeURIComponent(patternType)}` : '';
  const response = await fetchWithTimeout(`${API_BASE_URL}/analysis/history${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Failed to load analysis history');
  }

  return response.json();
}
