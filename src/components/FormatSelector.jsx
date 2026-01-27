import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FormatSelector = ({ selectedFormat, onFormatChange, exportType }) => {
  const formats = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'Comma-separated values, best for spreadsheets',
      icon: '📊',
      extensions: ['.csv']
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Portable Document Format, best for printing',
      icon: '📄',
      extensions: ['.pdf']
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'JavaScript Object Notation, best for developers',
      icon: '🔧',
      extensions: ['.json']
    },
    {
      id: 'google_sheets',
      name: 'Google Sheets',
      description: 'Direct upload to Google Sheets',
      icon: '📈',
      extensions: []
    }
  ];

  const getFormatsForType = (type) => {
    switch (type) {
      case 'scanHistory':
        return formats;
      case 'productInfo':
        return formats.filter(f => f.id !== 'google_sheets');
      case 'inventory':
        return formats;
      default:
        return formats;
    }
  };

  const availableFormats = getFormatsForType(exportType);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Export Format</Text>
      <View style={styles.formatsGrid}>
        {availableFormats.map(format => (
          <TouchableOpacity
            key={format.id}
            style={[
              styles.formatCard,
              selectedFormat === format.id && styles.selectedFormat
            ]}
            onPress={() => onFormatChange(format.id)}
          >
            <Text style={styles.formatIcon}>{format.icon}</Text>
            <Text style={styles.formatName}>{format.name}</Text>
            <Text style={styles.formatDescription}>{format.description}</Text>
            {format.extensions.length > 0 && (
              <Text style={styles.formatExtensions}>
                {format.extensions.join(', ')}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  formatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  formatCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFormat: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  formatIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  formatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  formatDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  formatExtensions: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
});

export default FormatSelector;