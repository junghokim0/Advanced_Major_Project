import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import UploadScreen from './src/screens/UploadScreen';

export default function App() {
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const handleLogin = ({ token, email }) => {
    setToken(token);
    setUserEmail(email);
  };

  const handleLogout = () => {
    setToken(null);
    setUserEmail(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {token ? (
          <UploadScreen token={token} userEmail={userEmail} onLogout={handleLogout} />
        ) : (
          <LoginScreen onLogin={handleLogin} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    padding: 16,
  },
});
