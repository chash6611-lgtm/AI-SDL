
import React, { useMemo, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.ts';
import type { QuizResult } from '../types.ts';
import { EDUCATION_CURRICULUMS } from '../constants.ts';
import { Button } from './common/Button.tsx';
import { Card } from './common/Card.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const curriculumDetailsCache = new Map();
const findDetailsForStandard = (standardId: string) => {
    if (curriculumDetailsCache.has(standardId)) {
        return curriculumDetailsCache.get(standardId);
    }
    for (const curriculum of EDUCATION_CURRICULUMS) {
        for (const subject of curriculum.subjects) {
            for (const grade of subject.grades) {
                for (const unit of grade.units) {
                    const standard = unit.standards.find(s => s.id === standardId);
                    if (standard) {
                        const details = {
                            curriculumName: curriculum.name,
                            subjectName: subject.name,
                            grade: grade.grade,
                            unitName: unit.name,
                            standardDescription: standard.description
                        };
                        curriculumDetailsCache.set(standardId, details);
                        return details;
                    }
                }
            }
        }
    }
    return null;
};

const StatsCard = ({ title, value, unit }: { title: string, value: string | number, unit?: string }) => (
    <Card className="text-center">
        <h3 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {value} <span className="text-base font-medium text-slate-600 dark:text-slate-400">{unit}</span>
        </p>
    </Card>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl max-w-[200px] z-50">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mb-1 break-words">{`${label}`}</p>
                <p className="text-xs text-neon-blue font-semibold">{`점수: ${payload[0].value.toFixed(1)}점`}</p>
            </div>
        );
    }
    return null;
};

const CustomAxisTick = ({ x, y, payload, dy = 16, dx = 0, textAnchor = "middle" }: any) => (
    <g transform={`translate(${x},${y})`}>
        <text 
            x={0} 
            y={0} 
            dy={dy}
            dx={dx}
            textAnchor={textAnchor} 
            className="fill-slate-600 dark:fill-slate-400 font-bold text-xs"
        >
            {payload.value}
        </text>
    </g>
);

