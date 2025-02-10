import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, ProgressBar, useTheme } from 'react-native-paper';
import { fileService, FileUploadProgress } from '../services/file';
import * as DocumentPicker from 'expo-document-picker';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError: (error: Error) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
}) => {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);

  const handleFilePick = async () => {
    try {
      const result = await fileService.pickEPUB();
      
      if (!result.canceled) {
        await handleFileUpload(result);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleFileUpload = async (file: DocumentPicker.DocumentPickerResult) => {
    if (file.canceled) return;

    try {
      setUploading(true);
      
      // Validate file
      const isValid = await fileService.validateEPUB(file.assets[0].uri);
      if (!isValid) {
        Alert.alert('Invalid File', 'Please select a valid EPUB file (max 50MB)');
        return;
      }

      // Generate storage path
      const timestamp = Date.now();
      const path = `books/${timestamp}_${file.assets[0].name}`;

      // Upload file
      const url = await fileService.uploadFile(
        file.assets[0].uri,
        path,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      onUploadComplete(url);
    } catch (error) {
      console.error('Error uploading file:', error);
      onUploadError(error instanceof Error ? error : new Error('Upload failed'));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={handleFilePick}
        disabled={uploading}
        style={styles.button}
      >
        Select EPUB File
      </Button>

      {uploading && uploadProgress && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Uploading: {Math.round(uploadProgress.progress * 100)}%
          </Text>
          <ProgressBar
            progress={uploadProgress.progress}
            style={styles.progressBar}
            color={theme.colors.primary}
          />
          <Text style={styles.progressDetails}>
            {(uploadProgress.bytesTransferred / 1024 / 1024).toFixed(2)} MB / 
            {(uploadProgress.totalBytes / 1024 / 1024).toFixed(2)} MB
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressDetails: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.7,
  },
}); 