import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MedicalDisclaimerCard from '../components/MedicalDisclaimerCard';
import { isApiUsingHttps, getApiBaseUrl } from '../api';
import { PRIVACY_SECURITY_HINT } from '../constants/medicalDisclaimer';
import { BRAND } from '../theme/brand';

const LOGO = require('../../assets/logo.png');

export default function ProfileScreen({ userEmail, onLogout }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>설정</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>계정</Text>
        <Text style={styles.email}>{userEmail || '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>앱 정보</Text>
        <Text style={styles.infoRow}>MOJI · 두피 분석</Text>
        <Text style={styles.infoHint}>정수리(3단계) · M자(2단계) 패턴 지원</Text>
      </View>

      <MedicalDisclaimerCard variant="full" />

      <View style={styles.card}>
        <Text style={styles.cardLabel}>보안 · 전송</Text>
        <Text style={styles.infoRow}>
          API 연결: {isApiUsingHttps() ? 'HTTPS (권장)' : 'HTTP (개발용)'}
        </Text>
        <Text style={styles.infoHint}>{getApiBaseUrl()}</Text>
        <Text style={[styles.infoHint, { marginTop: 8 }]}>{PRIVACY_SECURITY_HINT}</Text>
        <Text style={[styles.infoHint, { marginTop: 6 }]}>
          서버는 jpg, jpeg, png·용량·파일 시그니처를 검사합니다. 비밀번호는 bcrypt로 저장됩니다.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
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
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: BRAND.neutral800,
  },
  card: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.neutral200,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.neutral500,
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.neutral800,
  },
  infoRow: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.neutral800,
    marginBottom: 4,
  },
  infoHint: {
    fontSize: 13,
    color: BRAND.neutral500,
    lineHeight: 18,
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: BRAND.red500,
    fontWeight: '700',
    fontSize: 15,
  },
});
