import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import UploadScreen from './src/screens/UploadScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import { AnalysisProvider, useAnalysis } from './src/context/AnalysisContext';

function AppContent() {
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('upload');
  const { resetAnalysisState } = useAnalysis();

  const handleLogin = ({ token, email }) => {
    setToken(token);
    setUserEmail(email);
    setCurrentScreen('upload');
  };

  const handleLogout = () => {
    setToken(null);
    setUserEmail(null);
    setCurrentScreen('upload');
    resetAnalysisState();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {token ? (
          currentScreen === 'upload' ? (
            <UploadScreen
              token={token}
              userEmail={userEmail}
              onLogout={handleLogout}
              onOpenProgress={() => setCurrentScreen('progress')}
            />
          ) : (
            <ProgressScreen token={token} onBack={() => setCurrentScreen('upload')} />
          )
        ) : (
          <LoginScreen onLogin={handleLogin} />
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
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
