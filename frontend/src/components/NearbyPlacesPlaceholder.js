import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { BRAND } from '../theme/brand';
import {
  formatCoordinates,
  openNaverMapFromAddress,
  openNaverMapFromGps,
} from '../utils/naverMapLinks';

const METHOD_ROWS = [
  { key: 'gps', way: '현재 위치 (GPS)', action: '좌표 + 「병원」 검색을 네이버 지도에 연동' },
  { key: 'addr', way: '주소 입력', action: '입력 주소 + 「병원」 검색' },
];

/**
 * 병원·약국 — GPS 좌표 링크 + 주소 검색 링크 (네이버 지도 앱/웹, API 키 없음).
 */
export default function NearbyPlacesPlaceholder() {
  const [address, setAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [lastCoords, setLastCoords] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const showError = useCallback((title, message) => {
    Alert.alert(title, message);
  }, []);

  const fetchCoords = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('설정에서 위치 접근을 허용해 주세요.');
    }
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = position.coords;
    setLastCoords({ latitude, longitude });
    return { latitude, longitude };
  }, []);

  const handleOpenGps = useCallback(async () => {
    setGpsLoading(true);
    setStatusMessage(null);
    try {
      const { latitude, longitude } = await fetchCoords();
      const result = await openNaverMapFromGps(latitude, longitude, { nearbyQuery: '병원' });
      const coordText = formatCoordinates(latitude, longitude);
      setStatusMessage(
        `${coordText} — 「병원」 검색 · 네이버 지도(${result.opened === 'app' ? '앱' : '웹'})`
      );
    } catch (err) {
      showError('위치·지도 열기 실패', err.message || '다시 시도해 주세요.');
    } finally {
      setGpsLoading(false);
    }
  }, [fetchCoords, showError]);

  const handleOpenAddress = useCallback(async () => {
    const trimmed = address.trim();
    if (!trimmed) {
      showError('주소 입력', '동·도로명·건물명 등을 입력한 뒤 검색해 주세요.');
      return;
    }

    setAddressLoading(true);
    setStatusMessage(null);
    try {
      const result = await openNaverMapFromAddress(trimmed, '병원');
      const query = `${trimmed} 병원`;
      setStatusMessage(
        `「${query}」 — 네이버 지도(${result.opened === 'app' ? '앱' : '웹'})에서 결과를 확인하세요.`
      );
    } catch (err) {
      showError('지도를 열 수 없습니다', err.message || '다시 시도해 주세요.');
    } finally {
      setAddressLoading(false);
    }
  }, [address, showError]);

  return (
    <View style={styles.card}>
      <Text style={styles.badge}>네이버 지도 연동</Text>
      <Text style={styles.title}>주변 병원 · 약국</Text>

      <View style={styles.methodTable}>
        <View style={styles.methodHeaderRow}>
          <Text style={[styles.methodCell, styles.methodCellHead, styles.methodColWay]}>방식</Text>
          <Text style={[styles.methodCell, styles.methodCellHead, styles.methodColAction]}>
            동작
          </Text>
        </View>
        {METHOD_ROWS.map((row) => (
          <View key={row.key} style={styles.methodDataRow}>
            <Text style={[styles.methodCell, styles.methodColWay]}>{row.way}</Text>
            <Text style={[styles.methodCell, styles.methodColAction, styles.methodActionText]}>
              {row.action}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>① 현재 위치 (GPS)</Text>

        {lastCoords ? (
          <View style={styles.coordBox}>
            <Text style={styles.coordValue}>
              {formatCoordinates(lastCoords.latitude, lastCoords.longitude)}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, gpsLoading && styles.buttonDisabled]}
          onPress={handleOpenGps}
          disabled={gpsLoading}
          activeOpacity={0.85}
        >
          {gpsLoading ? (
            <ActivityIndicator color={BRAND.white} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>현재 위치 주변 병원 검색</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sectionDivider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>② 주소로 검색</Text>

        <TextInput
          style={styles.input}
          placeholder="예: 서울 강남구 테헤란로 152"
          placeholderTextColor={BRAND.neutral400}
          value={address}
          onChangeText={setAddress}
          editable={!addressLoading}
          returnKeyType="search"
          onSubmitEditing={handleOpenAddress}
        />

        <TouchableOpacity
          style={[styles.primaryButton, addressLoading && styles.buttonDisabled]}
          onPress={handleOpenAddress}
          disabled={addressLoading}
          activeOpacity={0.85}
        >
          {addressLoading ? (
            <ActivityIndicator color={BRAND.white} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>입력 주소로 네이버 지도 검색</Text>
          )}
        </TouchableOpacity>
      </View>

      {statusMessage ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.neutral200,
    borderRadius: 12,
    padding: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.medical700,
    backgroundColor: BRAND.medical50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: BRAND.neutral800,
    marginBottom: 14,
  },
  methodTable: {
    borderWidth: 1,
    borderColor: BRAND.neutral200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  methodHeaderRow: {
    flexDirection: 'row',
    backgroundColor: BRAND.medical50,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.neutral200,
  },
  methodDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.neutral200,
  },
  methodCell: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    color: BRAND.neutral800,
  },
  methodCellHead: {
    fontWeight: '800',
    color: BRAND.medical700,
  },
  methodColWay: {
    width: '34%',
    borderRightWidth: 1,
    borderRightColor: BRAND.neutral200,
  },
  methodColAction: {
    flex: 1,
  },
  methodActionText: {
    color: BRAND.neutral500,
    lineHeight: 17,
  },
  section: {
    marginBottom: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: BRAND.neutral200,
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.neutral800,
    marginBottom: 10,
  },
  coordBox: {
    backgroundColor: BRAND.neutral50,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  coordValue: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.neutral800,
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND.neutral200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: BRAND.neutral800,
    backgroundColor: BRAND.white,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: BRAND.medical600,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: BRAND.white,
    fontWeight: '700',
    fontSize: 14,
  },
  statusBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: BRAND.medical50,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  statusText: {
    fontSize: 12,
    color: BRAND.medical700,
    lineHeight: 17,
  },
});
