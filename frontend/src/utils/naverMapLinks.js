import { Linking, Platform } from 'react-native';

const APP_NAME = 'MOJI';

/**
 * 네이버 지도 웹 — 주소·키워드 검색
 * @see https://map.naver.com
 */
export function buildNaverMapSearchWebUrl(query) {
  const q = String(query || '').trim();
  if (!q) return null;
  return `https://map.naver.com/v5/search/${encodeURIComponent(q)}`;
}

/**
 * 네이버 지도 웹 — 좌표 중심 (c=경도,위도,줌,...)
 */
export function buildNaverMapCoordWebUrl(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://map.naver.com/v5/?c=${lng},${lat},16,0,0,0,dh`;
}

/**
 * 네이버 지도 웹 — 검색어 + 지도 중심 좌표 (GPS 주변 병원 검색용).
 * 공식 nmap://search 는 lat/lng 가 없어 웹 URL을 우선 사용합니다.
 */
export function buildNaverMapSearchNearCoordWebUrl(latitude, longitude, query = '병원') {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const q = String(query || '병원').trim();
  if (!q || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://map.naver.com/v5/search/${encodeURIComponent(q)}?c=${lng},${lat},16,0,0,0,dh`;
}

/** 네이버 지도 앱 — 검색 */
export function buildNaverMapSearchAppUrl(query) {
  const q = String(query || '').trim();
  if (!q) return null;
  return `nmap://search?query=${encodeURIComponent(q)}&appname=${encodeURIComponent(APP_NAME)}`;
}

/** 네이버 지도 앱 — 좌표 */
export function buildNaverMapCoordAppUrl(latitude, longitude, label = '현재 위치') {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `nmap://map?lat=${lat}&lng=${lng}&appname=${encodeURIComponent(APP_NAME)}&title=${encodeURIComponent(label)}`;
}

/**
 * 앱 스킴 우선, 실패 시 웹 URL로 네이버 지도 열기
 */
export async function openNaverMap({ appUrl, webUrl, preferWeb = false }) {
  if (!webUrl && !appUrl) {
    throw new Error('지도 URL을 만들 수 없습니다.');
  }

  if (preferWeb && webUrl) {
    await Linking.openURL(webUrl);
    return { opened: 'web' };
  }

  if (appUrl && Platform.OS !== 'web') {
    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
        return { opened: 'app' };
      }
    } catch {
      // fall through to web
    }
  }

  if (webUrl) {
    await Linking.openURL(webUrl);
    return { opened: 'web' };
  }

  throw new Error('네이버 지도를 열 수 없습니다. 브라우저 또는 네이버 지도 앱을 확인해 주세요.');
}

export async function openNaverMapSearch(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    throw new Error('검색어를 입력해 주세요.');
  }
  return openNaverMap({
    appUrl: buildNaverMapSearchAppUrl(trimmed),
    webUrl: buildNaverMapSearchWebUrl(trimmed),
  });
}

const DEFAULT_GPS_NEARBY_QUERY = '병원';

/**
 * GPS 좌표 → 네이버 지도에서 해당 위치 중심 + 병원(등) 검색 결과.
 * @param {object} [options]
 * @param {string} [options.nearbyQuery='병원'] — 주변 검색 키워드
 * @param {boolean} [options.mapOnly=false] — true면 좌표만(검색 없음)
 */
export async function openNaverMapFromGps(latitude, longitude, options = {}) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('유효한 좌표가 아닙니다.');
  }

  const { nearbyQuery = DEFAULT_GPS_NEARBY_QUERY, mapOnly = false } = options;
  const searchTerm = String(nearbyQuery || '').trim();

  if (!mapOnly && searchTerm) {
    const webUrl = buildNaverMapSearchNearCoordWebUrl(lat, lng, searchTerm);
    return openNaverMap({
      appUrl: buildNaverMapSearchAppUrl(searchTerm),
      webUrl,
      preferWeb: true,
    });
  }

  return openNaverMap({
    appUrl: buildNaverMapCoordAppUrl(lat, lng, '현재 위치'),
    webUrl: buildNaverMapCoordWebUrl(lat, lng),
  });
}

/**
 * 주소 문자열 → 검색 (기본: 입력 주소 + 키워드, 예: 「테헤란로 152 병원」)
 */
export async function openNaverMapFromAddress(address, keyword = '병원') {
  const base = String(address || '').trim();
  if (!base) {
    throw new Error('주소를 입력해 주세요.');
  }
  const extra = String(keyword || '').trim();
  const query = extra ? `${base} ${extra}` : base;
  return openNaverMapSearch(query);
}

export function formatCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
