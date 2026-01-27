import { useState, useCallback } from 'react';
import { csvExportService } from '../services/csvExportService';
import { pdfExportService } from '../services/pdfExportService';
import { googleSheetsService } from '../services/googleSheetsService';
import { emailExportService } from '../services/emailExportService';
import { formatDataForExport } from '../utils/exportFormatters';

// Web-safe defaults
let Alert = { alert: (title, msg) => window.alert(`${title}\n${msg}`) };
let Platform = { OS: 'web' };
let saveFile = null;
let shareFile = null;

// Detect React Native environment
const isNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// Safe dynamic imports for native-only modules using string literals
const loadNativeModules = async () => {
  if (!isNative) return;

  try {
    // Use eval to avoid static analysis
    const RN = await new Function('return import("react-native")')();
    Alert = RN.Alert;
    Platform = RN.Platform;
  } catch (error) {
    console.warn('React Native module not available:', error);
  }

  try {
    // Use dynamic import with template literal to avoid static analysis
    const moduleName = 'expo-file-system';
    const FS = await import(/* @vite-ignore */ moduleName);
    saveFile = async (content, fileName) => {
      const fileUri = `${FS.documentDirectory}${fileName}`;
      await FS.writeAsStringAsync(fileUri, content, { encoding: FS.EncodingType.UTF8 });
      return fileUri;
    };
  } catch (error) {
    console.warn('Expo FileSystem module not available:', error);
  }

  try {
    const moduleName = 'expo-sharing';
    const S = await import(/* @vite-ignore */ moduleName);
    shareFile = async (uri, mimeType, title) => {
      await S.shareAsync(uri, { mimeType, dialogTitle: title });
    };
  } catch (error) {
    console.warn('Expo Sharing module not available:', error);
  }
};

// Load native modules on initialization
if (isNative) {
  loadNativeModules();
}

// Web fallback - define this immediately
if (!saveFile) {
  saveFile = async (content, fileName) => {
    // For web environment
    if (typeof document !== 'undefined') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return null;
    }
    // For Node.js or other environments
    console.warn('Save file not implemented for current environment');
    return null;
  };
}

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);

  const updateProgress = useCallback((current, total, status) => {
    setExportProgress({ current, total, status, percentage: total ? (current / total) * 100 : 0 });
  }, []);

  const handleAutoUpload = useCallback(async (fileUri) => {
    // Placeholder: implement cloud uploads here (Google Drive, Dropbox, etc.)
    console.log('Auto-uploading file:', fileUri);
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(async (data, options = {}, progressCallback = updateProgress) => {
    if (!saveFile) {
      throw new Error('Save file functionality not available');
    }

    progressCallback(1, data.length, 'Generating CSV...');
    const csvContent = await csvExportService.generateCSV(data, options);
    const fileName = options.customFileName || `export_${Date.now()}.csv`;

    progressCallback(2, data.length, 'Saving file...');
    const fileUri = await saveFile(csvContent, fileName);

    if (Platform.OS !== 'web' && shareFile && fileUri) {
      await shareFile(fileUri, 'text/csv', 'Share CSV Export');
    } else if (Platform.OS === 'web') {
      // Already handled by saveFile
    }

    return { fileUri, format: 'csv', size: csvContent.length };
  }, [updateProgress]);

  // Export to PDF
  const exportToPDF = useCallback(async (data, options = {}, progressCallback = updateProgress) => {
    progressCallback(1, data.length, 'Generating PDF...');
    const pdfUri = await pdfExportService.generatePDF(data, options, (progress) => {
      progressCallback(progress.current, progress.total, progress.status);
    });

    if (Platform.OS !== 'web' && shareFile && pdfUri) {
      await shareFile(pdfUri, 'application/pdf', 'Share PDF Export');
    }

    return { fileUri: pdfUri, format: 'pdf' };
  }, [updateProgress]);

  // Export to JSON
  const exportToJSON = useCallback(async (data, options = {}, progressCallback = updateProgress) => {
    if (!saveFile) {
      throw new Error('Save file functionality not available');
    }

    progressCallback(1, data.length, 'Generating JSON...');
    const jsonContent = JSON.stringify(data, null, 2);
    const fileName = options.customFileName || `export_${Date.now()}.json`;

    progressCallback(2, data.length, 'Saving file...');
    const fileUri = await saveFile(jsonContent, fileName);

    if (Platform.OS !== 'web' && shareFile && fileUri) {
      await shareFile(fileUri, 'application/json', 'Share JSON Export');
    }

    return { fileUri, format: 'json', size: jsonContent.length };
  }, [updateProgress]);

  // Export to Google Sheets
  const exportToGoogleSheets = useCallback(async (data, options = {}, progressCallback = updateProgress) => {
    progressCallback(1, data.length, 'Connecting to Google Sheets...');
    const result = await googleSheetsService.uploadToSheets(data, options, (progress) => {
      progressCallback(progress.current, progress.total, progress.status);
    });

    return {
      fileUri: result.spreadsheetUrl,
      format: 'google_sheets',
      spreadsheetId: result.spreadsheetId,
    };
  }, [updateProgress]);

  // Main export function
  const exportData = useCallback(
    async (data, format, options = {}) => {
      setIsExporting(true);
      setExportProgress({ current: 0, total: data.length, status: 'Starting export...' });

      try {
        // Format data first
        updateProgress(0, data.length, 'Formatting data...');
        const formattedData = formatDataForExport(data, options);

        let result;
        switch (format) {
          case 'csv':
            result = await exportToCSV(formattedData, options, updateProgress);
            break;
          case 'pdf':
            result = await exportToPDF(formattedData, options, updateProgress);
            break;
          case 'json':
            result = await exportToJSON(formattedData, options, updateProgress);
            break;
          case 'google_sheets':
            result = await exportToGoogleSheets(formattedData, options, updateProgress);
            break;
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }

        // Email if requested
        if (options.sendEmail && options.emailAddress) {
          updateProgress(data.length, data.length, 'Sending email...');
          await emailExportService.sendExportEmail(result.fileUri, options.emailAddress, format, data.length);
        }

        // Auto-upload if requested
        if (options.autoUpload) {
          updateProgress(data.length, data.length, 'Uploading to cloud...');
          await handleAutoUpload(result.fileUri);
        }

        updateProgress(data.length, data.length, 'Export completed!');
        
        // Use the Alert system that's been set up
        if (Alert && Alert.alert) {
          Alert.alert('Export Successful', `Your data has been exported as ${format.toUpperCase()}`);
        } else {
          console.log('Export Successful', `Your data has been exported as ${format.toUpperCase()}`);
        }

        return result;
      } catch (error) {
        console.error('Export error:', error);
        setExportProgress({ error: error.message });
        
        if (Alert && Alert.alert) {
          Alert.alert('Export Failed', error.message);
        } else {
          console.error('Export Failed', error.message);
        }
        throw error;
      } finally {
        setIsExporting(false);
        setTimeout(() => setExportProgress(null), 2000);
      }
    },
    [updateProgress, exportToCSV, exportToPDF, exportToJSON, exportToGoogleSheets, handleAutoUpload]
  );

  return {
    exportData,
    isExporting,
    exportProgress,
    resetExport: () => setExportProgress(null),
  };
};