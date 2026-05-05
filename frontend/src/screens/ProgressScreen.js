import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle } from 'react-native-svg';
import { getAnalysisHistory } from '../api';
import { useAnalysis } from '../context/AnalysisContext';

const COLORS = {
  medical600: '#0d9488',
  medical700: '#0f766e',
  medical50: '#f0fdfa',
  amber500: '#f59e0b',
  amber50: '#fffbeb',
  red500: '#ef4444',
  red50: '#fef2f2',
  neutral50: '#fafafa',
  neutral100: '#f3f4f6',
  neutral200: '#e5e7eb',
  neutral400: '#9ca3af',
  neutral500: '#6b7280',
  neutral700: '#374151',
  neutral800: '#1f2937',
  white: '#ffffff',
};
const RADIUS = { card: 12, button: 12 };

function getCategory(score) {
  const value = Number(score) || 0;
  if (value >= 80) return { label: 'Good', color: COLORS.medical600, bg: COLORS.medical50 };
  if (value >= 60) return { label: 'Average', color: COLORS.amber500, bg: COLORS.amber50 };
  return { label: 'Needs Care', color: COLORS.red500, bg: COLORS.red50 };
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatFullDate(dateString) {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

const RING_SIZE = 140;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({ score }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const offset = RING_CIRCUMFERENCE * (1 - value / 100);
  const center = RING_SIZE / 2;
  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          stroke={COLORS.neutral200}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          stroke={COLORS.medical600}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${RING_CIRCUMFERENCE}, ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={offset}
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringScore}>{value}</Text>
        <Text style={styles.ringScoreSuffix}>/100</Text>
      </View>
    </View>
  );
}

function CategoryBadge({ score }) {
  const cat = getCategory(score);
  return (
    <View style={[styles.badge, { backgroundColor: cat.bg }]}>
      <Text style={[styles.badgeText, { color: cat.color }]}>{cat.label}</Text>
    </View>
  );
}

