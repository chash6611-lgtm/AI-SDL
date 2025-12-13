
import React, { useState, useMemo, useEffect } from 'react';
import type { EducationCurriculum, Subject, Unit, GradeContent, AchievementStandard } from '../types.ts';
import { Button } from './common/Button.tsx';
import type { AppStatus } from '../App.tsx';
import { Spinner } from './common/Spinner.tsx';

interface CurriculumSelectorProps {
    educationCurriculums: EducationCurriculum[];
    onStartStudy: (subjectName: string, standard: AchievementStandard) => void;
    apiKey: string;
    onApiKeySubmit: (key: string) => void;
    apiStatus: AppStatus;
    apiError: string | null;
    isCoolMode: boolean;
}

const UsageGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto flex flex-col text-left"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">앱 활용 방법</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed overflow-y-auto flex-1 pr-2">
                    <h3 className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0 mb-2">1. 예습 및 개념 다지기 (수업 전/후)</h3>
                    <p className="mb-2 text-sm">학교 수업 전 예습용이나, 수업 후 복습용으로 활용할 수 있습니다.</p>
                    <ul className="list-disc pl-5 space-y-1 mb-4 text-sm">
                        <li><strong>성취기준 기반 학습:</strong> 막연하게 "수학 공부"를 하는 것이 아니라, 교육과정(2022 개정)에 명시된 구체적인 성취기준을 하나씩 선택하여 목표를 명확히 합니다.</li>
                        <li><strong>AI 튜터의 설명:</strong> 교과서만으로 이해가 안 가는 부분은 AI가 생성해주는 <strong>구조화된 설명(개념 정의, 원리, 예시)</strong>을 읽습니다.</li>
                        <li><strong>시각적/청각적 학습:</strong> 텍스트만 보는 것이 지루하다면 <strong>'듣기' 기능(TTS)</strong>을 켜서 강의처럼 듣거나, AI가 생성한 개념 이미지를 보며 직관적으로 이해합니다.</li>
                        <li><strong>핵심 요약:</strong> 시간이 없을 때는 상단의 '핵심 요약' 박스만 빠르게 훑어보며 개념을 상기시킵니다.</li>
                    </ul>

                    <h3 className="text-base font-bold text-blue-600 dark:text-blue-400 mb-2">2. 1:1 맞춤형 질문 (심화 학습)</h3>
                    <p className="mb-2 text-sm">이해가 안 되는 부분은 AI에게 즉시 질문하여 해결합니다.</p>
                    <ul className="list-disc pl-5 space-y-1 mb-4 text-sm">
                        <li><strong>무제한 질의응답:</strong> "이 공식이 왜 이렇게 유도되나요?", "실생활 예시는 무엇인가요?" 등 궁금한 점을 채팅창에 물어봅니다.</li>
                        <li><strong>수식 입력 활용:</strong> 앱에 내장된 수식 입력 도구를 활용하여 복잡한 수학 기호가 포함된 질문도 정확하게 할 수 있습니다.</li>
                    </ul>

                    <h3 className="text-base font-bold text-blue-600 dark:text-blue-400 mb-2">3. 단계별 문제 풀이 (실전 연습)</h3>
                    <p className="mb-2 text-sm">자신의 수준에 맞춰 문제를 생성하고 풉니다.</p>
                    <ul className="list-disc pl-5 space-y-1 mb-4 text-sm">
                        <li><strong>난이도 조절:</strong> 처음에는 '하' 또는 '중' 난이도로 시작하여 개념을 확인하고, 실력이 쌓이면 '상' 난이도로 도전합니다.</li>
                        <li><strong>다양한 문제 유형:</strong>
                            <ul className="list-circle pl-5 mt-1 space-y-1">
                                <li><strong>OX 퀴즈 / 객관식:</strong> 개념을 정확히 아는지 빠르게 체크할 때 유용합니다.</li>
                                <li><strong>단답형 / 서술형:</strong> 정확한 용어와 풀이 과정을 쓸 수 있는지 연습합니다.</li>
                                <li><strong>창의/탐구형:</strong> 단순 계산이 아니라, 원리를 설명하거나 논리적으로 사고하는 힘을 기를 때 선택합니다. (AI가 논리, 관련성, 창의성을 기준으로 채점해줍니다.)</li>
                            </ul>
                        </li>
                    </ul>

                    <h3 className="text-base font-bold text-blue-600 dark:text-blue-400 mb-2">4. 메타인지 및 약점 보완 (대시보드 활용)</h3>
                    <p className="mb-2 text-sm">학습 후에는 '나의 성취 수준(대시보드)' 메뉴를 통해 자신의 학습 상태를 점검합니다.</p>
                    <ul className="list-disc pl-5 space-y-1 mb-4 text-sm">
                        <li><strong>학습 이력 관리:</strong> 내가 언제 어떤 단원을 공부했는지 기록을 확인합니다.</li>
                        <li><strong>취약 단원 파악:</strong> 그래프를 통해 점수가 낮은 단원(빨간색 막대 등)을 한눈에 파악하고, 해당 부분만 다시 공부합니다.</li>
                        <li><strong>AI 학습 코칭 리포트:</strong> 단순히 점수만 보는 것이 아니라, 'AI 상세 분석 받기' 버튼을 눌러 AI가 분석해주는 나의 강점과 보완할 점, 구체적인 학습 전략을 코칭받습니다.</li>
                    </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-semibold"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CurriculumSelector: React.FC<CurriculumSelectorProps> = ({ 
    educationCurriculums, 
    onStartStudy,
    apiKey,
    onApiKeySubmit,
    apiStatus,
    apiError,
    isCoolMode
}) => {
    const [selectedCurriculumName, setSelectedCurriculumName] = useState<string>(educationCurriculums[0].name);
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');
    const [selectedUnitName, setSelectedUnitName] = useState<string>('');
    const [selectedStandardId, setSelectedStandardId] = useState<string>('');
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    
    // Local state for API key input to allow typing before submitting
    const [localApiKey, setLocalApiKey] = useState(apiKey);

    useEffect(() => {
        setLocalApiKey(apiKey);
    }, [apiKey]);

    const {
        availableSubjects,
        selectedSubject,
        availableGrades,
        availableUnits,
        availableStandards,
        selectedStandard,
    } = useMemo(() => {
        const curriculum = educationCurriculums.find(c => c.name === selectedCurriculumName) || educationCurriculums[0];
        
        const subjects = curriculum.subjects;

        const subject = subjects.find(s => s.name === selectedSubjectName) || null;
        
        const grades = subject ? subject.grades.map(g => g.grade) : [];
        
        const gradeContent = subject?.grades.find(g => g.grade === selectedGrade) || null;
        
        const units = gradeContent ? gradeContent.units : [];
        
        const unit = units.find(u => u.name === selectedUnitName) || null;
        
        const standards = unit ? unit.standards : [];
        
        const standard = standards.find(s => s.id === selectedStandardId) || null;

        return {
            selectedCurriculum: curriculum,
            availableSubjects: subjects,
            selectedSubject: subject,
            availableGrades: grades,
            selectedGradeContent: gradeContent,
            availableUnits: units,
            selectedUnit: unit,
            availableStandards: standards,
            selectedStandard: standard,
        };
    }, [educationCurriculums, selectedCurriculumName, selectedSubjectName, selectedGrade, selectedUnitName, selectedStandardId]);
    
    useEffect(() => {
        setSelectedGrade('');
        setSelectedSubjectName('');
        setSelectedUnitName('');
        setSelectedStandardId('');
    }, [selectedCurriculumName]);
    
    useEffect(() => {
       setSelectedUnitName('');
       setSelectedStandardId('');
    }, [selectedGrade]);

    useEffect(() => {
        setSelectedGrade('');
        setSelectedUnitName('');
        setSelectedStandardId('');
    }, [selectedSubjectName]);

    useEffect(() => {
        setSelectedStandardId('');
    }, [selectedUnitName]);

    const handleSubmit = () => {
        if (selectedSubject && selectedStandard) {
            onStartStudy(selectedSubject.name, selectedStandard);
        }
    };
    
    const handleApiKeySave = () => {
        onApiKeySubmit(localApiKey);
    };

    const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
        // text-base (16px) prevents iOS automatic zoom on focus. Reduced vertical padding to py-1.
        <select {...props} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg py-1 px-2 text-base text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-neon-blue focus:border-neon-blue transition duration-150 ease-in-out disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 disabled:cursor-not-allowed appearance-none bg-[length:10px_10px] bg-[right_0.75rem_center] bg-no-repeat pr-8">
            {children}
        </select>
    );

    const DisabledSelectPlaceholder: React.FC<{text: string}> = ({ text }) => (
      <div className="w-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-1 px-2 text-base text-slate-500 cursor-not-allowed">
        {text}
      </div>
    );
    
    const isSubjectReady = useMemo(() => {
        return !(availableUnits.length === 1 && availableUnits[0].name === "준비중인 단원입니다.");
    }, [availableUnits]);


    return (
         <div className="max-w-3xl mx-auto text-center px-2 pb-24 md:pb-20">
            <div className="my-4 md:my-6">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    <span className="text-blue-900 dark:text-blue-400">AI 쌤과 함께</span> <span className={isCoolMode ? "text-[#B22222]" : "text-[#FF3B30]"}>나의 실력 체크!</span>
                </h1>
                <p className="mt-1 text-slate-600 dark:text-slate-300 text-[11px] sm:text-sm leading-snug break-keep tracking-tight" style={{ wordBreak: 'keep-all' }}>
                    교육과정 성취기준을 선택하면 AI가 개념 설명과 문제 풀이를 도와줍니다.
                </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg px-4 py-2 md:px-6 md:py-3 mt-2 text-left transition-colors duration-300">
                <div className="mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        학습 목표 설정
                    </h2>
                    <button 
                        onClick={() => setIsGuideOpen(true)}
                        className="text-sm font-medium text-neon-blue hover:text-blue-600 hover:underline transition-colors"
                    >
                        앱 활용 방법
                    </button>
                </div>
                <div className="space-y-2.5">
                    <div>
                        <label htmlFor="curriculum" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">교육과정</label>
                        <Select id="curriculum" value={selectedCurriculumName} onChange={e => setSelectedCurriculumName(e.target.value)}>
                            {educationCurriculums.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label htmlFor="subject" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">과목</label>
                            <Select id="subject" value={selectedSubjectName} onChange={e => setSelectedSubjectName(e.target.value)} disabled={availableSubjects.length === 0}>
                                <option value="" disabled={selectedSubjectName !== ''}>선택</option>
                                {availableSubjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="grade" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">학년</label>
                            <Select id="grade" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} disabled={!selectedSubjectName}>
                                <option value="" disabled={selectedGrade !== ''}>선택</option>
                                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </Select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="unit" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">단원</label>
                        {selectedGrade && !isSubjectReady ? (
                          <DisabledSelectPlaceholder text="준비중인 단원입니다." />
                        ) : (
                          <Select id="unit" value={selectedUnitName} onChange={e => setSelectedUnitName(e.target.value)} disabled={!selectedGrade}>
                              <option value="" disabled={selectedUnitName !== ''}>단원을 선택하세요</option>
                              {availableUnits.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                          </Select>
                        )}
                    </div>
                    <div>
                        <label htmlFor="standard" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">성취기준</label>
                         {selectedGrade && !isSubjectReady ? (
                          <DisabledSelectPlaceholder text="성취기준을 선택하세요" />
                        ) : (
                          <Select id="standard" value={selectedStandardId} onChange={e => setSelectedStandardId(e.target.value)} disabled={!selectedUnitName || availableStandards.length === 0}>
                              <option value="" disabled={selectedStandardId !== ''}>성취기준을 선택하세요</option>
                              {availableStandards.map(s => <option key={s.id} value={s.id}>{s.id}: {s.description}</option>)}
                          </Select>
                        )}
                        {selectedStandard && (
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-200 dark:border-slate-600 leading-snug">
                                {selectedStandard.description}
                            </p>
                        )}
                    </div>

                    {/* API Key Input Section */}
                    <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-700">
                        <label htmlFor="api-key-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Google AI Studio API 키
                        </label>
                        <p className="text-[11px] sm:text-xs text-[#001F3F] dark:text-slate-300 mb-2 leading-snug">
                            Google AI 기반의 맞춤형 학습 콘텐츠 생성을 위해서는 API 키 입력이 필요합니다. 다만, 만 18세 미만 이용자는 직접 API 키를 발급받을 수 없으므로, 보호자가 대신 무료 API 키를 발급한 후 학생에게 전달(예: 이메일 전송)하여 사용할 수 있습니다.
                        </p>
                        <div className="flex gap-2">
                            <input 
                                id="api-key-input"
                                type="password" 
                                value={localApiKey}
                                onChange={(e) => setLocalApiKey(e.target.value)}
                                className={`flex-1 bg-slate-50 dark:bg-slate-700 border rounded-lg p-2 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-neon-blue outline-none ${apiError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                                placeholder="API 키를 입력하세요"
                            />
                            <Button 
                                onClick={handleApiKeySave} 
                                variant="secondary"
                                className="!py-2 !px-3 text-xs shrink-0"
                                disabled={apiStatus === 'validating_key'}
                            >
                                {apiStatus === 'validating_key' ? <Spinner size="sm" /> : '확인'}
                            </Button>
                        </div>
                        {apiError && <p className="text-red-500 text-xs mt-1">{apiError}</p>}
                        {apiStatus === 'key_valid' && !apiError && <p className="text-lime-green text-xs mt-1 font-medium">API 키가 확인되었습니다.</p>}
                         <div className="text-right mt-1">
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[10px] text-[#FF4500] dark:text-[#FF6347] hover:text-orange-600 hover:underline"
                            >
                                무료 API 키 발급받기 ↗
                            </a>
                        </div>
                    </div>
                </div>
            </div>

             <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 p-3 z-10 md:static md:bg-transparent md:border-0 md:p-0 md:mt-6">
                <div className="max-w-3xl mx-auto">
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!selectedStandardId || apiStatus !== 'key_valid'} 
                        className={`w-full text-base font-bold py-3 shadow-lg md:shadow-none disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-500 ${isCoolMode ? '!bg-cyan-400 !text-white hover:!brightness-95 focus:!ring-cyan-400' : '!bg-yellow-gold !text-black hover:!brightness-95 focus:!ring-yellow-gold'}`}
                    >
                        {apiStatus === 'key_valid' ? '학습 시작하기' : 'API 키를 확인해주세요'}
                    </Button>
                </div>
            </div>

            <div className="mt-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                Developed by 이포피(E4P) | 이메일 e4p2024@gmail.com
            </div>
            
            {isGuideOpen && <UsageGuideModal onClose={() => setIsGuideOpen(false)} />}
        </div>
    );
};
