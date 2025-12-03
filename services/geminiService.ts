
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from '@google/genai';
import type { QuizQuestion, TTSVoice, QuestionType, ConversationMessage } from '../types.ts';

let ai: GoogleGenAI | null = null;

export const initializeAi = (apiKey: string) => {
    if (!apiKey) {
        throw new Error("API 키가 제공되지 않았습니다.");
    }
    ai = new GoogleGenAI({ apiKey });
};

const getAi = (): GoogleGenAI => {
    if (!ai) {
        throw new Error("AI 서비스가 초기화되지 않았습니다. API 키를 먼저 설정해주세요.");
    }
    return ai;
};

const handleApiError = (error: unknown): never => {
    console.error("Gemini API Error:", error);
    if (error instanceof Error && (error.message.includes("API key not valid") || error.message.includes("Requested entity was not found."))) {
        throw new Error("API 키가 유효하지 않습니다. 올바른 키로 다시 설정해주세요.");
    }
    
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
        throw new Error("AI 모델 통신 오류: 파일을 직접 열어 실행하는 경우 브라우저 보안 정책으로 인해 AI 기능이 작동하지 않을 수 있습니다. 로컬 개발 서버를 통해 접속해주세요.");
    }

    throw new Error("AI 모델과 통신 중 오류가 발생했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.");
};

export const validateApiKey = async (apiKey: string): Promise<void> => {
    if (!apiKey) {
        throw new Error("API 키를 입력해주세요.");
    }
    try {
        const tempAi = new GoogleGenAI({ apiKey });
        // Use a very simple, low-cost call to validate the key
        await tempAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'hello',
        });
        // If successful, it returns void.
    } catch (error) {
        console.error("API Key validation failed:", error);
        if (error instanceof Error && (error.message.includes("API key not valid") || error.message.includes("Requested entity was not found."))) {
            throw new Error("API 키가 유효하지 않습니다. Google AI Studio에서 발급받은 정확한 키인지 확인해주세요.");
        }
        throw new Error("키를 확인하는 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.");
    }
};

export const generateIllustration = async (prompt: string): Promise<string | null> => {
    try {
        const aiInstance = getAi();
        const imagePrompt = `**[Strict Visual Rule]** This image must be purely visual. Do NOT include any text, numbers, labels, or symbols. Style: Friendly, colorful, and clear educational illustration suitable for a middle school textbook. It should visually explain the following concept to help a student understand: ${prompt}.`;
        
        const response = await aiInstance.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: imagePrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        return null;
    } catch (error) {
        console.error("Image generation failed:", error);
        return null; 
    }
};

const MATH_RULE_PROMPT = `
**[수식 표기 원칙 - LaTeX 필수]**
1. **수학 수식은 반드시 LaTeX 문법**을 사용하십시오.
2. **인라인 수식**: 문장 중간에 나오는 변수나 간단한 식은 \`$ ... $\`를 사용하세요. (예: $y = 2x$)
3. **블록 수식**: 중요하거나 복잡한 식은 \`$$ ... $$\`를 사용하세요. (예: $$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$)
4. **주의**: \`$x$\`와 같이 달러 기호로 확실하게 감싸야 렌더링됩니다. 일반 텍스트로 수식을 쓰지 마십시오.
`;

export const getExplanationStream = async (subjectName: string, standardDescription: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
    try {
        let prompt = '';
        if (subjectName === '영어') {
            prompt = `
            당신은 한국 중학생들을 위한 친절하고 유능한 영어 AI 튜터입니다.
            다음 영어과 성취기준의 핵심 개념을 중학생들이 **쉽고 재미있게** 이해할 수 있도록 **개요 형식(번호와 불릿 포인트)**으로 정리해서 설명해주세요.
            
            **작성 지침:**
            1. **구조화된 설명**: **1. 핵심 개념**, **2. 주요 표현/문법**, **3. 예문** 과 같이 번호를 매겨 정리하세요.
            2. **중학생 눈높이**: 어려운 용어는 쉽게 풀어서 설명하고, 친근한 어조("~해요", "~랍니다")를 사용하세요.
            3. **풍부한 예시**: 문법이나 표현을 설명할 때 실제 원어민이 사용하는 자연스러운 영어 문장 예시를 많이 들어주세요.
            4. **핵심 요약**: 400자 내외로 핵심 내용을 명확하게 전달하세요.

            성취기준: "${standardDescription}"
            `;
        } else {
            prompt = `
            당신은 한국의 중학생들을 위한 친절하고 유능한 AI 튜터입니다.
            다음 성취기준에 대해 학생들이 **쉽고 재미있게** 이해할 수 있도록 **개요 형식(번호와 불릿 포인트 활용)**으로 일목요연하게 설명해주세요.

            **작성 지침:**
            1. **구조화된 개요 형식**: 줄글로 길게 늘어놓지 말고, **1. 개념 정의**, **2. 주요 특징/원리**, **3. 실생활 예시** 와 같이 번호를 매겨 구조화하세요.
            2. **중학생 눈높이**: 어려운 전문 용어 대신 쉬운 단어를 사용하고, 개념을 직관적으로 이해할 수 있도록 설명하세요.
            3. **수식 강조**: 수학/과학 공식은 **블록 수식($$ ... $$)**을 사용하여 눈에 잘 띄게 표현하세요.
            4. **친근한 어조**: 선생님이 정리해주는 것처럼 다정하고 격려하는 어조("~해요", "~랍니다")를 사용하세요.
            
            ${MATH_RULE_PROMPT}

            성취기준: "${standardDescription}"
            `;
        }

        const aiInstance = getAi();
        const response = await aiInstance.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response;
    } catch (error) {
        handleApiError(error);
    }
};

