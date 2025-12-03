
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getExplanationStream, generateQuestions, generateSpeech, QuestionRequest, getFollowUpAnswerStream, generateIllustration } from '../services/geminiService.ts';
import type { AchievementStandard, QuizQuestion, QuizResult, TTSVoice, QuestionType, ConversationMessage } from '../types.ts';
import useLocalStorage from '../hooks/useLocalStorage.ts';
import { Button } from './common/Button.tsx';
import { Spinner } from './common/Spinner.tsx';
import { Quiz } from './Quiz.tsx';
import { AVAILABLE_VOICES } from '../constants.ts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Helper functions for audio decoding
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
    const frameCount = data.length / 2; // 16-bit PCM
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    const dataInt16 = new Int16Array(data.buffer);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
}


const SpeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
);

const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="6" y="6" width="12" height="12"></rect>
    </svg>
);

interface StudySessionProps {
    subjectName: string;
    standard: AchievementStandard;
    onSessionEnd: () => void;
    onGoHome: () => void;
}

const defaultQuestionCounts = {
    'multiple-choice': 3,
    'short-answer': 1,
    'ox': 1,
};

export const StudySession: React.FC<StudySessionProps> = ({ subjectName, standard, onSessionEnd, onGoHome }) => {
    const [explanation, setExplanation] = useState<string>('');
    const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(true);
    const [isStreamingExplanation, setIsStreamingExplanation] = useState<boolean>(false);
    const explanationRef = useRef<string>('');
    
    const [illustration, setIllustration] = useState<string | null>(null);
    const [isLoadingIllustration, setIsLoadingIllustration] = useState<boolean>(false);
    
    const [questionCounts, setQuestionCounts] = useState<{ [key in QuestionType]: number }>(defaultQuestionCounts);

    const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
    
    const [explanationError, setExplanationError] = useState<string | null>(null);
    const [questionsError, setQuestionsError] = useState<string | null>(null);
    const [ttsError, setTtsError] = useState<string | null>(null);
    
    const [studyHistory, setStudyHistory] = useLocalStorage<QuizResult[]>('studyHistory', []);
    const [quizFinished, setQuizFinished] = useState(false);
    const [lastResult, setLastResult] = useState<QuizResult | null>(null);

    // TTS State
    const [selectedVoice, setSelectedVoice] = useState<TTSVoice>('Kore');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoadingTTS, setIsLoadingTTS] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Q&A State
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [userQuestion, setUserQuestion] = useState<string>('');
    const [isAnswering, setIsAnswering] = useState<boolean>(false);
    const [qnaError, setQnaError] = useState<string | null>(null);
    const conversationEndRef = useRef<HTMLDivElement>(null);
    
    const stopAllAudio = useCallback(() => {
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.onended = null;
                audioSourceRef.current.stop();
            } catch (e) {
                console.warn("Audio stop error:", e);
            }
            audioSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().then(() => {
                audioContextRef.current = null;
            });
        }
        setIsSpeaking(false);
        setIsLoadingTTS(false);
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const fetchExplanation = async () => {
            setIsLoadingExplanation(true);
            setIsStreamingExplanation(true);
            setExplanation('');
            explanationRef.current = '';
            setExplanationError(null);
            try {
                const stream = await getExplanationStream(subjectName, standard.description);
                if (isCancelled) return;
                
                setIsLoadingExplanation(false); 
                let currentText = '';
                for await (const chunk of stream) {
                    if (isCancelled) break;
                    currentText += chunk.text;
                    explanationRef.current = currentText;
                    setExplanation(currentText);
                }
            } catch (err) {
                if (!isCancelled) {
                    setExplanationError(err instanceof Error ? err.message : '설명을 불러오는 데 실패했습니다.');
                    setIsLoadingExplanation(false);
                }
            } finally {
                if (!isCancelled) {
                    setIsStreamingExplanation(false);
                }
            }
        };

        const fetchIllustration = async () => {
            setIsLoadingIllustration(true);
            setIllustration(null);
            try {
                // Use standard description directly for parallel generation
                const imageBase64 = await generateIllustration(standard.description);
                if (!isCancelled) {
                    setIllustration(imageBase64);
                }
            } catch (error) {
                console.error("Illustration generation error:", error);
            } finally {
                if (!isCancelled) {
                    setIsLoadingIllustration(false);
                }
            }
        };

        // Execute in parallel to reduce wait time
        fetchExplanation();
        fetchIllustration();

        return () => {
            isCancelled = true;
            stopAllAudio();
        };
    }, [subjectName, standard.description, stopAllAudio]);
    
    const scrollToBottom = () => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userQuestion.trim() || isAnswering) return;

        const newQuestion: ConversationMessage = { role: 'user', text: userQuestion };
        setIsAnswering(true);
        setQnaError(null);
        setConversation(prev => [...prev, newQuestion, { role: 'model', text: '' }]);
        setUserQuestion('');

        try {
            const stream = await getFollowUpAnswerStream(subjectName, standard.description, explanationRef.current, conversation, newQuestion.text);
            
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setConversation(prev => {
                    const newConversation = [...prev];
                    const lastMessage = newConversation[newConversation.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.text += chunkText;
                    }
                    return newConversation;
                });
            }

        } catch (err) {
            setQnaError(err instanceof Error ? err.message : '질문에 답변하는 중 오류가 발생했습니다.');
             setConversation(prev => prev.slice(0, -2)); // Remove user question and empty model message on error
        } finally {
            setIsAnswering(false);
        }
    };

    const handleToggleSpeak = useCallback(async () => {
        if (isSpeaking || isLoadingTTS) {
            stopAllAudio();
            return;
        }

        if (!explanation) return;
        
        setIsLoadingTTS(true);
        setTtsError(null);

        try {
            const base64Audio = await generateSpeech(explanation, selectedVoice);

            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = audioCtx;
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            const audioBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioBytes, audioCtx);
            
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            audioSourceRef.current = source;
            
            source.onended = () => {
                stopAllAudio();
            };

            source.start();
            setIsLoadingTTS(false);
            setIsSpeaking(true);

        } catch (err) {
            setTtsError(err instanceof Error ? err.message : '음성 재생 중 오류가 발생했습니다.');
            stopAllAudio();
        }
    }, [explanation, selectedVoice, isSpeaking, isLoadingTTS, stopAllAudio]);


    const handleGenerateQuiz = async () => {
        setIsGeneratingQuestions(true);
        setQuestionsError(null);
        try {
            const requests: QuestionRequest[] = Object.entries(questionCounts)
                .map(([type, count]) => ({ type: type as QuestionType, count: count as number }))
                .filter(({ count }) => count > 0);

            if (requests.length === 0) {
                setQuestionsError("하나 이상의 문제를 요청해야 합니다.");
                setIsGeneratingQuestions(false);
                return;
            }

            const generated = await generateQuestions(subjectName, standard.description, requests);
            setQuestions(generated);
        } catch (err) {
            setQuestionsError(err instanceof Error ? err.message : '문제를 생성하는 데 실패했습니다.');
        } finally {
            setIsGeneratingQuestions(false);
        }
    };

    const handleQuestionCountChange = (type: QuestionType, value: string) => {
        const count = Math.max(0, parseInt(value, 10) || 0);
        setQuestionCounts(prev => ({ ...prev, [type]: count }));
    };

    const handleQuizSubmit = useCallback((
        score: number, 
        correctAnswers: number, 
        totalQuestions: number, 
        userAnswers: (string | null)[], 
        correctness: (boolean | null)[]
    ) => {
        const newResult: QuizResult = {
            id: new Date().toISOString(),
            date: new Date().toISOString(),
            standardId: standard.id,
            standardDescription: standard.description,
            subject: subjectName,
            score,
            totalQuestions,
            correctAnswers,
            // Save full details for review
            questions: questions || undefined,
            userAnswers,
            correctness
        };
        setStudyHistory([...studyHistory, newResult]);
        setLastResult(newResult);
        setQuizFinished(true);
    }, [standard, subjectName, studyHistory, setStudyHistory, questions]);
    
    const markdownComponents = {
        table: (props: any) => <div className="overflow-x-auto mb-2"><table className="table-auto w-full border-collapse border border-slate-300 dark:border-slate-600" {...props} /></div>,
        thead: (props: any) => <thead className="bg-slate-100 dark:bg-slate-700" {...props} />,
        th: (props: any) => <th className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-left whitespace-nowrap text-sm" {...props} />,
        td: (props: any) => <td className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm min-w-[100px]" {...props} />,
        p: (props: any) => <p className="my-1 leading-snug" {...props} />,
        h1: (props: any) => <h1 className="text-lg font-bold mt-3 mb-1" {...props} />,
        h2: (props: any) => <h2 className="text-base font-bold mt-2 mb-1" {...props} />,
        h3: (props: any) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
        ul: (props: any) => <ul className="list-disc list-outside pl-4 my-1 space-y-0.5" {...props} />,
        ol: (props: any) => <ol className="list-decimal list-outside pl-4 my-1 space-y-0.5" {...props} />,
        li: (props: any) => <li className="leading-snug" {...props} />,
        // Render math cleanly
        span: ({node, ...props}: any) => {
            if (props.className === 'katex') {
                // Ensure proper display
                return <span {...props} />
            }
            return <span {...props} />
        }
    };

    if (!questions) {
        return (
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-3 sm:p-5 md:p-8 rounded-xl shadow-lg transition-colors duration-300">
                <header>
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-neon-blue">{subjectName}</p>
                            <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5 leading-tight">{standard.description}</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{standard.id}</p>
                        </div>
                    </div>
                    
                     <div className="flex flex-wrap items-center justify-end mt-2 border-b border-slate-200 dark:border-slate-700 pb-2 gap-2">
                        <select
                            id="voice-select"
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value as TTSVoice)}
                            disabled={isSpeaking || isLoadingTTS}
                            className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1.5 px-2 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-neon-blue"
                            aria-label="목소리 선택"
                        >
                            {AVAILABLE_VOICES.map(voice => (
                                <option key={voice.id} value={voice.id}>{voice.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleToggleSpeak}
                            disabled={isLoadingExplanation || isStreamingExplanation}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium disabled:opacity-50 transition-colors"
                            aria-label={(isSpeaking || isLoadingTTS) ? "설명 듣기 중지" : "설명 듣기"}
                        >
                                {isLoadingTTS ? (
                                <Spinner size="sm" />
                                ) : isSpeaking ? (
                                <>
                                    <StopIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">중지</span>
                                </>
                                ) : (
                                <>
                                    <SpeakerIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">듣기</span>
                                </>
                            )}
                        </button>
                    </div>
                     {ttsError && <p className="text-red-500 text-xs mt-1 text-right">{ttsError}</p>}
                </header>

                <article className="py-3 sm:py-4">
                    {isLoadingExplanation ? (
                        <Spinner text="AI 튜터가 설명 자료를 준비하고 있어요..." />
                    ) : explanationError ? (
                            <p className="text-red-500 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm">{explanationError}</p>
                    ) : (
                        <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none overflow-x-hidden leading-snug">
                            <div className="w-full overflow-x-auto">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm, remarkMath]} 
                                    rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                                    components={markdownComponents}
                                >
                                    {explanation + (isStreamingExplanation ? '▍' : '')}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </article>
                
                {isLoadingIllustration && <Spinner text="도움이 될만한 이미지를 생성하고 있어요..." />}
                {illustration && (
                    <div className="mt-2 mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 text-center">🎨 개념 쏙쏙 이미지</p>
                        <img src={`data:image/png;base64,${illustration}`} alt="AI generated illustration" className="rounded-lg shadow-md mx-auto max-w-xs w-full" />
                    </div>
                )}


                {!isLoadingExplanation && !isStreamingExplanation && !explanationError && (
                    <>
                        <hr className="my-2 border-slate-200 dark:border-slate-700" />
                        
                        <section>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">궁금한 점 질문하기</h2>
                            <div className="max-h-20 overflow-y-auto space-y-2 mb-1 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700">
                                {conversation.map((msg, index) => (
                                    <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`prose prose-sm dark:prose-invert max-w-none p-2 rounded-lg ${msg.role === 'user' ? 'bg-neon-blue/10 dark:bg-neon-blue/20 text-slate-800 dark:text-slate-100' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600'}`}>
                                             <div className="overflow-x-auto leading-snug">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm, remarkMath]} 
                                                    rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                                                    components={markdownComponents}
                                                >
                                                    {msg.text + (msg.role === 'model' && isAnswering && index === conversation.length -1 ? '▍' : '')}
                                                </ReactMarkdown>
                                             </div>
                                        </div>
                                    </div>
                                ))}
                                {conversation.length === 0 && (
                                    <p className="text-center text-black dark:text-slate-200 py-0 my-0 text-sm font-bold leading-tight">
                                        이해가 잘 안 되는 내용이 있나요?<br/>AI 선생님에게 자유롭게 물어보세요!
                                    </p>
                                )}
                                <div ref={conversationEndRef} />
                            </div>

                            <form onSubmit={handleAskQuestion}>
                                <textarea
                                    value={userQuestion}
                                    onChange={(e) => setUserQuestion(e.target.value)}
                                    placeholder="여기에 질문을 입력하세요..."
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-neon-blue text-sm leading-snug placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    rows={2}
                                    disabled={isAnswering}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAskQuestion(e);
                                        }
                                    }}
                                />
                                <div className="flex justify-end items-center mt-1.5 gap-2">
                                    <Button type="submit" disabled={!userQuestion.trim() || isAnswering} className="!py-1.5 !px-3 text-xs sm:text-sm">
                                        {isAnswering ? <Spinner size="sm" /> : '질문 전송'}
                                    </Button>
                                </div>
                            </form>
                            {qnaError && <p className="text-red-500 mt-1 text-xs">{qnaError}</p>}
                        </section>
                        
                        <hr className="my-6 border-slate-200 dark:border-slate-700" />

                        <section>
                             <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">이해도 확인하기(문항수 선택 가능)</h2>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <div>
                                    <label htmlFor="mc-questions" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">객관식</label>
                                    <input type="number" id="mc-questions" value={questionCounts['multiple-choice']} onChange={e => handleQuestionCountChange('multiple-choice', e.target.value)} min="0" className="w-full p-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-md text-sm text-center"/>
                                </div>
                                <div>
                                    <label htmlFor="sa-questions" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">서술형</label>
                                    <input type="number" id="sa-questions" value={questionCounts['short-answer']} onChange={e => handleQuestionCountChange('short-answer', e.target.value)} min="0" className="w-full p-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-md text-sm text-center"/>
                                </div>
                                <div>
                                    <label htmlFor="ox-questions" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">OX</label>
                                    <input type="number" id="ox-questions" value={questionCounts['ox']} onChange={e => handleQuestionCountChange('ox', e.target.value)} min="0" className="w-full p-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-md text-sm text-center"/>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <Button 
                                    onClick={handleGenerateQuiz} 
                                    disabled={isGeneratingQuestions || (questionCounts['multiple-choice'] === 0 && questionCounts['short-answer'] === 0 && questionCounts['ox'] === 0)} 
                                    className="w-full !py-3 text-base"
                                >
                                    {isGeneratingQuestions ? <Spinner size="sm" /> : '연습 문제 풀기'}
                                </Button>
                            </div>
                            {questionsError && <p className="text-red-500 mt-2 text-xs text-center">{questionsError}</p>}
                        </section>
                    </>
                )}
            </div>
        );
    }
    
    if (quizFinished && lastResult) {
      return (
        <div className="max-w-2xl mx-auto text-center bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg mt-4 transition-colors duration-300">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-2">학습 완료!</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm break-keep">성취기준 <span className="font-semibold block sm:inline mt-1 sm:mt-0">{lastResult.standardId}</span>에 대한 학습을 마쳤습니다.</p>
            <div className="bg-neon-blue/10 dark:bg-neon-blue/20 rounded-xl p-4 sm:p-6 mb-4">
                <p className="text-base text-slate-700 dark:text-slate-200">총 <span className="font-bold text-neon-blue">{lastResult.totalQuestions}</span>문제 중</p>
                <p className="text-4xl sm:text-5xl font-extrabold text-neon-blue my-2">{lastResult.correctAnswers}</p>
                <p className="text-base text-slate-700 dark:text-slate-200">문제를 맞혔습니다.</p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mt-4 overflow-hidden">
                    <div className="bg-lime-green h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${lastResult.score}%` }}></div>
                </div>
                <p className="text-lg font-bold mt-1 text-slate-800 dark:text-slate-100">{lastResult.score.toFixed(0)}점</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                * 문제는 로컬 저장소에 저장되어 대시보드에서 다시 확인할 수 있습니다.
            </p>
            <Button onClick={onSessionEnd} className="w-full sm:w-auto !py-2.5">완료</Button>
        </div>
      );
    }

    return <Quiz questions={questions} onSubmit={handleQuizSubmit} />;
};
