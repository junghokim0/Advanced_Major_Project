import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAnalysisHistory } from '../api';
import { getCategoryMeta, getCategoryTip } from '../constants/analysisLabels';
import { useAnalysis } from '../context/AnalysisContext';
import { isWeeklyCaptureDue } from '../utils/weeklyCapture';
import NearbyPlacesPlaceholder from '../components/NearbyPlacesPlaceholder';
import { BRAND } from '../theme/brand';

function getPatternLabel(patternType) {
  if (patternType === 'm_line') return 'M자';
  return '정수리';
}

function formatFullDate(dateString) {
  const date = new Date(dateString);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}.${m}.${d}`;
}

export default function HomeScreen({ token, navigation }) {
  const { latestResult } = useAnalysis();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestRecord, setLatestRecord] = useState(null);
  const [recordCount, setRecordCount] = useState(0);
  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAnalysisHistory(token);
      const items = Array.isArray(response.data) ? response.data : [];
      setRecordCount(items.length);
      setLatestRecord(items[0] || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  const latestFromUpload = latestResult?.analysis
    ? {
        category: latestResult.analysis.predictedClass,
        probability: latestResult.analysis.confidence,
        patternType: latestResult.patternType,
        analyzedAt: latestResult.uploadedAt,
        fromSession: true,
      }
    : null;

  const display = latestFromUpload || (latestRecord
    ? {
        category: latestRecord.category,
        probability: latestRecord.probability,
        patternType: latestRecord.patternType,
        analyzedAt: latestRecord.analyzedAt,
        fromSession: false,
      }
    : null);

  const patternForMeta = display?.patternType || 'crown';
  const categoryMeta = display
    ? getCategoryMeta(display.category, patternForMeta)
    : null;
  const categoryTip = display ? getCategoryTip(display.category, patternForMeta) : null;

  const lastAnalyzedAt = display?.analyzedAt || latestRecord?.analyzedAt || null;
  const weeklyCaptureDue = useMemo(() => isWeeklyCaptureDue(lastAnalyzedAt), [lastAnalyzedAt]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>MOJI</Text>
        <Text style={styles.subtitle}>두피 분석 요약</Text>
      </View>

      {!loading && weeklyCaptureDue ? (
        <View style={styles.weeklyBanner}>
          <Text style={styles.weeklyBannerTitle}>이번 주 촬영을 아직 하지 않았어요</Text>
          <Text style={styles.weeklyBannerHint}>
            같은 각도로 사진을 남기면 Before/After 비교가 더 정확해집니다.
          </Text>
          <TouchableOpacity
            style={styles.weeklyBannerButton}
            onPress={() => navigation.navigate('Analysis')}
            activeOpacity={0.85}
          >
            <Text style={styles.weeklyBannerButtonText}>지금 촬영하기</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? <ActivityIndicator style={styles.loader} color={BRAND.medical600} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!loading && !error ? (
        <View style={styles.summaryCard}>
          {display ? (
            <>
              <Text style={styles.cardLabel}>최근 분석</Text>
              <Text style={styles.cardPattern}>
                {getPatternLabel(display.patternType)}
                {display.fromSession ? ' · 방금 분석' : ''}
              </Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreValue}>C{Number(display.category) || '-'}</Text>
                {categoryMeta ? (
                  <View style={[styles.badge, { backgroundColor: categoryMeta.bg }]}>
                    <Text style={[styles.badgeText, { color: categoryMeta.color }]}>
                      {categoryMeta.label}
                    </Text>
                  </View>
                ) : null}
              </View>
              {categoryTip ? (
                <View
                  style={[
                    styles.tipBox,
                    categoryMeta ? { backgroundColor: categoryMeta.bg } : null,
                  ]}
                >
                  <Text style={styles.tipLabel}>이 단계에 도움이 되는 팁</Text>
                  <Text
                    style={[
                      styles.tipText,
                      categoryMeta ? { color: categoryMeta.color } : null,
                    ]}
                  >
                    {categoryTip}
                  </Text>
                </View>
              ) : null}
              {display.analyzedAt ? (
                <Text style={styles.dateText}>{formatFullDate(display.analyzedAt)}</Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.cardLabel}>아직 분석 기록이 없습니다</Text>
              <Text style={styles.emptyHint}>분석 탭에서 사진을 업로드해 보세요.</Text>
            </>
          )}
          <Text style={styles.countText}>전체 기록 {recordCount}건</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Analysis')}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>새 분석 시작</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={() => navigation.navigate('Records')}
        activeOpacity={0.85}
      >
        <Text style={styles.outlineButtonText}>기록 · 차트 보기</Text>
      </TouchableOpacity>

      <NearbyPlacesPlaceholder />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 24,
  },
  weeklyBanner: {
    backgroundColor: BRAND.medical50,
    borderWidth: 1,
    borderColor: BRAND.medical600,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  weeklyBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.medical700,
    marginBottom: 6,
  },
  weeklyBannerHint: {
    fontSize: 13,
    color: BRAND.neutral500,
    lineHeight: 18,
    marginBottom: 12,
  },
  weeklyBannerButton: {
    backgroundColor: BRAND.medical600,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyBannerButtonText: {
    color: BRAND.white,
    fontWeight: '700',
    fontSize: 14,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND.medical700,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: BRAND.neutral500,
  },
  loader: {
    marginVertical: 24,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: BRAND.red500,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.neutral200,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  cardPattern: {
    fontSize: 13,
    color: BRAND.neutral500,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '800',
    color: BRAND.neutral800,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipBox: {
    marginTop: 4,
    marginBottom: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: BRAND.medical50,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.neutral700,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.neutral800,
    fontWeight: '500',
  },
  dateText: {
    marginTop: 6,
    fontSize: 12,
    color: BRAND.neutral500,
  },
  emptyHint: {
    fontSize: 13,
    color: BRAND.neutral500,
    lineHeight: 20,
  },
  countText: {
    marginTop: 16,
    fontSize: 12,
    color: BRAND.neutral500,
  },
  primaryButton: {
    backgroundColor: BRAND.medical600,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: BRAND.white,
    fontWeight: '700',
    fontSize: 15,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: BRAND.medical600,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: BRAND.white,
  },
  outlineButtonText: {
    color: BRAND.medical600,
    fontWeight: '700',
    fontSize: 15,
  },
});
