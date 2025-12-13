
export type QuestionType = 'multiple-choice' | 'short-answer' | 'ox' | 'creativity';

export type View = 'selector' | 'study' | 'dashboard';

export type Theme = 'light' | 'dark' | 'system';

export type Difficulty = 'low' | 'medium' | 'high';

export interface HistoryState {
    view: View;
    standard: { subjectName: string, standard: AchievementStandard } | null;
}

export interface AchievementStandard {
    id: string;
    description: string;
}

export interface Unit {
    name: string;
    standards: AchievementStandard[];
}

export interface GradeContent {
    grade: string;
    units: Unit[];
}

export interface Subject {
    name: string;
    grades: GradeContent[];
}

export interface EducationCurriculum {
    name: string;
    subjects: Subject[];
}

export interface QuizQuestion {
    question: string;
    questionTranslation?: string;
    passage?: string; // Text for listening script or reading passage
    passageTranslation?: string;
    questionType: QuestionType;
    options?: string[]; // For multiple-choice and OX
    optionsTranslation?: string[];
    answer: string;
    answerTranslation?: string;
    explanation: string;
    explanationTranslation?: string;
    imageBase64?: string;
}

export interface QuizResult {
    id: string;
    date: string;
    standardId: string;
    standardDescription: string;
    subject: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    // New fields for reviewing saved quizzes
    questions?: QuizQuestion[];
    userAnswers?: (string | null)[];
    correctness?: (boolean | null)[];
}

export interface ConversationMessage {
    role: 'user' | 'model';
    text: string;
}

export type TTSVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface ShortAnswerEvaluation {
    grade: Grade;
    feedback: string;
}
