import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  DocumentData,
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { useLanguageSelection } from './useLanguageSelection';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  level: string;
  description: string;
  totalChapters: number;
  language: string;
}

interface UseBooksReturn {
  books: Book[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useBooks = (): UseBooksReturn => {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { selectedLanguage } = useLanguageSelection();

  const fetchBooks = async () => {
    if (!selectedLanguage) {
      setBooks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const booksQuery = query(
        collection(firestore, 'books'),
        where('language', '==', selectedLanguage),
        orderBy('title')
      );

      const querySnapshot = await getDocs(booksQuery);
      const fetchedBooks: Book[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        fetchedBooks.push({
          id: doc.id,
          title: data.title,
          author: data.author,
          coverUrl: data.coverUrl,
          level: data.level,
          description: data.description,
          totalChapters: data.totalChapters,
          language: data.language,
        });
      });

      setBooks(fetchedBooks);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedLanguage]);

  return {
    books,
    isLoading,
    error,
    refetch: fetchBooks,
  };
}; 