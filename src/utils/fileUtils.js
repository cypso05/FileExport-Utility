import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Save text content to a file on the device.
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 * @returns {Promise<string>} File URI
 */
export const saveFileToDevice = async (content, filename) => {
  try {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return fileUri;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error(`Failed to save file: ${error.message}`);
  }
};

/**
 * Share a file using the system share dialog.
 * @param {string} fileUri - URI of the file to share
 * @param {string} [mimeType] - Optional MIME type for iOS (UTI)
 * @param {string} [dialogTitle] - Optional share dialog title
 * @returns {Promise<boolean>}
 */
export const shareFile = async (fileUri, mimeType = undefined, dialogTitle = 'Share File') => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) throw new Error('Sharing is not available on this device');

    // mimeType is used only for iOS UTI, safe to leave undefined on Android
    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle,
      UTI: mimeType, // iOS-specific
    });

    return true;
  } catch (error) {
    console.error('Error sharing file:', error);
    throw new Error(`Failed to share file: ${error.message}`);
  }
};

/**
 * Get information about a file.
 * @param {string} fileUri - File URI
 * @returns {Promise<object>} File info
 */
export const getFileInfo = async (fileUri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) throw new Error('File does not exist');

    return {
      uri: fileInfo.uri,
      size: fileInfo.size,
      exists: fileInfo.exists,
      isDirectory: fileInfo.isDirectory,
      modificationTime: fileInfo.modificationTime,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

/**
 * Mock compression of files (replace with real implementation if needed).
 * @param {Array} files - Array of file objects with uri and size
 * @param {object} options - Optional compression options
 * @returns {Promise<object>}
 */
export const compressFiles = async (files, options = {}) => {
  console.log('Compressing files:', files.length, options);

  return {
    compressedUri: files[0]?.uri, // Replace with actual zip file in real implementation
    originalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
    compressedSize: files.reduce((sum, f) => sum + (f.size || 0), 0) * 0.8, // Mock 20% compression
    compressionRatio: 0.8,
  };
};

/**
 * Generate a simple hash for a file (for identification purposes).
 * @param {string} fileUri - File URI
 * @returns {Promise<string>} Hash string
 */
export const generateFileHash = async (fileUri) => {
  try {
    const fileInfo = await getFileInfo(fileUri);
    if (!fileInfo.exists) throw new Error('File does not exist');

    const content = await FileSystem.readAsStringAsync(fileUri);
    let hash = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  } catch (error) {
    console.error('Error generating file hash:', error);
    throw new Error(`Failed to generate file hash: ${error.message}`);
  }
};

/**
 * Delete temporary files.
 * @param {Array<string>} fileUris - List of file URIs
 * @returns {Promise<object>} Summary of deletion
 */
export const cleanupTempFiles = async (fileUris) => {
  try {
    const deletePromises = fileUris.map(uri => FileSystem.deleteAsync(uri, { idempotent: true }));
    await Promise.all(deletePromises);

    return { deleted: fileUris.length, errors: [] };
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    throw new Error(`Failed to clean up temporary files: ${error.message}`);
  }
};

/**
 * Validate file size against a maximum limit (in MB)
 * @param {string} fileUri - File URI
 * @param {number} maxSizeMB - Maximum allowed size in MB
 * @returns {Promise<boolean>}
 */
export const validateFileSize = async (fileUri, maxSizeMB = 50) => {
  const info = await getFileInfo(fileUri);
  const sizeMB = info.size / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    throw new Error(`File size (${sizeMB.toFixed(50)}MB) exceeds maximum allowed (${maxSizeMB}MB)`);
  }

  return true;
};
