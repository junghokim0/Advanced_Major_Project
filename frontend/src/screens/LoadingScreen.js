import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { BRAND } from '../theme/brand';

const LOGO = require('../../assets/logo.png');

export default function LoadingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="앱 로고" />
      </Animated.View>
      <Text style={styles.title}>두피 분석 - MOJI</Text>
      <Text style={styles.tagline}>모지 어떤가요, 머리 모, 알 지</Text>
      <Text style={styles.subtitle}>정수리 · M자 패턴 분석</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    marginBottom: 24,
  },
  logo: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND.neutral800,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    color: BRAND.medical600,
    marginBottom: 4,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: BRAND.neutral500,
  },
});
