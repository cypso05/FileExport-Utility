import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProgressIndicator = ({ progress }) => {
  if (!progress) return null;

  const { current, total, status, error } = progress;
  const percentage = total > 0 ? (current / total) * 100 : 0;

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>❌ Export Failed</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressHeader}>
        <Text style={styles.statusText}>{status || 'Exporting...'}</Text>
        <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { width: `${percentage}%` }
          ]} 
        />
      </View>
      
      <Text style={styles.progressText}>
        {current} of {total} items processed
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  errorContainer: {
    backgroundColor: '#ffeaea',
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4444',
    marginBottom: 4,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
  },
});

export default ProgressIndicator;