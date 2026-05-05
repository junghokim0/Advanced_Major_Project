import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getAnalysisHistory } from '../api';
import { useAnalysis } from '../context/AnalysisContext';

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>1 Year Progress</Text>
      <Text style={styles.subtitle}>최근 1년 업로드 점수 변화</Text>

      <TouchableOpacity style={styles.smallButton} onPress={onBack}>
        <Text style={styles.smallButtonText}>업로드 화면으로 돌아가기</Text>
      </TouchableOpacity>

      {historyLoading ? <ActivityIndicator style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!historyLoading && !error && !history.length ? (
        <Text style={styles.info}>최근 1년 내 분석 이력이 없습니다.</Text>
      ) : null}

      {!historyLoading && !error && history.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Score Graph (1~100)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={chartData}
              width={Math.max(Dimensions.get('window').width - 60, history.length * 52)}
              height={240}
              yAxisSuffix=""
              yAxisInterval={1}
              fromZero
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '1',
                  stroke: '#1d4ed8',
                },
              }}
              bezier
              style={styles.chart}
            />
          </ScrollView>
        </View>
      ) : null}

      {summary ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>
          <Text>기록 수: {summary.count}</Text>
          <Text>최근 점수: {summary.latest}</Text>
          <Text>평균 점수: {summary.average}</Text>
        </View>
      ) : null}

      {beforeAfter ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Before / After 비교</Text>
          <Text>이전 점수: {beforeAfter.before}</Text>
          <Text>현재 점수: {beforeAfter.after}</Text>
          <Text>
            변화: {beforeAfter.diff > 0 ? '+' : ''}
            {beforeAfter.diff} ({beforeAfter.diff > 0 ? '증가' : beforeAfter.diff < 0 ? '감소' : '변화 없음'})
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 12,
  },
  smallButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  loader: {
    marginTop: 12,
  },
  error: {
    marginTop: 12,
    color: '#b91c1c',
  },
  info: {
    marginTop: 12,
    color: '#6b7280',
  },
  card: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 10,
  },
});
