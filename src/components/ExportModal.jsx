import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  TextInput,
  Switch
} from 'react-native';
import { useHistory } from "../../../contexts/useHistory";
import FormatSelector from './FormatSelector';
import ExportButton from './ExportButton';
import ProgressIndicator from './ProgressIndicator';

const ExportModal = ({ 
  visible, 
  onClose, 
  data, 
  onExport,
  exportType = 'scanHistory'
}) => {
  const { history, getHistoryByType } = useHistory();
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [options, setOptions] = useState({
    includeTimestamps: true,
    includeProductInfo: true,
    compressFiles: false,
    customFileName: '',
    sendEmail: false,
    emailAddress: '',
    autoUpload: false
  });
  const [exportProgress, setExportProgress] = useState(null);

  // Get the data to export based on exportType
  const getExportData = () => {
    if (exportType === 'scanHistory') {
      return history; // Use all history
    } else if (exportType === 'ocrScans') {
      return getHistoryByType('ocr_scan'); // Only OCR scans
    } else if (exportType === 'qrCodes') {
      return getHistoryByType('qr_code'); // Only QR codes
    } else {
      return data || []; // Use provided data or empty array
    }
  };

  const exportData = getExportData();

  const handleExport = async () => {
    if (exportData.length === 0) {
      alert('No data to export!');
      return;
    }

    setExportProgress({ current: 0, total: 100, status: 'Preparing...' });
    
    try {
      await onExport(exportData, selectedFormat, options, (progress) => {
        setExportProgress(progress);
      });
      
      // Show success message
      alert(`✅ Successfully exported ${exportData.length} items!`);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress({ error: error.message });
      alert('❌ Export failed. Please try again.');
    } finally {
      setTimeout(() => setExportProgress(null), 3000);
    }
  };

  const updateOption = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  // Get display name for export type
  const getExportTypeDisplayName = () => {
    switch (exportType) {
      case 'scanHistory': return 'Scan History';
      case 'ocrScans': return 'OCR Scans';
      case 'qrCodes': return 'QR Codes';
      default: return 'Data';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Export {getExportTypeDisplayName()}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <FormatSelector
            selectedFormat={selectedFormat}
            onFormatChange={setSelectedFormat}
            exportType={exportType}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Export Options</Text>
            
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Include Timestamps</Text>
              <Switch
                value={options.includeTimestamps}
                onValueChange={(value) => updateOption('includeTimestamps', value)}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Include Metadata</Text>
              <Switch
                value={options.includeProductInfo}
                onValueChange={(value) => updateOption('includeProductInfo', value)}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Compress Files</Text>
              <Switch
                value={options.compressFiles}
                onValueChange={(value) => updateOption('compressFiles', value)}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Auto-upload to Cloud</Text>
              <Switch
                value={options.autoUpload}
                onValueChange={(value) => updateOption('autoUpload', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Custom File Name</Text>
              <TextInput
                style={styles.textInput}
                value={options.customFileName}
                onChangeText={(text) => updateOption('customFileName', text)}
                placeholder={`${exportType}_${new Date().toISOString().split('T')[0]}`}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Send via Email</Text>
              <Switch
                value={options.sendEmail}
                onValueChange={(value) => updateOption('sendEmail', value)}
              />
            </View>

            {options.sendEmail && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={options.emailAddress}
                  onChangeText={(text) => updateOption('emailAddress', text)}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}
          </View>

          {exportProgress && (
            <ProgressIndicator progress={exportProgress} />
          )}

          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Export Preview</Text>
            <Text style={styles.previewText}>
              Exporting {exportData.length} {getExportTypeDisplayName().toLowerCase()} items as {selectedFormat.toUpperCase()}
            </Text>
            <Text style={styles.previewText}>
              File: {options.customFileName || `${exportType}_${new Date().toISOString().split('T')[0]}.${selectedFormat}`}
            </Text>
            {options.sendEmail && (
              <Text style={styles.previewText}>
                Will be sent to: {options.emailAddress || 'No email specified'}
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <ExportButton
            title="Cancel"
            variant="outline"
            onPress={onClose}
          />
          <ExportButton
            title={`Export ${exportData.length} Items`}
            variant="primary"
            onPress={handleExport}
            loading={exportProgress && !exportProgress.error}
            disabled={exportProgress && !exportProgress.error || exportData.length === 0}
            icon="📤"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  optionLabel: {
    fontSize: 16,
    flex: 1,
  },
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  preview: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
});

export default ExportModal;