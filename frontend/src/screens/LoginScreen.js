import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { login, signup } from '../api';
import { BRAND } from '../theme/brand';

const LOGO = require('../../assets/logo.png');

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const trimmedEmail = email.trim();
      if (isSignupMode) {
        await signup(trimmedEmail, password);
        setSuccessMessage('회원가입 완료. 로그인해 주세요.');
        setIsSignupMode(false);
        setPassword('');
      } else {
        const result = await login(trimmedEmail, password);
        onLogin({ token: result.token, email: trimmedEmail });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignupMode((prev) => !prev);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandBlock}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="앱 로고" />
          <Text style={styles.brandTitle}>두피 분석 - MOJI</Text>
          <Text style={styles.brandTagline}>모지 어떤가요, 머리 모, 알 지</Text>
          <Text style={styles.brandSubtitle}>정수리 · M자 패턴 분석</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>{isSignupMode ? '회원가입' : '로그인'}</Text>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor={BRAND.neutral500}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor={BRAND.neutral500}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={BRAND.white} />
            ) : (
              <Text style={styles.buttonText}>{isSignupMode ? '가입하기' : '로그인'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={toggleMode} disabled={loading}>
            <Text style={styles.secondaryButtonText}>
              {isSignupMode ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 회원가입'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND.neutral800,
    marginBottom: 4,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.medical600,
    marginBottom: 4,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    color: BRAND.neutral500,
  },
  formCard: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.neutral200,
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.neutral800,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND.neutral200,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    color: BRAND.neutral800,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: BRAND.medical600,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.85,
  },
  buttonText: {
    color: BRAND.white,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: BRAND.medical600,
    fontWeight: '600',
    fontSize: 14,
  },
  error: {
    color: BRAND.red500,
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 13,
  },
  success: {
    color: '#15803d',
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 13,
  },
});