const QuizReviewModal: React.FC<{ result: QuizResult; onClose: () => void }> = ({ result, onClose }) => {
    const markdownComponents = {
        table: (props: any) => <div className="overflow-x-auto mb-2"><table className="table-auto w-full border-collapse border border-slate-300 dark:border-slate-600" {...props} /></div>,
        thead: (props: any) => <thead className="bg-slate-100 dark:bg-slate-700" {...props} />,
        th: (props: any) => <th className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-left whitespace-nowrap text-sm" {...props} />,
        td: (props: any) => <td className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm min-w-[100px]" {...props} />,
        p: (props: any) => <p className="mb-0 leading-snug" {...props} />, 
    };

    if (!result.questions) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">학습 기록 상세</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(result.date).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div className="overflow-y-auto flex-1 pr-1 space-y-6">
                    {result.questions.map((q, idx) => {
                        const userAnswer = result.userAnswers ? result.userAnswers[idx] : null;
                        const isCorrect = result.correctness ? result.correctness[idx] : false;

                        return (
                            <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/30">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">문제 {idx + 1}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {isCorrect ? '정답' : '오답'}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-800 dark:text-slate-100 mb-3 prose prose-sm dark:prose-invert max-w-none leading-snug">
                                    <div className="overflow-x-auto">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm, remarkMath]}
                                            rehypePlugins={[[rehypeKatex, { output: 'html' }]]} 
                                            components={markdownComponents}
                                        >
                                            {q.question}
                                        </ReactMarkdown>
                                    </div>
                                    {q.questionTranslation && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {q.questionTranslation}
                                        </div>
                                    )}
                                </div>
                                
                                {q.passage && (
                                    <div className="mb-3 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 max-h-32 overflow-y-auto">
                                        <p className="font-bold mb-1">지문/스크립트:</p>
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm, remarkMath]}
                                            rehypePlugins={[[rehypeKatex, { output: 'html' }]]} 
                                            components={markdownComponents}
                                        >
                                            {q.passage}
                                        </ReactMarkdown>
                                        {q.passageTranslation && (
                                             <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[[rehypeKatex, { output: 'html' }]]} 
                                                    components={markdownComponents}
                                                >
                                                    {q.passageTranslation}
                                                </ReactMarkdown>
                                             </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2 text-sm">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">나의 답안</span>
                                        <div className={`p-2 rounded border ${isCorrect ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800 text-green-800 dark:text-green-200' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800 text-red-800 dark:text-red-200'}`}>
                                            <div className="overflow-x-auto">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm, remarkMath]} 
                                                    rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                                                    components={markdownComponents}
                                                >
                                                    {userAnswer || '(미입력)'}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">정답 및 해설</span>
                                        <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600">
                                            <div className="text-neon-blue font-semibold mb-1">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm, remarkMath]} 
                                                    rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                                                    components={markdownComponents}
                                                >
                                                    {q.answer}
                                                </ReactMarkdown>
                                                {q.answerTranslation && <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-2">({q.answerTranslation})</span>}
                                            </div>
                                            <div className="text-slate-600 dark:text-slate-400 text-xs leading-snug">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm, remarkMath]} 
                                                    rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                                                    components={markdownComponents}
                                                >
                                                    {q.explanation}
                                                </ReactMarkdown>
                                                 {q.explanationTranslation && (
                                                    <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700">
                                                        <ReactMarkdown 
                                                            remarkPlugins={[remarkGfm, remarkMath]} 
                                                            rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                                                            components={markdownComponents}
                                                        >
                                                            {q.explanationTranslation}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

interface DashboardProps {
    onGoHome: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onGoHome }) => {
    const [studyHistory, setStudyHistory] = useLocalStorage<QuizResult[]>('studyHistory', []);
    const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string>('');

    // Calculate stats
    const totalQuizzes = studyHistory.length;
    const totalQuestionsAnswered = studyHistory.reduce((acc, curr) => acc + curr.totalQuestions, 0);
    const averageScore = totalQuizzes > 0
        ? studyHistory.reduce((acc, curr) => acc + curr.score, 0) / totalQuizzes
        : 0;

    // Detailed history with Unit info
    const detailedHistory = useMemo(() => {
        return studyHistory.map(result => {
            const details = findDetailsForStandard(result.standardId);
            return {
                ...result,
                unitName: details?.unitName || 'Unknown Unit',
                subject: result.subject || details?.subjectName || 'Unknown' 
            };
        });
    }, [studyHistory]);

    // Subject Data
    const subjectData = useMemo(() => {
        const stats: Record<string, { total: number; count: number }> = {};
        detailedHistory.forEach(item => {
            if (!stats[item.subject]) stats[item.subject] = { total: 0, count: 0 };
            stats[item.subject].total += item.score;
            stats[item.subject].count += 1;
        });
        return Object.keys(stats).map(subject => ({
            name: subject,
            score: Math.round(stats[subject].total / stats[subject].count)
        }));
    }, [detailedHistory]);

    // Set default selected subject
    useEffect(() => {
        if (subjectData.length > 0 && !selectedSubject) {
            setSelectedSubject(subjectData[0].name);
        }
    }, [subjectData, selectedSubject]);

    // Unit Data
    const unitData = useMemo(() => {
        if (!selectedSubject) return [];
        const filtered = detailedHistory.filter(h => h.subject === selectedSubject);
        const stats: Record<string, { total: number; count: number }> = {};
        filtered.forEach(item => {
            const unit = item.unitName;
            if (!stats[unit]) stats[unit] = { total: 0, count: 0 };
            stats[unit].total += item.score;
            stats[unit].count += 1;
        });
        return Object.keys(stats).map(unit => ({
            name: unit,
            score: Math.round(stats[unit].total / stats[unit].count)
        })).sort((a, b) => b.score - a.score);
    }, [detailedHistory, selectedSubject]);

    // Prepare recent chart data (last 10 quizzes)
    const recentChartData = useMemo(() => {
        return studyHistory.slice(-10).map((result) => ({
            name: new Date(result.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
            score: result.score,
            fullDate: new Date(result.date).toLocaleString(),
            standard: result.standardId
        }));
    }, [studyHistory]);

    // Reverse history for list view (newest first)
    const reversedHistory = useMemo(() => [...studyHistory].reverse(), [studyHistory]);

    const handleDelete = (id: string) => {
        if (window.confirm("정말로 이 학습 기록을 삭제하시겠습니까?")) {
            const newHistory = studyHistory.filter(item => item.id !== id);
            setStudyHistory(newHistory);
        }
    };

    const colors = ['#0096FF', '#2ECC71', '#F39C12', '#8E44AD', '#F1C40F'];

    return (
        <div className="max-w-4xl mx-auto px-2 pb-20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">나의 학습 현황</h1>
                <Button onClick={onGoHome} className="!py-2 !px-4 text-sm">학습하러 가기</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatsCard title="완료한 학습" value={totalQuizzes} unit="회" />
                <StatsCard title="평균 점수" value={averageScore.toFixed(1)} unit="점" />
                <StatsCard title="푼 문제 수" value={totalQuestionsAnswered} unit="문제" />
            </div>

            {studyHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Card className="p-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">과목별 평균 성취도</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={subjectData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" className="dark:stroke-slate-600" />
                                        <XAxis 
                                            dataKey="name" 
                                            tick={<CustomAxisTick dy={12} />}
                                            axisLine={false} 
                                            tickLine={false} 
                                        />
                                        <YAxis 
                                            tick={<CustomAxisTick dx={-10} dy={4} textAnchor="end" />}
                                            axisLine={false} 
                                            tickLine={false} 
                                            domain={[0, 100]} 
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={40}>
                                            {subjectData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">단원별 성취도</h3>
                                <select 
                                    value={selectedSubject} 
                                    onChange={e => setSelectedSubject(e.target.value)}
                                    className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg py-1 px-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-neon-blue"
                                >
                                    {subjectData.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            {unitData.length > 0 ? (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart 
                                            data={unitData} 
                                            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" className="dark:stroke-slate-600" />
                                            <XAxis 
                                                dataKey="name" 
                                                tick={<CustomAxisTick dy={12} />}
                                                axisLine={false} 
                                                tickLine={false} 
                                                interval={0}
                                            />
                                            <YAxis 
                                                domain={[0, 100]} 
                                                tick={<CustomAxisTick dx={-10} dy={4} textAnchor="end" />}
                                                axisLine={false} 
                                                tickLine={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={40} fill="#2ECC71">
                                                {unitData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#2ECC71' : entry.score >= 60 ? '#3498DB' : '#E74C3C'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 w-full flex items-center justify-center text-slate-500 text-sm">
                                    데이터가 없습니다.
                                </div>
                            )}
                        </Card>
                    </div>

                    <Card className="mb-6 p-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">최근 10회 학습 추이</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={recentChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" className="dark:stroke-slate-600" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={<CustomAxisTick dy={12} />}
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <YAxis 
                                        tick={<CustomAxisTick dx={-10} dy={4} textAnchor="end" />}
                                        axisLine={false} 
                                        tickLine={false} 
                                        domain={[0, 100]} 
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {recentChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#00e676' : entry.score >= 60 ? '#2979ff' : '#ff3d00'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">전체 학습 기록</h3>
                    <div className="space-y-3">
                        {reversedHistory.map((result) => {
                             const details = findDetailsForStandard(result.standardId);
                             const standardDesc = result.standardDescription || details?.standardDescription || result.standardId;
                             
                             return (
                                <Card key={result.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer !p-3 sm:!p-4">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" onClick={() => setSelectedResult(result)}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                        {result.subject}
                                                    </span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(result.date).toLocaleString()}
                                                    </span>
                                                </div>
                                                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base line-clamp-1 truncate">
                                                    {standardDesc}
                                                </h4>
                                                 {details && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                        {details.grade} &gt; {details.unitName}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                                <div className="text-right">
                                                    <span className={`text-lg font-bold ${result.score >= 80 ? 'text-lime-green' : result.score >= 60 ? 'text-neon-blue' : 'text-sunset-orange'}`}>
                                                        {result.score.toFixed(0)}점
                                                    </span>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {result.correctAnswers} / {result.totalQuestions} 문제
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                                            <Button 
                                                variant="secondary" 
                                                className="!py-1.5 !px-3 text-xs"
                                                onClick={() => setSelectedResult(result)}
                                            >
                                                상세보기
                                            </Button>
                                            <Button 
                                                variant="secondary" 
                                                className="!py-1.5 !px-3 text-xs !text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-900/30"
                                                onClick={() => handleDelete(result.id)}
                                            >
                                                삭제
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 mb-4">아직 학습 기록이 없습니다.</p>
                    <Button onClick={onGoHome}>학습 시작하기</Button>
                </div>
            )}

            {selectedResult && (
                <QuizReviewModal 
                    result={selectedResult} 
                    onClose={() => setSelectedResult(null)} 
                />
            )}
        </div>
    );
};
