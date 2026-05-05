import React, { createContext, useContext, useMemo, useState } from 'react';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [uploading, setUploading] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const resetAnalysisState = () => {
    setUploading(false);
    setLatestResult(null);
    setHistoryLoading(false);
    setHistory([]);
  };

  const value = useMemo(
    () => ({
      uploading,
      setUploading,
      latestResult,
      setLatestResult,
      historyLoading,
      setHistoryLoading,
      history,
      setHistory,
      resetAnalysisState,
    }),
    [uploading, latestResult, historyLoading, history]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider');
  }
  return context;
}
