import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { saveLanguagePreference, getLanguagePreference } from '../services/languageService';

interface UseLanguageSelectionReturn {
  selectedLanguage: string | null;
  proficiencyLevel: string | null;
  isLoading: boolean;
  error: Error | null;
  setLanguagePreference: (language: string, proficiency: string) => Promise<void>;
}

export const useLanguageSelection = (): UseLanguageSelectionReturn => {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [proficiencyLevel, setProficiencyLevel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLanguagePreference = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const preference = await getLanguagePreference(user.uid);
        if (preference) {
          setSelectedLanguage(preference.language);
          setProficiencyLevel(preference.proficiencyLevel);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguagePreference();
  }, [user]);

  const setLanguagePreference = async (language: string, proficiency: string) => {
    if (!user) {
      throw new Error('User must be authenticated to set language preference');
    }

    setIsLoading(true);
    try {
      await saveLanguagePreference(user.uid, language, proficiency);
      setSelectedLanguage(language);
      setProficiencyLevel(proficiency);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    selectedLanguage,
    proficiencyLevel,
    isLoading,
    error,
    setLanguagePreference,
  };
}; 