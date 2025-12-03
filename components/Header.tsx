
import React, { useState } from 'react';
import type { Theme } from '../types.ts';

interface HeaderProps {
    onGoHome: () => void;
    onShowDashboard: () => void;
    onBack: () => void;
    onForward: () => void;
    canGoBack: boolean;
    canGoForward: boolean;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const AiSdlLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" {...props}>
        <rect width="64" height="32" rx="4" className="fill-current" />
        <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="black"
            fontSize="14px"
            fontWeight="bold"
            fontFamily="sans-serif"
        >
            AI-SDL
        </text>
    </svg>
);

const AppInfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-info-title"
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-3">
                    <h2 id="app-info-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">📢 앱 이용 안내</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 -mr-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        aria-label="안내창 닫기"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-snug">
                    <ol className="list-decimal list-outside space-y-2 mb-3 pl-4">
                        <li>이 앱은 중학교 교육과정 성취기준을 제시하고, AI 기반 이해도 점검 기능을 제공하여 학습을 지원하기 위해 제작되었습니다.</li>
                        <li>성취기준을 선택하면 AI가 학습 자료와 문제를 자동으로 생성합니다. 다만 생성형 콘텐츠의 특성상, 교과서나 학교 수업에 비해 내용이 부족할 수 있습니다.</li>
                    </ol>
                    
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg my-3 border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">2025학년도 적용 기준</h4>
                        <ul className="list-disc list-outside pl-4 space-y-0.5">
                            <li><strong>중학교 2‧3학년:</strong> 2015 개정 교육과정 적용</li>
                            <li><strong>중학교 1학년:</strong> 2022 개정 교육과정 적용</li>
                        </ul>
                        
                        <h4 className="font-bold mt-2 mb-1 text-slate-900 dark:text-slate-100">2026학년도 적용 기준</h4>
                         <ul className="list-disc list-outside pl-4 space-y-0.5">
                            <li><strong>중학교 3학년:</strong> 2015 개정 교육과정 적용</li>
                            <li><strong>중학교 1‧2학년:</strong> 2022 개정 교육과정 적용</li>
                        </ul>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100">[성취기준 안내]</h4>
                    <p>성취기준은 교과와 학년군별로 학생이 반드시 익혀야 할 지식, 기능, 태도를 명확히 제시한 국가 교육 기준입니다.</p>
                </div>
                <div className="mt-4 text-right sticky bottom-0 bg-white dark:bg-slate-800 pt-3 border-t dark:border-slate-700 sm:border-0 sm:static sm:pt-0">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

const DashboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 20V10M18 20V4M6 20V16" />
    </svg>
);

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const ThemeIcon: React.FC<{ theme: Theme }> = ({ theme }) => {
    if (theme === 'light') {
        return (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        );
    }
    if (theme === 'dark') {
         return (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
    );
};


export const Header: React.FC<HeaderProps> = ({ onGoHome, onShowDashboard, onBack, onForward, canGoBack, canGoForward, theme, setTheme }) => {
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const cycleTheme = () => {
        if (theme === 'system') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('system');
    };

    return (
        <>
            <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50 transition-colors duration-300">
                <div className="container mx-auto px-3">
                    <div className="flex items-center justify-between h-12 sm:h-14">
                        <div 
                            className="flex items-center gap-1.5 cursor-pointer group overflow-hidden"
                            onClick={onGoHome}
                        >
                            <AiSdlLogo className="h-[24px] w-[48px] sm:h-[32.4px] sm:w-[64.8px] text-yellow-gold group-hover:opacity-90 transition-opacity shrink-0" />
                            <h1 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap tracking-tight sm:text-[18px]">
                                AI 자기주도학습
                            </h1>
                        </div>
                        <nav className="flex items-center gap-1 sm:gap-[10.8px] ml-2 shrink-0">
                            <button
                                onClick={cycleTheme}
                                className="flex items-center gap-[5.4px] px-[7.2px] py-[5.4px] border border-transparent sm:border-slate-200 dark:sm:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200"
                                title={`현재 모드: ${theme === 'system' ? '자동' : theme === 'light' ? '라이트' : '다크'}`}
                            >
                                <ThemeIcon theme={theme} />
                            </button>
                            <button
                                onClick={onShowDashboard}
                                className="flex items-center gap-[5.4px] px-[7.2px] py-[5.4px] border border-transparent sm:border-slate-200 dark:sm:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200"
                                title="나의 성취 수준"
                            >
                                <DashboardIcon className="w-[14.4px] h-[14.4px] sm:w-[14.4px] sm:h-[14.4px]" />
                                <span className="hidden sm:inline text-xs sm:text-[12.6px] font-medium">나의 성취 수준</span>
                            </button>
                            <button
                                onClick={() => setIsInfoModalOpen(true)}
                                className="flex items-center gap-[5.4px] px-[7.2px] py-[5.4px] border border-transparent sm:border-slate-200 dark:sm:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200"
                                title="앱 이용 안내"
                            >
                                <InfoIcon className="w-[14.4px] h-[14.4px] sm:w-[14.4px] sm:h-[14.4px]" />
                                <span className="hidden sm:inline text-xs sm:text-[12.6px] font-medium">앱 이용 안내</span>
                            </button>
                            <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-[10.8px] sm:pl-[10.8px] ml-1 sm:ml-0">
                                <button
                                    onClick={onBack}
                                    disabled={!canGoBack}
                                    className="p-[5.4px] rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    aria-label="뒤로가기"
                                >
                                    <ArrowLeftIcon className="w-[14.4px] h-[14.4px]" />
                                </button>
                                <button
                                    onClick={onForward}
                                    disabled={!canGoForward}
                                    className="p-[5.4px] rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    aria-label="앞으로가기"
                                >
                                    <ArrowRightIcon className="w-[14.4px] h-[14.4px]" />
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>
            {isInfoModalOpen && <AppInfoModal onClose={() => setIsInfoModalOpen(false)} />}
        </>
    );
};
