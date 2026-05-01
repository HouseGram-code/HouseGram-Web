// ИИ исправление текста с несколькими провайдерами:
// 1) Pollinations.ai (без ключа, OpenAI-совместимый, LLM-уровень)
// 2) LanguageTool (без ключа, rule-based, всегда работает)
// 3) Gemini (если задан NEXT_PUBLIC_GEMINI_API_KEY)
import { GoogleGenAI } from '@google/genai';

export interface CorrectionSuggestion {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: Array<{ value: string }>;
  rule: {
    id: string;
    description: string;
    category: {
      id: string;
      name: string;
    };
  };
}

export interface CorrectionResult {
  matches: CorrectionSuggestion[];
  correctedText: string;
  hasErrors: boolean;
  provider: 'pollinations' | 'languagetool' | 'gemini' | 'none';
}

const SYSTEM_PROMPT =
  'Исправь грамматику, орфографию и пунктуацию в тексте. Сохрани язык, тон и эмодзи. Верни только готовый исправленный текст без пояснений и кавычек.';

const looksLikeDeprecationNotice = (s: string) => {
  const lower = s.toLowerCase();
  return (
    s.includes('IMPORTANT NOTICE') ||
    lower.includes('deprecated') ||
    lower.includes('pollinations legacy') ||
    s.startsWith('⚠')
  );
};

const stripWrapping = (raw: string): string => {
  return raw.trim().replace(/^["«]+|["»]+$/g, '').trim();
};

let geminiInstance: GoogleGenAI | null = null;
const getGemini = () => {
  if (!geminiInstance && typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    geminiInstance = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
  }
  return geminiInstance;
};

async function correctViaPollinations(text: string): Promise<string | null> {
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: `${SYSTEM_PROMPT}\n\nТекст: ${text}` },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) return null;
    if (looksLikeDeprecationNotice(content)) return null;
    const cleaned = stripWrapping(content);
    return cleaned || null;
  } catch (err) {
    console.warn('Pollinations correction failed', err);
    return null;
  }
}

async function correctViaLanguageTool(
  text: string,
  language: string,
): Promise<{ text: string; matches: CorrectionSuggestion[] } | null> {
  try {
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text, language }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const matches: CorrectionSuggestion[] = Array.isArray(data?.matches) ? data.matches : [];
    let correctedText = text;
    let offset = 0;
    for (const match of matches) {
      if (match.replacements && match.replacements.length > 0) {
        const replacement = match.replacements[0].value;
        const start = match.offset + offset;
        const end = start + match.length;
        correctedText = correctedText.slice(0, start) + replacement + correctedText.slice(end);
        offset += replacement.length - match.length;
      }
    }
    return { text: correctedText, matches };
  } catch (err) {
    console.warn('LanguageTool correction failed', err);
    return null;
  }
}

async function correctViaGemini(text: string): Promise<string | null> {
  const ai = getGemini();
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.4 },
    });
    const out = stripWrapping(response.text || '');
    return out || null;
  } catch (err) {
    console.warn('Gemini correction failed', err);
    return null;
  }
}

// Основная функция исправления текста.
// Возвращает correctedText, провайдера, и (для LanguageTool) список найденных проблем.
export async function correctText(text: string, language: string = 'auto'): Promise<CorrectionResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { matches: [], correctedText: text, hasErrors: false, provider: 'none' };
  }

  // 1) Pollinations
  const pollResult = await correctViaPollinations(trimmed);
  if (pollResult && pollResult !== trimmed) {
    return {
      matches: [],
      correctedText: pollResult,
      hasErrors: true,
      provider: 'pollinations',
    };
  }

  // 2) LanguageTool
  const ltResult = await correctViaLanguageTool(trimmed, language);
  if (ltResult) {
    return {
      matches: ltResult.matches,
      correctedText: ltResult.text,
      hasErrors: ltResult.matches.length > 0,
      provider: 'languagetool',
    };
  }

  // 3) Gemini
  const geminiResult = await correctViaGemini(trimmed);
  if (geminiResult && geminiResult !== trimmed) {
    return {
      matches: [],
      correctedText: geminiResult,
      hasErrors: true,
      provider: 'gemini',
    };
  }

  // Ничего не сработало — возвращаем исходник
  return {
    matches: [],
    correctedText: text,
    hasErrors: false,
    provider: 'none',
  };
}

// Функция для определения языка текста
export function detectLanguage(text: string): string {
  // Простая эвристика для определения языка
  const russianChars = /[а-яё]/i;
  const englishChars = /[a-z]/i;

  const russianCount = (text.match(russianChars) || []).length;
  const englishCount = (text.match(englishChars) || []).length;

  if (russianCount > englishCount) {
    return 'ru';
  } else if (englishCount > 0) {
    return 'en';
  }

  return 'auto';
}
