import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';
import { firebaseAuth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EPUBMetadata {
  title: string;
  author: string;
  description?: string;
  language?: string;
  publisher?: string;
  publicationDate?: string;
  rights?: string;
  identifier?: string;
}

export interface EPUBFile {
  name: string;
  path: string;
  metadata?: EPUBMetadata;
  lastRead?: string;
  progress?: number;
}

export interface ReadingProgress {
  bookId: string;
  location: string;
  percentage: number;
  lastRead: Date;
}

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'justify';
  theme: 'light' | 'dark' | 'sepia';
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing: number;
  marginHorizontal: number;
}

export const getEPUBMetadata = async (filePath: string): Promise<EPUBMetadata> => {
  try {
    // Create a temporary directory for extraction
    const tempDir = `${RNFS.CachesDirectoryPath}/epub_temp_${Date.now()}`;
    await RNFS.mkdir(tempDir);

    // Extract EPUB file
    await RNFS.copyFile(filePath, `${tempDir}/book.epub`);
    await unzip(`${tempDir}/book.epub`, tempDir);

    // Read container.xml to find OPF file location
    const containerXml = await RNFS.readFile(`${tempDir}/META-INF/container.xml`, 'utf8');
    const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
    
    if (!opfPath) {
      throw new Error('Could not find OPF file path');
    }

    // Read OPF file
    const opfContent = await RNFS.readFile(`${tempDir}/META-INF/${opfPath}`, 'utf8');
    
    // Parse metadata
    const metadata: EPUBMetadata = {
      title: opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/)?.[1] || 'Unknown Title',
      author: opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/)?.[1] || 'Unknown Author',
      description: opfContent.match(/<dc:description[^>]*>([^<]+)<\/dc:description>/)?.[1],
      language: opfContent.match(/<dc:language[^>]*>([^<]+)<\/dc:language>/)?.[1],
      publisher: opfContent.match(/<dc:publisher[^>]*>([^<]+)<\/dc:publisher>/)?.[1],
      publicationDate: opfContent.match(/<dc:date[^>]*>([^<]+)<\/dc:date>/)?.[1],
      rights: opfContent.match(/<dc:rights[^>]*>([^<]+)<\/dc:rights>/)?.[1],
      identifier: opfContent.match(/<dc:identifier[^>]*>([^<]+)<\/dc:identifier>/)?.[1],
    };

    // Clean up temporary directory
    await RNFS.unlink(tempDir);

    return metadata;
  } catch (error) {
    console.error('Error reading EPUB metadata:', error);
    return {
      title: 'Unknown Title',
      author: 'Unknown Author',
    };
  }
};

export const getUserBooks = async (): Promise<EPUBFile[]> => {
  try {
    const userId = firebaseAuth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const booksDir = `${RNFS.DocumentDirectoryPath}/books/${userId}`;
    const exists = await RNFS.exists(booksDir);
    
    if (!exists) {
      await RNFS.mkdir(booksDir);
      return [];
    }

    const files = await RNFS.readDir(booksDir);
    const epubFiles = files.filter(file => file.name.endsWith('.epub'));

    const books = await Promise.all(
      epubFiles.map(async file => {
        const metadata = await getEPUBMetadata(file.path);
        return {
          name: file.name,
          path: file.path,
          metadata,
        };
      })
    );

    return books;
  } catch (error) {
    console.error('Error getting user books:', error);
    return [];
  }
};

export const saveBook = async (filePath: string, fileName: string): Promise<EPUBFile | null> => {
  try {
    const userId = firebaseAuth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const booksDir = `${RNFS.DocumentDirectoryPath}/books/${userId}`;
    const exists = await RNFS.exists(booksDir);
    
    if (!exists) {
      await RNFS.mkdir(booksDir);
    }

    const newPath = `${booksDir}/${fileName}`;
    await RNFS.copyFile(filePath, newPath);

    const metadata = await getEPUBMetadata(newPath);
    return {
      name: fileName,
      path: newPath,
      metadata,
    };
  } catch (error) {
    console.error('Error saving book:', error);
    return null;
  }
};

export const deleteBook = async (filePath: string): Promise<boolean> => {
  try {
    await RNFS.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting book:', error);
    return false;
  }
};

export const updateBookProgress = async (filePath: string, progress: number): Promise<boolean> => {
  try {
    const userId = firebaseAuth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const progressFile = `${RNFS.DocumentDirectoryPath}/books/${userId}/progress.json`;
    let progressData: Record<string, number> = {};

    try {
      const existingData = await RNFS.readFile(progressFile, 'utf8');
      progressData = JSON.parse(existingData);
    } catch {
      // File doesn't exist or is invalid, start with empty object
    }

    progressData[filePath] = progress;
    await RNFS.writeFile(progressFile, JSON.stringify(progressData), 'utf8');
    return true;
  } catch (error) {
    console.error('Error updating book progress:', error);
    return false;
  }
};

export const getBookProgress = async (filePath: string): Promise<number> => {
  try {
    const userId = firebaseAuth.currentUser?.uid;
    if (!userId) {
      return 0;
    }

    const progressFile = `${RNFS.DocumentDirectoryPath}/books/${userId}/progress.json`;
    const exists = await RNFS.exists(progressFile);
    
    if (!exists) {
      return 0;
    }

    const progressData = await RNFS.readFile(progressFile, 'utf8');
    const progress: Record<string, number> = JSON.parse(progressData);
    return progress[filePath] || 0;
  } catch (error) {
    console.error('Error getting book progress:', error);
    return 0;
  }
};

export const getReadingProgress = async (bookId: string): Promise<ReadingProgress | null> => {
  // TODO: Implement Firebase Firestore integration
  // For now, return mock data
  return {
    bookId,
    location: '0',
    percentage: 0,
    lastRead: new Date(),
  };
};

export const saveReadingProgress = async (progress: ReadingProgress): Promise<void> => {
  // TODO: Implement Firebase Firestore integration
  console.log('Saving reading progress:', progress);
};

export const downloadBook = async (bookId: string): Promise<string> => {
  // TODO: Implement Firebase Storage download
  // For now, return a mock file path
  const booksDir = `${RNFS.DocumentDirectoryPath}/books`;
  const bookPath = `${booksDir}/${bookId}.epub`;

  // Create books directory if it doesn't exist
  if (!(await RNFS.exists(booksDir))) {
    await RNFS.mkdir(booksDir);
  }

  // TODO: Download book from Firebase Storage
  // For now, we'll just check if the file exists
  if (!(await RNFS.exists(bookPath))) {
    throw new Error('Book not found');
  }

  return bookPath;
};

export const getLocalBooks = async (): Promise<string[]> => {
  try {
    const booksDir = `${RNFS.DocumentDirectoryPath}/books`;
    
    // Create books directory if it doesn't exist
    if (!(await RNFS.exists(booksDir))) {
      await RNFS.mkdir(booksDir);
      return [];
    }

    const files = await RNFS.readDir(booksDir);
    return files
      .filter(file => file.name.endsWith('.epub'))
      .map(file => file.name.replace('.epub', ''));
  } catch (error) {
    console.error('Error reading local books:', error);
    return [];
  }
};

export const saveReaderSettings = async (bookId: string, settings: ReaderSettings): Promise<void> => {
  try {
    const key = `@reader_settings_${bookId}`;
    await AsyncStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving reader settings:', error);
    throw error;
  }
};

export const getReaderSettings = async (bookId: string): Promise<ReaderSettings | null> => {
  try {
    const key = `@reader_settings_${bookId}`;
    const settings = await AsyncStorage.getItem(key);
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('Error getting reader settings:', error);
    throw error;
  }
}; 