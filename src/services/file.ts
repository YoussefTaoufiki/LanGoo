import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';

export interface FileUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  uri: string;
  lastModified?: number;
}

class FileService {
  private storage = storage();

  /**
   * Pick an EPUB file from device
   */
  async pickEPUB(): Promise<DocumentPicker.DocumentPickerResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
        copyToCacheDirectory: true,
      });

      if ('canceled' in result && !result.canceled) {
        return result;
      }
      throw new Error('File picking cancelled');
    } catch (error) {
      console.error('Error picking file:', error);
      throw error;
    }
  }

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(
    uri: string,
    path: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<string> {
    try {
      const reference = this.storage.ref(path);
      
      // For Android, we need to replace 'file://' with actual path
      const filePath = Platform.OS === 'android' ? uri.replace('file://', '') : uri;
      
      const task = reference.putFile(filePath);

      // Monitor upload progress
      if (onProgress) {
        task.on('state_changed', (snapshot: { bytesTransferred: number; totalBytes: number }) => {
          const progress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: snapshot.bytesTransferred / snapshot.totalBytes
          };
          onProgress(progress);
        });
      }

      // Wait for upload to complete
      await task;

      // Get download URL
      const url = await reference.getDownloadURL();
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Download file from Firebase Storage
   */
  async downloadFile(
    url: string,
    localPath: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<string> {
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localPath,
        {},
        (downloadProgress) => {
          if (onProgress) {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            onProgress({
              bytesTransferred: downloadProgress.totalBytesWritten,
              totalBytes: downloadProgress.totalBytesExpectedToWrite,
              progress
            });
          }
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error('Download failed');
      return result.uri;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Validate EPUB file
   */
  async validateEPUB(uri: string): Promise<boolean> {
    try {
      // Check file extension
      if (!uri.toLowerCase().endsWith('.epub')) {
        return false;
      }

      // Check file size (max 50MB)
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size > 50 * 1024 * 1024) {
        return false;
      }

      // TODO: Add more validation (check EPUB structure, etc.)
      
      return true;
    } catch (error) {
      console.error('Error validating EPUB:', error);
      return false;
    }
  }

  /**
   * Delete file from Firebase Storage
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const reference = this.storage.ref(path);
      await reference.delete();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from Firebase Storage
   */
  async getFileMetadata(path: string): Promise<FileMetadata | null> {
    try {
      const reference = this.storage.ref(path);
      const metadata = await reference.getMetadata();
      const downloadUrl = await reference.getDownloadURL();
      
      return {
        name: metadata.name || '',
        size: metadata.size || 0,
        type: metadata.contentType || 'application/epub+zip',
        uri: downloadUrl,
        lastModified: metadata.timeCreated ? new Date(metadata.timeCreated).getTime() : undefined
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }
}

export const fileService = new FileService(); 