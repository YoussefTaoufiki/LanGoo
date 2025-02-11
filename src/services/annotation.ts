import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '../config/firebase.web';

const auth = getAuth(app);
const db = getFirestore(app);

export interface Annotation {
  id: string;
  userId: string;
  bookId: string;
  chapterId: string;
  text: string;
  note: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export const addAnnotation = async (annotation: Omit<Annotation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Annotation> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const newAnnotation: Annotation = {
      ...annotation,
      id: Math.random().toString(36).substring(7), // Generate a unique ID
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const annotationRef = doc(collection(db, 'annotations'));
    await setDoc(annotationRef, newAnnotation);

    return newAnnotation;
  } catch (error) {
    console.error('Error adding annotation:', error);
    throw error;
  }
};

export const getAnnotations = async (bookId: string, chapterId: string): Promise<Annotation[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const annotationsRef = collection(db, 'annotations');
    const q = query(
      annotationsRef,
      where('userId', '==', user.uid),
      where('bookId', '==', bookId),
      where('chapterId', '==', chapterId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Annotation);
  } catch (error) {
    console.error('Error getting annotations:', error);
    throw error;
  }
};

export const updateAnnotation = async (annotationId: string, updates: Partial<Annotation>): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const annotationRef = doc(db, 'annotations', annotationId);
    const annotationDoc = await getDoc(annotationRef);

    if (!annotationDoc.exists()) {
      throw new Error('Annotation not found');
    }

    const annotation = annotationDoc.data() as Annotation;
    if (annotation.userId !== user.uid) {
      throw new Error('Not authorized to update this annotation');
    }

    await setDoc(annotationRef, {
      ...annotation,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating annotation:', error);
    throw error;
  }
};

export const deleteAnnotation = async (annotationId: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const annotationRef = doc(db, 'annotations', annotationId);
    const annotationDoc = await getDoc(annotationRef);

    if (!annotationDoc.exists()) {
      throw new Error('Annotation not found');
    }

    const annotation = annotationDoc.data() as Annotation;
    if (annotation.userId !== user.uid) {
      throw new Error('Not authorized to delete this annotation');
    }

    await deleteDoc(annotationRef);
  } catch (error) {
    console.error('Error deleting annotation:', error);
    throw error;
  }
};

export const getAnnotationsByChapter = async (bookId: string, chapterId: string): Promise<Annotation[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const annotationsRef = collection(db, 'annotations');
    const q = query(
      annotationsRef,
      where('userId', '==', user.uid),
      where('bookId', '==', bookId),
      where('chapterId', '==', chapterId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Annotation);
  } catch (error) {
    console.error('Error getting chapter annotations:', error);
    throw error;
  }
};

export const exportAnnotations = async (bookId: string): Promise<string> => {
  try {
    const annotations = await getAnnotations(bookId, '');
    const exportData = annotations.map(annotation => ({
      text: annotation.text,
      note: annotation.note,
      createdAt: new Date(annotation.createdAt).toISOString(),
    }));

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting annotations:', error);
    throw error;
  }
}; 