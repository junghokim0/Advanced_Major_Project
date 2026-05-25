import Constants from 'expo-constants';

function resolveServerOrigin() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/api\/?$/, '');
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;
  const devHost = hostUri?.split(':')[0];

  if (devHost) {
    return `http://${devHost}:3000`;
  }

  return 'http://10.0.2.2:3000';
}

export function getUploadImageUrl(filename) {
  if (!filename) return null;
  const encoded = encodeURIComponent(filename);
  return `${resolveServerOrigin()}/uploads/${encoded}`;
}
