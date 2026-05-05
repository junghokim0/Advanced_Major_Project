import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { login, signup } from '../api';

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
    <View style={styles.container}>
      <Text style={styles.title}>{isSignupMode ? 'Sign Up' : 'Login'}</Text>
      <TextInput
        style={styles.input}
        placeholder="ID"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isSignupMode ? 'Sign Up' : 'Log In'}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={toggleMode} disabled={loading}>
        <Text style={styles.secondaryButtonText}>
          {isSignupMode ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 회원가입'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  error: {
    color: '#b91c1c',
    marginBottom: 12,
  },
  success: {
    color: '#15803d',
    marginBottom: 12,
  },
});