export const getFollowUpAnswerStream = async (
    subjectName: string,
    standardDescription: string,
    initialExplanation: string,
    conversationHistory: ConversationMessage[],
    userQuestion: string
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    try {
        const historyText = conversationHistory
            .map(msg => `${msg.role === 'user' ? '학생' : 'AI 튜터'}: ${msg.text}`)
            .join('\n');

        let prompt = '';
        if (subjectName === '영어') {
            prompt = `
            당신은 한국 중학생들을 위한 친절하고 유능한 영어 AI 튜터입니다. 
            학생의 질문에 대해 중학생 눈높이에 맞춰 쉽고 친절하게 답변해주세요.
            
            학생은 현재 다음 영어과 성취기준에 대해 학습하고 있습니다:
            "${standardDescription}"

            당신은 이전에 학생에게 다음과 같은 초기 설명을 제공했습니다:
            --- 초기 설명 ---
            ${initialExplanation}
            --------------------

            지금까지 학생과의 대화 내용은 다음과 같습니다:
            --- 대화 기록 ---
            ${historyText}
            --------------------

            학생이 다음과 같은 새로운 질문을 했습니다. 문법, 어휘, 표현 등을 쉽게 풀어서 설명해주세요.
            학생의 질문: "${userQuestion}"
            `;
        } else {
            prompt = `
            당신은 한국의 중학생들을 위한 친절하고 유능한 AI 튜터입니다.
            학생의 질문에 대해 중학생 눈높이에 맞춰 쉽고 친절하게 답변해주세요. 이해를 돕기 위해 비유나 예시를 활용하면 좋습니다.
            수식이 필요한 경우 반드시 LaTeX 포맷($ 또는 $$)을 사용하세요.
            
            ${MATH_RULE_PROMPT}
            
            학생은 현재 다음 성취기준에 대해 학습하고 있습니다:
            "${standardDescription}"

            당신은 이전에 학생에게 다음과 같은 초기 설명을 제공했습니다:
            --- 초기 설명 ---
            ${initialExplanation}
            --------------------

            지금까지 학생과의 대화 내용은 다음과 같습니다:
            --- 대화 기록 ---
            ${historyText}
            --------------------

            학생이 다음과 같은 새로운 질문을 했습니다.
            학생의 질문: "${userQuestion}"
            `;
        }


        const aiInstance = getAi();
        const response = await aiInstance.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response;
    } catch (error) {
        handleApiError(error);
    }
};


export interface QuestionRequest {
    type: QuestionType;
    count: number;
}

export const generateQuestions = async (subjectName: string, standardDescription: string, requests: QuestionRequest[]): Promise<QuizQuestion[]> => {
    try {
        const totalQuestions = requests.reduce((sum, req) => sum + req.count, 0);
        if (totalQuestions === 0) {
            return [];
        }

        const requestPrompts = requests
            .filter(req => req.count > 0)
            .map(req => {
                switch (req.type) {
                    case 'multiple-choice':
                        return `- ${req.count}개의 객관식 문제. (5지선다)`;
                    case 'short-answer':
                        return `- ${req.count}개의 서술형 문제.`;
                    case 'ox':
                        return `- ${req.count}개의 OX 퀴즈.`;
                }
            }).join('\n');
            
        const languageInstruction = subjectName === '영어'
            ? '문제는 영어로, 괄호 안에 한글 번역 포함.'
            : '문제는 한국어로 작성.';

        const explanationInstruction = subjectName === '영어'
            ? '해설은 영어로 작성 후 괄호 안에 한글 번역 포함.'
            : '해설 포함.';

        const prompt = `
            성취기준: "${standardDescription}"
            위 성취기준에 근거하여 중학생 수준의 총 ${totalQuestions}개의 문제를 JSON 형식으로 생성하세요.
            
            요청사항:
            ${requestPrompts}
            
            지침:
            - ${languageInstruction}
            - ${explanationInstruction}
            - 문제의 난이도는 중학생이 풀 수 있는 수준으로 맞춰주세요.
            - 시각 자료가 문제 풀이에 결정적인 도움이 되는 경우에만 'imagePrompt'에 영어 프롬프트 작성 (없으면 빈 문자열).
            - ${MATH_RULE_PROMPT}
            - **JSON 문자열 내부 주의**: LaTeX를 사용할 때는 백슬래시를 이스케이프 해야 합니다. (예: "$\\frac{1}{2}$" -> "$\\\\frac{1}{2}$")
        `;

        const aiInstance = getAi();
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            questionType: { 
                                type: Type.STRING,
                                description: "Must be exactly one of: 'multiple-choice', 'short-answer', 'ox'"
                            },
                            options: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                            },
                            answer: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            imagePrompt: { 
                                type: Type.STRING,
                                description: 'Concise English prompt for image generation. Empty if not needed.'
                            },
                        },
                        required: ["question", "questionType", "answer", "explanation"],
                    },
                },
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        const jsonString = response.text;
        const questionsWithPrompts = JSON.parse(jsonString) as (QuizQuestion & { imagePrompt?: string })[];

        const questionsWithImages = await Promise.all(
            questionsWithPrompts.map(async (q) => {
                if (q.imagePrompt && q.imagePrompt.trim() !== '') {
                    const imageBase64 = await generateIllustration(q.imagePrompt);
                    return { ...q, imageBase64: imageBase64 || undefined };
                }
                return q;
            })
        );
        
        return questionsWithImages as QuizQuestion[];

    } catch (error) {
        handleApiError(error);
    }
};

export const generateSpeech = async (textToSpeak: string, voice: TTSVoice): Promise<string> => {
    try {
        const aiInstance = getAi();
        const response = await aiInstance.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("API로부터 오디오 데이터를 받지 못했습니다.");
        }
        return base64Audio;
    } catch (error) {
        handleApiError(error);
    }
};
