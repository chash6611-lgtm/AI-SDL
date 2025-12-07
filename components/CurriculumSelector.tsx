
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
                <div className="mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        학습 목표 설정
                    </h2>
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
                            Google AI 서비스를 사용하여 맞춤형 학습 콘텐츠를 생성하려면 API 키 입력이 필요합니다.
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
                                API 키 발급받기 ↗
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
        </div>
    );
};
