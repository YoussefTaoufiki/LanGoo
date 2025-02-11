import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface LanguagePreference {
  language: string;
  proficiencyLevel: string;
  updatedAt: Date;
}

export const saveLanguagePreference = async (
  userId: string,
  language: string,
  proficiencyLevel: string
): Promise<void> => {
  try {
    const userPreferenceRef = doc(firestore, 'users', userId, 'preferences', 'language');
    await setDoc(userPreferenceRef, {
      language,
      proficiencyLevel,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error saving language preference:', error);
    throw error;
  }
};

export const getLanguagePreference = async (
  userId: string
): Promise<LanguagePreference | null> => {
  try {
    const userPreferenceRef = doc(firestore, 'users', userId, 'preferences', 'language');
    const docSnap = await getDoc(userPreferenceRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as LanguagePreference;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting language preference:', error);
    throw error;
  }
}; 