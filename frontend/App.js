import React, { useCallback, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import LoginScreen from './src/screens/LoginScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import MainNavigator from './src/navigation/MainNavigator';
import { AnalysisProvider, useAnalysis } from './src/context/AnalysisContext';
SplashScreen.preventAutoHideAsync().catch(() => {});

const INTRO_SPLASH_MS = 1800;

function AppContent() {
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [appPhase, setAppPhase] = useState('loading');
  const [pendingCapture, setPendingCapture] = useState(null);
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

  const handleLogin = ({ token: newToken, email }) => {
    setToken(newToken);
    setUserEmail(email);
  };

  const handlePendingCaptureHandled = useCallback(() => {
    setPendingCapture(null);
  }, []);

  const handleLogout = () => {
    setToken(null);
    setUserEmail(null);
    setPendingCapture(null);
    resetAnalysisState();
  };

  if (appPhase === 'loading') {
    return <LoadingScreen />;
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <MainNavigator
      token={token}
      userEmail={userEmail}
      onLogout={handleLogout}
      pendingCapture={pendingCapture}
      onPendingCaptureHandled={handlePendingCaptureHandled}
      onPendingCapture={setPendingCapture}
    />
  );
}

export default function App() {
  return (
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
  );
}