export default function ProgressScreen({ token, onBack }) {
  const [error, setError] = useState(null);
  const { historyLoading, setHistoryLoading, history, setHistory } = useAnalysis();

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setError(null);
    try {
      const response = await getAnalysisHistory(token);
      const items = Array.isArray(response.data) ? response.data : [];
      setHistory(items.slice(0, 12));
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [token, setHistoryLoading, setHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const summary = useMemo(() => {
    if (!history.length) return null;
    const scores = history.map((item) => Number(item.score) || 0);
    const avg = Math.round(scores.reduce((acc, cur) => acc + cur, 0) / scores.length);
    return {
      count: history.length,
      latest: scores[0],
      average: avg,
    };
  }, [history]);

  const chartData = useMemo(() => {
    const labels = history.map((item) => formatDate(item.analyzedAt));
    const scores = history.map((item) => Number(item.score) || 0);
    return { labels, datasets: [{ data: scores }] };
  }, [history]);

  const beforeAfter = useMemo(() => {
    if (history.length < 2) return null;
    const before = Number(history[1].score) || 0;
    const after = Number(history[0].score) || 0;
    const diff = after - before;
    return { before, after, diff };
  }, [history]);

  const latest = history[0] || null;
  const recentList = history.slice(0, 6);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>분석 결과</Text>
          <Text style={styles.subtitle}>최근 1년 변화</Text>
        </View>
        <TouchableOpacity style={styles.retryButton} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.retryButtonText}>다시 분석하기</Text>
        </TouchableOpacity>
      </View>

      {historyLoading ? <ActivityIndicator style={styles.loader} color={COLORS.medical600} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!historyLoading && !error && !history.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>최근 1년 내 분석 이력이 없습니다</Text>
          <Text style={styles.emptyHint}>업로드 화면에서 사진을 분석해 보세요</Text>
        </View>
      ) : null}

      {latest ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>최신 분석 결과</Text>
          <View style={styles.latestRow}>
            <View style={styles.latestInfo}>
              <Text style={styles.latestScore}>{Number(latest.score) || 0}</Text>
              <Text style={styles.latestScoreLabel}>점수</Text>
              <View style={{ marginTop: 8 }}>
                <CategoryBadge score={latest.score} />
              </View>
              <Text style={styles.latestDate}>{formatFullDate(latest.analyzedAt)}</Text>
            </View>
            <ScoreRing score={latest.score} />
          </View>
        </View>
      ) : null}

      {beforeAfter ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Before / After 비교</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareBox}>
              <Text style={styles.compareLabel}>이전</Text>
              <Text style={styles.compareScore}>{beforeAfter.before}</Text>
              <CategoryBadge score={beforeAfter.before} />
            </View>
            <Text style={styles.compareArrow}>→</Text>
            <View style={styles.compareBox}>
              <Text style={styles.compareLabel}>최신</Text>
              <Text style={styles.compareScore}>{beforeAfter.after}</Text>
              <CategoryBadge score={beforeAfter.after} />
            </View>
          </View>
          <Text
            style={[
              styles.compareDiff,
              {
                color:
                  beforeAfter.diff > 0
                    ? COLORS.medical600
                    : beforeAfter.diff < 0
                    ? COLORS.red500
                    : COLORS.neutral500,
              },
            ]}
          >
            {beforeAfter.diff > 0 ? '+' : ''}
            {beforeAfter.diff}
            {beforeAfter.diff > 0 ? ' 증가' : beforeAfter.diff < 0 ? ' 감소' : ' 변화 없음'}
          </Text>
        </View>
      ) : null}

      {!historyLoading && !error && history.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>12개월 추이 (1~100)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={chartData}
              width={Math.max(Dimensions.get('window').width - 60, history.length * 52)}
              height={240}
              yAxisSuffix=""
              yAxisInterval={1}
              fromZero
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: COLORS.medical700,
                },
              }}
              bezier
              style={styles.chart}
            />
          </ScrollView>
        </View>
      ) : null}

      {recentList.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>최근 분석 이력</Text>
          {recentList.map((item, index) => (
            <View
              key={item.id ?? `${item.analyzedAt}-${index}`}
              style={[styles.historyRow, index === recentList.length - 1 && styles.historyRowLast]}
            >
              <Text style={styles.historyDate}>{formatFullDate(item.analyzedAt)}</Text>
              <View style={styles.historyRight}>
                <Text style={styles.historyScore}>{Number(item.score) || 0}</Text>
                <CategoryBadge score={item.score} />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {summary ? (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.count}</Text>
            <Text style={styles.statLabel}>기록 수</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.latest}</Text>
            <Text style={styles.statLabel}>최근 점수</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.average}</Text>
            <Text style={styles.statLabel}>평균 점수</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.neutral50,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextWrap: {
    flexShrink: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.neutral800,
  },
  subtitle: {
    color: COLORS.neutral500,
    marginTop: 2,
    fontSize: 13,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: COLORS.medical600,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.button,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: COLORS.medical600,
    fontWeight: '700',
    fontSize: 13,
  },
  loader: {
    marginTop: 16,
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: COLORS.red50,
    borderRadius: RADIUS.card,
    padding: 12,
  },
  errorText: {
    color: COLORS.red500,
    fontWeight: '600',
  },
  emptyCard: {
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    borderRadius: RADIUS.card,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.neutral800,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyHint: {
    color: COLORS.neutral500,
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '700',
    color: COLORS.neutral800,
    marginBottom: 12,
    fontSize: 15,
  },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  latestInfo: {
    flexShrink: 1,
    paddingRight: 12,
  },
  latestScore: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.neutral800,
    lineHeight: 48,
  },
  latestScoreLabel: {
    color: COLORS.neutral500,
    fontSize: 12,
    marginTop: 2,
  },
  latestDate: {
    marginTop: 10,
    color: COLORS.neutral500,
    fontSize: 12,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.medical700,
    lineHeight: 36,
  },
  ringScoreSuffix: {
    color: COLORS.neutral500,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  compareBox: {
    flex: 1,
    backgroundColor: COLORS.neutral50,
    borderRadius: RADIUS.card,
    padding: 12,
    alignItems: 'center',
  },
  compareLabel: {
    color: COLORS.neutral500,
    fontSize: 12,
    marginBottom: 4,
  },
  compareScore: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.neutral800,
    marginBottom: 6,
  },
  compareArrow: {
    paddingHorizontal: 10,
    color: COLORS.neutral400,
    fontSize: 22,
    fontWeight: '700',
  },
  compareDiff: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  chart: {
    borderRadius: RADIUS.card,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral200,
  },
  historyRowLast: {
    borderBottomWidth: 0,
  },
  historyDate: {
    color: COLORS.neutral700,
    fontSize: 13,
    fontWeight: '600',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyScore: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.neutral800,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    borderRadius: RADIUS.card,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.medical700,
  },
  statLabel: {
    color: COLORS.neutral500,
    fontSize: 12,
    marginTop: 2,
  },
});
