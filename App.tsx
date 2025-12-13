
import React, { useState, useCallback, useEffect } from 'react';
import { CurriculumSelector } from './components/CurriculumSelector.tsx';
import { StudySession } from './components/StudySession.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Header } from './components/Header.tsx';
import useLocalStorage from './hooks/useLocalStorage.ts';
import { useTheme } from './hooks/useTheme.ts';
import type { AchievementStandard, View, HistoryState } from './types.ts';
import { EDUCATION_CURRICULUMS } from './constants.ts';
import { initializeAi, validateApiKey } from './services/geminiService.ts';

export type AppStatus = 'prompt_for_key' | 'validating_key' | 'key_valid' | 'key_invalid';

const App: React.FC = () => {
    const [history, setHistory] = useState<HistoryState[]>([{ view: 'selector', standard: null }]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const { theme, setTheme } = useTheme();
    const [isCoolMode, setIsCoolMode] = useState(false);

    const currentHistoryEntry = history[historyIndex];
    const currentView = currentHistoryEntry.view;
    const selectedStandard = currentHistoryEntry.standard;

    const [dashboardKey, setDashboardKey] = useState(Date.now());
    
    const [apiKey, setApiKey] = useLocalStorage<string>('gemini_api_key', '');
    const [appStatus, setAppStatus] = useState<AppStatus>('prompt_for_key');
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);

    const handleApiKeySubmission = useCallback(async (newKey: string) => {
        setApiKey(newKey);
        setAppStatus('validating_key');
        setApiKeyError(null);
        try {
            await validateApiKey(newKey);
            initializeAi(newKey);
            setAppStatus('key_valid');
        } catch (error) {
            setApiKeyError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
            setAppStatus('key_invalid');
        }
    }, [setApiKey]);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed: ', error);
                    });
            });
        }
        
        if (apiKey) {
            handleApiKeySubmission(apiKey);
        } else {
            setAppStatus('prompt_for_key');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const navigate = useCallback((view: View, standard: { subjectName: string, standard: AchievementStandard } | null = null) => {
        const newHistory = history.slice(0, historyIndex + 1);
        const newEntry: HistoryState = { view, standard };

        const lastEntry = newHistory[newHistory.length - 1];
        if (lastEntry.view === newEntry.view && JSON.stringify(lastEntry.standard) === JSON.stringify(newEntry.standard)) {
            return;
        }

        newHistory.push(newEntry);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const handleStartStudy = useCallback((subjectName: string, standard: AchievementStandard) => {
        if (appStatus !== 'key_valid') {
            alert("학습을 시작하려면 유효한 API 키가 필요합니다.");
            return;
        }
        navigate('study', { subjectName, standard });
    }, [navigate, appStatus]);

    const handleGoHome = useCallback(() => {
        navigate('selector');
    }, [navigate]);

    const handleShowDashboard = useCallback(() => {
        setDashboardKey(Date.now());
        navigate('dashboard');
    }, [navigate]);
    
    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;

    const handleBack = useCallback(() => {
        if (canGoBack) {
            setHistoryIndex(prev => prev - 1);
        }
    }, [canGoBack]);

    const handleForward = useCallback(() => {
        if (canGoForward) {
            setHistoryIndex(prev => prev + 1);
        }
    }, [canGoForward]);

    const handleToggleCoolMode = useCallback(() => {
        setIsCoolMode(prev => !prev);
    }, []);

    const renderContent = () => {
        switch (currentView) {
            case 'study':
                if (selectedStandard) {
                    return <StudySession subjectName={selectedStandard.subjectName} standard={selectedStandard.standard} onSessionEnd={handleShowDashboard} onGoHome={handleGoHome} />;
                }
                return (
                    <CurriculumSelector 
                        educationCurriculums={EDUCATION_CURRICULUMS} 
                        onStartStudy={handleStartStudy}
                        apiKey={apiKey}
                        onApiKeySubmit={handleApiKeySubmission}
                        apiStatus={appStatus}
                        apiError={apiKeyError}
                        isCoolMode={isCoolMode}
                    />
                );
            case 'dashboard':
                return <Dashboard key={dashboardKey} onGoHome={handleGoHome} />;
            case 'selector':
            default:
                return (
                    <CurriculumSelector 
                        educationCurriculums={EDUCATION_CURRICULUMS} 
                        onStartStudy={handleStartStudy}
                        apiKey={apiKey}
                        onApiKeySubmit={handleApiKeySubmission}
                        apiStatus={appStatus}
                        apiError={apiKeyError}
                        isCoolMode={isCoolMode}
                    />
                );
        }
    };
    
    return (
        <div className={`min-h-screen bg-gradient-to-br transition-colors duration-500 ease-in-out ${
            isCoolMode 
            ? 'from-sky-50 via-blue-50 to-cyan-100 dark:from-slate-900 dark:to-cyan-950' 
            : 'from-gray-50 to-purple-violet/10 dark:from-slate-900 dark:to-slate-800'
        }`}>
            <Header
              onGoHome={handleGoHome}
              onShowDashboard={handleShowDashboard}
              onBack={handleBack}
              onForward={handleForward}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              theme={theme}
              setTheme={setTheme}
              onToggleCoolMode={handleToggleCoolMode}
              isCoolMode={isCoolMode}
            />
            <main className="container mx-auto p-2 md:p-6">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
