import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import LoginScreen from './src/screens/LoginScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import UploadScreen from './src/screens/UploadScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import CameraCaptureScreen from './src/screens/CameraCaptureScreen';
import { AnalysisProvider, useAnalysis } from './src/context/AnalysisContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

const INTRO_SPLASH_MS = 1800;

function AppContent() {
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('upload');
  const [appPhase, setAppPhase] = useState('loading');
  const [pendingCapture, setPendingCapture] = useState(null);
  const [cameraPatternType, setCameraPatternType] = useState('m_line');
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

  const handlePendingCaptureHandled = useCallback(() => {
    setPendingCapture(null);
  }, []);

  const handleLogout = () => {
    setToken(null);
    setUserEmail(null);
    setCurrentScreen('upload');
    setPendingCapture(null);
    resetAnalysisState();
  };

  if (appPhase === 'loading') {
    return <LoadingScreen />;
  }

  if (token && currentScreen === 'camera') {
    return (
      <CameraCaptureScreen
        patternType={cameraPatternType}
        onCapture={(asset) => {
          setPendingCapture(asset);
          setCurrentScreen('upload');
        }}
        onCancel={() => setCurrentScreen('upload')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={currentScreen === 'upload' ? styles.inner : styles.innerFull}>
        {token ? (
          currentScreen === 'upload' ? (
            <UploadScreen
              token={token}
              userEmail={userEmail}
              pendingCapture={pendingCapture}
              onPendingCaptureHandled={handlePendingCaptureHandled}
              onOpenCustomCamera={(patternType) => {
                setCameraPatternType(patternType || 'm_line');
                setCurrentScreen('camera');
              }}
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
  innerFull: {
    flex: 1,
    padding: 16,
  },
});
