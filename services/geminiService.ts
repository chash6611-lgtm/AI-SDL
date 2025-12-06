
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from '@google/genai';
import type { QuizQuestion, TTSVoice, QuestionType, ConversationMessage, ShortAnswerEvaluation, QuizResult } from '../types.ts';

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
                        return `- ${req.count}개의 단답형 서술형 문제. (명확한 정답이 있는 문제)`;
                    case 'ox':
                        return `- ${req.count}개의 OX 퀴즈.`;
                    case 'creativity':
                        return `- ${req.count}개의 창의/탐구형 서술형 문제. (정답이 하나로 정해지지 않고, 학생이 성취기준을 바탕으로 논리적으로 생각하여 자신만의 답을 서술해야 하는 문제. 실생활 적용, 대안 제시, 비판적 사고 등을 요구함.)`;
                }
            }).join('\n');
            
        const languageInstruction = subjectName === '영어'
            ? '모든 텍스트(질문, 지문, 선택지, 정답, 해설)는 반드시 영어로만 작성하십시오. **필수**: `questionTranslation`, `answerTranslation`, `explanationTranslation` 필드에 각각의 한국어 번역을 반드시 포함하십시오.'
            : '문제, 정답, 해설은 모두 한국어로 작성하십시오.';

        const explanationInstruction = subjectName === '영어'
            ? '해설(explanation)은 영어로 작성하고, 그에 대한 한국어 번역은 explanationTranslation에 작성하십시오.'
            : '해설 포함.';
            
        const passageInstruction = subjectName === '영어'
            ? '**중요**: 듣기(Listening)나 독해(Reading) 평가인 경우, 대화문(Script)이나 지문(Passage)은 반드시 `passage` 필드(영어)와 `passageTranslation` 필드(한국어)에 분리하여 작성해야 합니다. `passage` 필드에는 한글을 포함하지 마세요.'
            : '국어 과목이나 지문이 필요한 경우 `passage` 필드에 지문을 작성하세요.';

        const prompt = `
            성취기준: "${standardDescription}"
            위 성취기준에 근거하여 중학생 수준의 총 ${totalQuestions}개의 문제를 JSON 형식으로 생성하세요.
            
            요청사항:
            ${requestPrompts}
            
            지침:
            - ${languageInstruction}
            - ${explanationInstruction}
            - ${passageInstruction}
            - **창의/탐구형 문제('creativity')의 경우**: 'answer' 필드에는 학생이 작성해야 할 모범 답안의 예시나, 채점 시 고려해야 할 핵심 평가 요소(키워드, 논리 구조 등)를 상세히 기술하세요.
            - 문제의 난이도는 중학생이 풀 수 있는 수준으로 맞춰주세요.
            - 시각 자료가 문제 풀이에 결정적인 도움이 되는 경우에만 'imagePrompt'에 영어 프롬프트 작성 (없으면 빈 문자열).
            - ${MATH_RULE_PROMPT}
            - **JSON 문자열 내부 주의**: LaTeX를 사용할 때는 백슬래시를 이스케이프 해야 합니다. (예: "$\\frac{1}{2}$" -> "$\\\\frac{1}{2}$")
        `;

        const requiredFields = ["question", "questionType", "answer", "explanation"];
        if (subjectName === '영어') {
            requiredFields.push("questionTranslation", "answerTranslation", "explanationTranslation");
        }

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
                            questionTranslation: { type: Type.STRING, description: "Korean translation of the question (Required for English subject)" },
                            passage: { 
                                type: Type.STRING,
                                description: "The reading passage or listening script context. Required for reading/listening tasks."
                            },
                            passageTranslation: { type: Type.STRING, description: "Korean translation of the passage (if subject is English)" },
                            questionType: { 
                                type: Type.STRING,
                                description: "Must be exactly one of: 'multiple-choice', 'short-answer', 'ox', 'creativity'"
                            },
                            options: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                            },
                            optionsTranslation: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "Korean translations of the options (if subject is English)"
                            },
                            answer: { type: Type.STRING, description: "Correct answer or model answer key for creativity questions." },
                            answerTranslation: { type: Type.STRING, description: "Korean translation of the answer (if subject is English)" },
                            explanation: { type: Type.STRING },
                            explanationTranslation: { type: Type.STRING, description: "Korean translation of the explanation (if subject is English)" },
                            imagePrompt: { 
                                type: Type.STRING,
                                description: 'Concise English prompt for image generation. Empty if not needed.'
                            },
                        },
                        required: requiredFields,
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

