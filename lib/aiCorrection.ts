// ИИ исправление текста с помощью LanguageTool API
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
}

// Функция для исправления текста
export async function correctText(text: string, language: string = 'auto'): Promise<CorrectionResult> {
  try {
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        language: language,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const matches: CorrectionSuggestion[] = data.matches || [];
    
    // Автоматически применяем исправления
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

    return {
      matches,
      correctedText,
      hasErrors: matches.length > 0,
    };
  } catch (error) {
    console.error('Error correcting text:', error);
    return {
      matches: [],
      correctedText: text,
      hasErrors: false,
    };
  }
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