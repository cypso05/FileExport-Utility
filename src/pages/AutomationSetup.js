import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import ExportButton from '../components/ExportButton';
import { useExport } from '../hooks/useExport';

const AutomationSetup = () => {
  const [automations, setAutomations] = useState({
    autoExport: false,
    exportFrequency: 'daily',
    exportFormat: 'csv',
    autoEmail: false,
    emailRecipients: '',
    cloudSync: false,
    cloudService: 'google_drive',
    triggerEvents: {
      onScan: false,
      onBatchComplete: true,
      scheduled: true
    }
  });

  const { exportData, isExporting } = useExport();

  const updateAutomation = (key, value) => {
    setAutomations(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateTriggerEvent = (event, value) => {
    setAutomations(prev => ({
      ...prev,
      triggerEvents: {
        ...prev.triggerEvents,
        [event]: value
      }
    }));
  };

  const handleTestAutomation = async () => {
    // Test with sample data
    const sampleData = [
      {
        id: 'test-1',
        type: 'barcode',
        data: 'TEST123',
        timestamp: new Date(),
        product: null
      }
    ];

    try {
      await exportData(sampleData, automations.exportFormat, {
        includeTimestamps: true,
        includeProductInfo: true,
        sendEmail: automations.autoEmail,
        emailAddress: automations.emailRecipients.split(',')[0] || '',
        autoUpload: automations.cloudSync
      });
    } catch (error) {
      console.error('Test automation failed:', error);
    }
  };

  const saveAutomation = () => {
    // Save automation settings to storage
    console.log('Saving automation settings:', automations);
    // Implement storage save logic
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Export Automation</Text>
      <Text style={styles.subtitle}>
        Set up automatic exports and workflows
      </Text>

      {/* Auto Export Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Automatic Exports</Text>
          <Switch
            value={automations.autoExport}
            onValueChange={(value) => updateAutomation('autoExport', value)}
          />
        </View>

        {automations.autoExport && (
          <View style={styles.sectionContent}>
            <Text style={styles.label}>Export Frequency</Text>
            <View style={styles.optionGroup}>
              {['hourly', 'daily', 'weekly', 'monthly'].map(freq => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.optionButton,
                    automations.exportFrequency === freq && styles.optionButtonSelected
                  ]}
                  onPress={() => updateAutomation('exportFrequency', freq)}
                >
                  <Text style={[
                    styles.optionText,
                    automations.exportFrequency === freq && styles.optionTextSelected
                  ]}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Export Format</Text>
            <View style={styles.optionGroup}>
              {['csv', 'pdf', 'json'].map(format => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.optionButton,
                    automations.exportFormat === format && styles.optionButtonSelected
                  ]}
                  onPress={() => updateAutomation('exportFormat', format)}
                >
                  <Text style={[
                    styles.optionText,
                    automations.exportFormat === format && styles.optionTextSelected
                  ]}>
                    {format.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Trigger Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trigger Events</Text>
        
        <View style={styles.triggerItem}>
          <View>
            <Text style={styles.triggerLabel}>On Each Scan</Text>
            <Text style={styles.triggerDescription}>
              Export immediately after each barcode scan
            </Text>
          </View>
          <Switch
            value={automations.triggerEvents.onScan}
            onValueChange={(value) => updateTriggerEvent('onScan', value)}
          />
        </View>

        <View style={styles.triggerItem}>
          <View>
            <Text style={styles.triggerLabel}>On Batch Complete</Text>
            <Text style={styles.triggerDescription}>
              Export when batch scanning session ends
            </Text>
          </View>
          <Switch
            value={automations.triggerEvents.onBatchComplete}
            onValueChange={(value) => updateTriggerEvent('onBatchComplete', value)}
          />
        </View>

        <View style={styles.triggerItem}>
          <View>
            <Text style={styles.triggerLabel}>Scheduled</Text>
            <Text style={styles.triggerDescription}>
              Export based on defined schedule
            </Text>
          </View>
          <Switch
            value={automations.triggerEvents.scheduled}
            onValueChange={(value) => updateTriggerEvent('scheduled', value)}
          />
        </View>
      </View>

      {/* Email Automation */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Email Automation</Text>
          <Switch
            value={automations.autoEmail}
            onValueChange={(value) => updateAutomation('autoEmail', value)}
          />
        </View>

        {automations.autoEmail && (
          <View style={styles.sectionContent}>
            <Text style={styles.label}>Email Recipients</Text>
            <TextInput
              style={styles.textInput}
              value={automations.emailRecipients}
              onChangeText={(text) => updateAutomation('emailRecipients', text)}
              placeholder="email1@example.com, email2@example.com"
              multiline
            />
            <Text style={styles.helperText}>
              Separate multiple emails with commas
            </Text>
          </View>
        )}
      </View>

      {/* Cloud Sync */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cloud Sync</Text>
          <Switch
            value={automations.cloudSync}
            onValueChange={(value) => updateAutomation('cloudSync', value)}
          />
        </View>

        {automations.cloudSync && (
          <View style={styles.sectionContent}>
            <Text style={styles.label}>Cloud Service</Text>
            <View style={styles.optionGroup}>
              {['google_drive', 'dropbox', 'onedrive'].map(service => (
                <TouchableOpacity
                  key={service}
                  style={[
                    styles.optionButton,
                    automations.cloudService === service && styles.optionButtonSelected
                  ]}
                  onPress={() => updateAutomation('cloudService', service)}
                >
                  <Text style={[
                    styles.optionText,
                    automations.cloudService === service && styles.optionTextSelected
                  ]}>
                    {service.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <ExportButton
          title="Test Automation"
          variant="outline"
          onPress={handleTestAutomation}
          loading={isExporting}
        />
        <ExportButton
          title="Save Automation Rules"
          variant="primary"
          onPress={saveAutomation}
          icon="💾"
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Automation Tips</Text>
        <Text style={styles.infoText}>
          • Scheduled exports run in the background{'\n'}
          • Email automation requires valid email addresses{'\n'}
          • Cloud sync needs proper authentication{'\n'}
          • Test automation rules before enabling
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionContent: {
    marginTop: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  triggerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  triggerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  triggerDescription: {
    fontSize: 14,
    color: '#666',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    gap: 12,
    marginVertical: 20,
  },
  infoBox: {
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default AutomationSetup;