export const evaluateShortAnswer = async (question: string, correctAnswer: string, userAnswer: string): Promise<ShortAnswerEvaluation> => {
    try {
        const prompt = `
        You are a strict but fair teacher grading a middle school student's answer.
        
        Question: "${question}"
        Model/Correct Answer: "${correctAnswer}"
        Student's Answer: "${userAnswer}"

        Please evaluate the student's answer and assign a grade.
        
        **Grading Criteria:**
        - If the question is a factual/short-answer question, compare with the correct answer for accuracy.
        - If the question is a **Creativity/Open-ended (창의/탐구형)** question, evaluate based on:
          1. **Logic**: Is the answer logically sound and coherent?
          2. **Relevance**: Does it address the question provided?
          3. **Creativity**: Does it show original thinking or good application of concepts?
          (Note: For creativity questions, the 'Model Answer' is just a guide/example. Do not penalize for being different if the student's answer is logical and high-quality.)

        **Grade Scale:**
        - Grade 'A': Excellent. Accurate/Creative/Logical (100% points).
        - Grade 'B': Good. Mostly accurate or logical but misses minor details (75% points).
        - Grade 'C': Fair. Captures keywords or basic logic but lacks completeness (50% points).
        - Grade 'D': Poor. Misses key points or logic is weak (25% points).
        - Grade 'E': Incorrect/Irrelevant (0% points).

        Provide a brief, encouraging feedback explaining why this grade was given (in Korean).
        `;

        const aiInstance = getAi();
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        grade: { type: Type.STRING, enum: ["A", "B", "C", "D", "E"] },
                        feedback: { type: Type.STRING },
                    },
                    required: ["grade", "feedback"],
                },
            },
        });

        return JSON.parse(response.text) as ShortAnswerEvaluation;
    } catch (error) {
        console.error("Evaluation error:", error);
        throw new Error("AI 채점 중 오류가 발생했습니다.");
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

export const generateLearningDiagnosis = async (history: QuizResult[]): Promise<string> => {
    try {
        if (!history || history.length === 0) {
            return "아직 분석할 학습 기록이 충분하지 않습니다. 문제를 풀고 다시 시도해주세요!";
        }

        // Use up to 50 most recent records to stay within context context, though flash models have large context.
        // Let's pass simplified data to the model.
        const recentHistory = history.slice(-50).reverse(); // Newest first
        
        const historyText = recentHistory.map((h, idx) => {
             const date = new Date(h.date).toLocaleDateString();
             return `${idx+1}. [${date}] 과목: ${h.subject}, 내용: ${h.standardDescription || h.standardId}, 점수: ${Math.round(h.score)}점`;
        }).join('\n');

        const prompt = `
        당신은 학생의 자기주도학습을 돕는 다정하고 예리한 'AI 학습 코치'입니다.
        아래 제공된 학생의 학습 이력을 분석하여, 학생에게 도움이 되는 **학습 진단 리포트**를 작성해주세요.

        **학생의 학습 이력 (최신순):**
        ${historyText}

        **리포트 작성 가이드라인:**
        1. **인사 및 총평**: 학생의 전반적인 노력(학습 빈도, 시도 횟수 등)을 칭찬하며 따뜻하게 시작하세요.
        2. **강점 발견**: 성취도가 높거나 꾸준히 학습한 과목/단원을 찾아 구체적으로 칭찬해주세요.
        3. **취약점 및 보완 제안**: 상대적으로 점수가 낮거나 기복이 심한 부분이 있다면, 질책보다는 격려와 함께 구체적인 복습 방법(예: 개념 재확인, 오답 노트 등)을 제안해주세요.
        4. **맞춤형 학습 전략**: 앞으로 어떤 과목이나 단원에 집중하면 좋을지, 어떤 태도로 임하면 좋을지 실질적인 조언을 해주세요.
        5. **마무리**: 할 수 있다는 자신감을 불어넣어 주는 응원의 말로 마무리하세요.

        **형식 및 어조:**
        - **마크다운(Markdown)** 형식을 사용하여 가독성 있게 작성하세요 (소제목 볼드체, 리스트 활용).
        - 중학생에게 말하듯 **친근하고 존중하는 해요체**를 사용하세요.
        - 이모지(😊, 📚, ✨ 등)를 적절히 사용하여 딱딱하지 않게 표현해주세요.
        `;

        const aiInstance = getAi();
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text || "진단 리포트를 생성하지 못했습니다.";
    } catch (error) {
        console.error("Diagnosis generation error:", error);
        throw new Error("리포트를 생성하는 중 오류가 발생했습니다.");
    }
};
