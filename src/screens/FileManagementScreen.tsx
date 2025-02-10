import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, IconButton, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { FileUpload } from '../components/FileUpload';
import { fileService } from '../services/file';
import { removeUploadedFile, setError } from '../store/slices/fileSlice';

export const FileManagementScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { uploadedFiles, error } = useSelector((state: RootState) => state.file);

  const handleUploadComplete = (url: string) => {
    // Handle successful upload
    console.log('File uploaded:', url);
  };

  const handleUploadError = (error: Error) => {
    dispatch(setError(error.message));
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const file = uploadedFiles[fileId];
      if (file) {
        await fileService.deleteFile(`books/${fileId}`);
        dispatch(removeUploadedFile(fileId));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      dispatch(setError(error instanceof Error ? error.message : 'Failed to delete file'));
    }
  };

  const renderFileItem = ({ item: [id, file] }: { item: [string, typeof uploadedFiles[string]] }) => (
    <Card style={styles.fileCard}>
      <Card.Title
        title={file.name}
        subtitle={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
        right={(props) => (
          <IconButton
            {...props}
            icon="delete"
            onPress={() => handleDeleteFile(id)}
          />
        )}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      <FileUpload
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <Text style={styles.sectionTitle}>Uploaded Files</Text>
      
      <FlatList
        data={Object.entries(uploadedFiles)}
        renderItem={renderFileItem}
        keyExtractor={([id]) => id}
        style={styles.fileList}
        contentContainerStyle={styles.fileListContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No files uploaded yet</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    marginVertical: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  fileList: {
    flex: 1,
  },
  fileListContent: {
    paddingBottom: 16,
  },
  fileCard: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 32,
  },
}); 