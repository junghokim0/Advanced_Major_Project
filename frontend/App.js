import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import LoginScreen from './src/screens/LoginScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import UploadScreen from './src/screens/UploadScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import { AnalysisProvider, useAnalysis } from './src/context/AnalysisContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

const INTRO_SPLASH_MS = 1800;

function AppContent() {
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('upload');
  const [appPhase, setAppPhase] = useState('loading');
  const { resetAnalysisState } = useAnalysis();

  useEffect(() => {
    let active = true;

    const prepare = async () => {
      await new Promise((resolve) => setTimeout(resolve, INTRO_SPLASH_MS));
      if (!active) return;
      setAppPhase('auth');
      await SplashScreen.hideAsync();
    };

    prepare();
    return () => {
      active = false;
    };
  }, []);

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

  if (appPhase === 'loading') {
    return <LoadingScreen />;
  }

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
