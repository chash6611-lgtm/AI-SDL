
import React, { useState } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Spinner } from './common/Spinner.tsx';

interface ApiKeyPromptProps {
    onSetApiKey: (key: string) => void;
    initialKey?: string;
    error?: string | null;
    isLoading: boolean;
}

export const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onSetApiKey, initialKey = '', error, isLoading }) => {
    const [apiKey, setApiKey] = useState(initialKey);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSetApiKey(apiKey);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-purple-violet/10 dark:from-slate-900 dark:to-slate-800 p-3 transition-colors duration-300">
            <Card className="w-full max-w-lg mx-auto shadow-xl">
                <form onSubmit={handleSubmit}>
                    <div className="text-center mb-6">
                         <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neon-blue/10 dark:bg-neon-blue/20 text-neon-blue mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                         </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">시작하기</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-snug text-sm">
                            AI 자기주도 학습 서비스를 이용하려면<br/>Google AI Studio의 API 키가 필요합니다.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label htmlFor="api-key" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                API 키 입력
                            </label>
                            <input
                                id="api-key"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-base text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-neon-blue focus:border-neon-blue transition duration-150 ease-in-out placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                placeholder="AI Studio API 키를 붙여넣으세요"
                                aria-describedby={error ? "api-key-error" : undefined}
                                autoComplete="off"
                            />
                        </div>

                        {error && (
                            <div id="api-key-error" className="flex items-start gap-2 text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-800">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <div className="text-center">
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 text-xs font-medium text-neon-blue hover:text-blue-600 hover:underline p-1"
                            >
                                <span>Google AI Studio에서 키 발급받기</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </a>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <Button type="submit" disabled={isLoading || !apiKey.trim()} className="w-full flex items-center justify-center py-3 text-sm shadow-md">
                            {isLoading ? <Spinner size="sm" /> : '확인 및 시작하기'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
