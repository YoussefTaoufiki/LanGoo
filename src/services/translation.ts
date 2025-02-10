import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config/env';

interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
}

interface TranslationResponse {
  translation: string;
  explanation: string;
  etymology: string;
  examples: string[];
  synonyms: string[];
  error?: string;
}

interface CachedTranslation extends TranslationRequest {
  translatedText: string;
  timestamp: number;
}

export interface SavedTranslation {
  text: string;
  translation: string;
  timestamp: number;
}

const CACHE_KEY = '@translations';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const getOpenAIKey = () => {
  return config.openai.apiKey;
};

const getCachedTranslation = async (request: TranslationRequest): Promise<string | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEY);
    if (!cachedData) return null;

    const translations: CachedTranslation[] = JSON.parse(cachedData);
    const now = Date.now();

    // Find matching translation that hasn't expired
    const match = translations.find(
      (t) =>
        t.text === request.text &&
        t.fromLanguage === request.fromLanguage &&
        t.toLanguage === request.toLanguage &&
        now - t.timestamp < CACHE_EXPIRY
    );

    return match?.translatedText || null;
  } catch (error) {
    console.error('Error reading from translation cache:', error);
    return null;
  }
};

const cacheTranslation = async (
  request: TranslationRequest,
  translatedText: string
): Promise<void> => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEY);
    const translations: CachedTranslation[] = cachedData ? JSON.parse(cachedData) : [];

    // Remove expired entries
    const now = Date.now();
    const filtered = translations.filter((t) => now - t.timestamp < CACHE_EXPIRY);

    // Add new translation
    filtered.push({
      ...request,
      translatedText,
      timestamp: now,
    });

    // Store updated cache
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error caching translation:', error);
  }
};

const translateWithOpenAI = async (request: TranslationRequest): Promise<string> => {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text from ${request.fromLanguage} to ${request.toLanguage}. Provide only the translation without any additional context or explanation.`,
        },
        {
          role: 'user',
          content: request.text,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
};

export const translate = async (
  request: TranslationRequest
): Promise<TranslationResponse> => {
  try {
    // Check cache first
    const cachedTranslation = await getCachedTranslation(request);
    if (cachedTranslation) {
      return {
        translation: cachedTranslation,
        explanation: 'This is a cached translation.',
        etymology: 'This is a cached etymology.',
        examples: ['This is a cached example.', 'This is another cached example.'],
        synonyms: ['cached1', 'cached2', 'cached3', 'cached4'],
      };
    }

    // If not in cache, translate with OpenAI
    const translatedText = await translateWithOpenAI(request);

    // Cache the result
    await cacheTranslation(request, translatedText);

    return {
      translation: translatedText,
      explanation: 'This is a detailed explanation of the word or phrase, including its usage and context.',
      etymology: 'The historical origin and development of this word can be traced back to...',
      examples: [
        'Here is an example sentence using this word.',
        'Another context where this word is commonly used.',
        'A third example showing different usage.',
      ],
      synonyms: [
        'similar1',
        'similar2',
        'similar3',
        'similar4',
      ],
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      translation: request.text,
      explanation: 'Translation service temporarily unavailable.',
      etymology: 'Translation service error.',
      examples: [],
      synonyms: [],
      error: 'Failed to translate text. Please try again.',
    };
  }
};

export const getEnhancedTranslation = async (
  request: TranslationRequest
): Promise<TranslationResponse> => {
  try {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a language learning assistant. Analyze the following text in ${request.fromLanguage} and provide:
              1. Translation in ${request.toLanguage}
              2. Detailed explanation of meaning and usage
              3. Etymology and word origin
              4. Example sentences
              5. Synonyms or related words
              
              Format the response as a JSON object with these fields:
              {
                "translation": "string",
                "explanation": "string",
                "etymology": "string",
                "examples": ["string"],
                "synonyms": ["string"]
              }`,
          },
          {
            role: 'user',
            content: request.text,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content.trim());

    return {
      translation: result.translation || request.text,
      explanation: result.explanation || 'No explanation available.',
      etymology: result.etymology || 'No etymology information available.',
      examples: result.examples || [],
      synonyms: result.synonyms || [],
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      translation: request.text,
      explanation: 'Translation service temporarily unavailable.',
      etymology: 'Etymology information unavailable.',
      examples: [],
      synonyms: [],
      error: 'Failed to get enhanced translation. Please try again.',
    };
  }
};

export const getSavedTranslations = async (bookId: string): Promise<SavedTranslation[]> => {
  try {
    const key = `@saved_translations_${bookId}`;
    const saved = await AsyncStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error getting saved translations:', error);
    return [];
  }
};

export const saveTranslation = async (bookId: string, translation: SavedTranslation): Promise<void> => {
  try {
    const key = `@saved_translations_${bookId}`;
    const saved = await getSavedTranslations(bookId);
    const updated = [translation, ...saved];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving translation:', error);
    throw error;
  }
}; 