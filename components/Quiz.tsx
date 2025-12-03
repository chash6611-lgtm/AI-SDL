
import React, { useState, useEffect } from 'react';
import type { QuizQuestion } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface QuizProps {
    questions: QuizQuestion[];
    onSubmit: (
        score: number, 
        correctAnswers: number, 
        totalQuestions: number,
        userAnswers: (string | null)[],
        correctness: (boolean | null)[]
    ) => void;
}

// Helper to compare answers robustly (handles trailing dots, whitespace)
const isAnswerMatch = (option: string | null, answer: string) => {
    if (!option) return false;
    if (option === answer) return true;
    
    // Normalize: trim and remove trailing punctuation like '.' or ','
    const normOption = option.trim().replace(/[.,]$/, '');
    const normAnswer = answer.trim().replace(/[.,]$/, '');
    
    return normOption === normAnswer;
};

export const Quiz: React.FC<QuizProps> = ({ questions, onSubmit }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
    
    // Manage checked state for EACH question individually
    const [checkedStates, setCheckedStates] = useState<boolean[]>(Array(questions.length).fill(false));
    
    const [showResults, setShowResults] = useState(false);
    const [tempShortAnswer, setTempShortAnswer] = useState('');
    const [selfAssessedCorrectness, setSelfAssessedCorrectness] = useState<(boolean | null)[]>(Array(questions.length).fill(null));

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentQuestionIndex]);
    
    // Sync tempShortAnswer with saved user answer when navigating
    useEffect(() => {
        const savedAnswer = userAnswers[currentQuestionIndex];
        const isChecked = checkedStates[currentQuestionIndex];
        const currentQType = questions[currentQuestionIndex].questionType;
        
        if (currentQType !== 'multiple-choice' && currentQType !== 'ox') {
             setTempShortAnswer(savedAnswer || '');
        } else {
             setTempShortAnswer('');
        }
    }, [currentQuestionIndex, userAnswers, checkedStates, questions]);

    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];
    const isAnswerChecked = checkedStates[currentQuestionIndex];

    const handleAnswerSelect = (option: string) => {
        if (isAnswerChecked) return;
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = option;
        setUserAnswers(newAnswers);
    };
    
    const handleShortAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isAnswerChecked) return;
        setTempShortAnswer(e.target.value);
    };

    const handleCheckAnswer = () => {
        // If it's short-answer (or treated as such), save the temp answer to main state
        const type = currentQuestion.questionType;
        const isMcOrOx = type === 'multiple-choice' || type === 'ox';
        
        if (!isMcOrOx) {
            const newAnswers = [...userAnswers];
            newAnswers[currentQuestionIndex] = tempShortAnswer;
            setUserAnswers(newAnswers);
        }
        
        const newCheckedStates = [...checkedStates];
        newCheckedStates[currentQuestionIndex] = true;
        setCheckedStates(newCheckedStates);
    };

    const handleSelfAssessment = (isCorrect: boolean) => {
        const newAssessment = [...selfAssessedCorrectness];
        newAssessment[currentQuestionIndex] = isCorrect;
        setSelfAssessedCorrectness(newAssessment);
    };
    
    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Calculate final results
            const calculatedCorrectness = questions.map((question, index) => {
                 const type = question.questionType;
                 const isMcOrOx = type === 'multiple-choice' || type === 'ox';
                 const ans = userAnswers[index];
                 
                 if (!isMcOrOx) {
                     return selfAssessedCorrectness[index] === true;
                 } else {
                     return isAnswerMatch(ans, question.answer);
                 }
            });

            const correctCount = calculatedCorrectness.filter(c => c === true).length;
            const scorePercentage = (correctCount / questions.length) * 100;
            
            setShowResults(true);
            onSubmit(scorePercentage, correctCount, questions.length, userAnswers, calculatedCorrectness);
        }
    };

    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const getOptionClasses = (option: string) => {
        let baseClasses = 'w-full text-left p-3 border rounded-lg transition-all duration-200 select-none text-sm leading-snug';

        if (!isAnswerChecked) {
            if (userAnswer === option) {
                return `${baseClasses} bg-neon-blue/20 border-neon-blue ring-2 ring-neon-blue cursor-pointer font-medium dark:text-slate-100`;
            }
            return `${baseClasses} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-100 dark:active:bg-slate-500 cursor-pointer dark:text-slate-200`;
        }

        const isCorrectAnswer = isAnswerMatch(option, currentQuestion.answer);
        const isSelectedAnswer = option === userAnswer;

        if (isCorrectAnswer) {
            return `${baseClasses} bg-lime-green/20 border-lime-green ring-2 ring-lime-green cursor-default dark:text-slate-100`;
        }
        if (isSelectedAnswer) {
            return `${baseClasses} bg-red-100 dark:bg-red-900/30 border-red-500 ring-2 ring-red-500 cursor-default dark:text-slate-100`;
        }
        return `${baseClasses} bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-default opacity-60`;
    };
    
    if (showResults) {
      return null;
    }
    
    const markdownComponents = {
        table: (props: any) => <div className="overflow-x-auto mb-2"><table className="table-auto w-full border-collapse border border-slate-300 dark:border-slate-600" {...props} /></div>,
        thead: (props: any) => <thead className="bg-slate-100 dark:bg-slate-700" {...props} />,
        th: (props: any) => <th className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-left whitespace-nowrap text-xs sm:text-sm" {...props} />,
        td: (props: any) => <td className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs sm:text-sm min-w-[80px]" {...props} />,
        p: (props: any) => <p className="mb-0" {...props} />, 
    };

    const renderQuestionInput = () => {
        const type = currentQuestion.questionType;
        const isOx = type === 'ox';
        const isMc = type === 'multiple-choice';

        if (isMc || isOx) {
            const options = currentQuestion.options || (isOx ? ['O', 'X'] : []);
            return (
                <div className="space-y-2 mt-4">
                    {options.map((option, index) => {
                        const isCorrectAnswer = isAnswerMatch(option, currentQuestion.answer);
                        const showCorrectLabel = isAnswerChecked && isCorrectAnswer;
                        return (
                            <div key={index} className="relative">
                                {showCorrectLabel && (
                                    <div className="absolute -top-2 right-2 bg-lime-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-sm">
                                        정답
                                    </div>
                                )}
                                <button
                                    onClick={() => handleAnswerSelect(option)}
                                    className={getOptionClasses(option)}
                                    disabled={isAnswerChecked}
                                >
                                    <div className="overflow-x-auto">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm, remarkMath]}
                                            rehypePlugins={[[rehypeKatex, { output: 'html' }]]} 
                                            components={markdownComponents}
                                        >
                                            {option}
                                        </ReactMarkdown>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Default to short-answer
        return (
            <div className="mt-4">
                <input
                    type="text"
                    value={tempShortAnswer}
                    onChange={handleShortAnswerChange}
                    disabled={isAnswerChecked}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-neon-blue text-base text-slate-800 dark:text-slate-100"
                    placeholder="정답을 입력하세요..."
                    autoComplete="off"
                />
                {isAnswerChecked && (
                    <div className="mt-4 p-3 sm:p-4 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-sm">AI가 제시한 정답:</p>
                        <div className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-600 text-sm">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[[rehypeKatex, { output: 'html' }]]} 
                            >
                                {currentQuestion.answer}
                            </ReactMarkdown>
                        </div>
                        
                        {selfAssessedCorrectness[currentQuestionIndex] === null ? (
                            <div className="mt-4">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">제시된 정답과 자신의 답안을 비교하여 직접 채점해주세요.</p>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => handleSelfAssessment(true)} className="flex-1 !bg-lime-green/20 !text-lime-green hover:!bg-lime-green/30 focus:!ring-lime-green !py-2 text-sm">정답입니다</Button>
                                    <Button variant="secondary" onClick={() => handleSelfAssessment(false)} className="flex-1 !bg-red-100 dark:!bg-red-900/30 !text-red-800 dark:!text-red-300 hover:!bg-red-200 dark:hover:!bg-red-900/50 focus:!ring-red-300 !py-2 text-sm">틀립니다</Button>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 text-xs font-semibold text-center p-1.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                                {selfAssessedCorrectness[currentQuestionIndex] ? '정답으로 채점함' : '오답으로 채점함'}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const type = currentQuestion.questionType;
    const isMcOrOx = type === 'multiple-choice' || type === 'ox';
    
    // Logic for enabling buttons
    const hasAnswer = isMcOrOx ? userAnswer !== null : tempShortAnswer.trim() !== '';
    const isCheckAnswerDisabled = !hasAnswer;
    
    // For Short Answer, next button is disabled until self-assessment is done
    const isNextButtonDisabled = isAnswerChecked && !isMcOrOx && selfAssessedCorrectness[currentQuestionIndex] === null;

    return (
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-xl shadow-lg min-h-[50vh] flex flex-col transition-colors duration-300">
            <div className="flex-grow prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none leading-snug">
                <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 m-0">문제 {currentQuestionIndex + 1} / {questions.length}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${currentQuestion.questionType === 'ox' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : currentQuestion.questionType === 'multiple-choice' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                        {currentQuestion.questionType === 'ox' ? 'OX' : currentQuestion.questionType === 'multiple-choice' ? '객관식' : '서술형'}
                    </span>
                </div>
                
                {currentQuestion.imageBase64 && (
                    <div className="my-2">
                        <img 
                            src={`data:image/png;base64,${currentQuestion.imageBase64}`} 
                            alt="Question illustration" 
                            className="rounded-lg shadow-sm mx-auto max-w-full h-auto max-h-40 sm:max-h-60 object-contain bg-slate-50 dark:bg-slate-700" 
                        />
                    </div>
                )}
                
                <div className="font-medium text-slate-900 dark:text-slate-100 mt-2 text-base">
                     <div className="overflow-x-auto">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]} 
                            rehypePlugins={[[rehypeKatex, { output: 'html' }]]} 
                            components={markdownComponents}
                        >
                            {currentQuestion.question}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>

            {renderQuestionInput()}

            {isAnswerChecked && (
                 <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-sm">📝 해설</h3>
                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none overflow-x-auto leading-snug">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]} 
                            rehypePlugins={[[rehypeKatex, { output: 'html' }]]} 
                            components={markdownComponents}
                        >
                            {currentQuestion.explanation}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center sticky bottom-0 bg-white dark:bg-slate-800 pb-3 sm:static sm:pb-0 z-20">
                <Button 
                    onClick={handlePrev} 
                    disabled={currentQuestionIndex === 0} 
                    variant="secondary"
                    className="!py-2.5 !px-3 text-xs sm:text-sm"
                >
                    이전 문제
                </Button>
                
                <div className="flex-1 ml-2">
                    {isAnswerChecked ? (
                        <Button onClick={handleNext} disabled={isNextButtonDisabled} className="w-full shadow-lg sm:shadow-none !py-2.5">
                            {isLastQuestion ? '결과 보기' : '다음 문제'}
                        </Button>
                    ) : (
                        <Button onClick={handleCheckAnswer} disabled={isCheckAnswerDisabled} className="w-full shadow-lg sm:shadow-none !py-2.5">
                            정답 확인
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
