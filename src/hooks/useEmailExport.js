import { useState, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { emailExportService } from '../services/emailExportService';

export const useEmailExport = () => {
  const [isSending, setIsSending] = useState(false);

  const sendExportEmail = useCallback(async (fileUri, emailAddress, format, itemCount) => {
    setIsSending(true);
    
    try {
      // Check if mail composer is available
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (!isAvailable) {
        // Fallback to mailto link
        await sendViaMailTo(fileUri, emailAddress, format, itemCount);
        return;
      }

      const subject = `QR Scanner Export - ${format.toUpperCase()}`;
      const body = emailExportService.generateEmailBody(format, itemCount);
      
      const result = await MailComposer.composeAsync({
        recipients: [emailAddress],
        subject,
        body,
        attachments: Platform.OS !== 'web' ? [fileUri] : undefined
      });

      if (result.status === 'sent') {
        Alert.alert('Success', 'Export sent via email successfully');
      }
      
      return result;
    } catch (error) {
      console.error('Email export error:', error);
      Alert.alert('Error', 'Failed to send email. Please check your email configuration.');
      throw error;
    } finally {
      setIsSending(false);
    }
  }, []);

  const sendViaMailTo = async (fileUri, emailAddress, format, itemCount) => {
    const subject = `QR Scanner Export - ${format.toUpperCase()}`;
    const body = emailExportService.generateEmailBody(format, itemCount);
    
    const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (canOpen) {
      await Linking.openURL(mailtoUrl);
    } else {
      throw new Error('Email is not configured on this device');
    }
  };

  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const generateExportSummary = useCallback((data, format) => {
    return {
      totalItems: data.length,
      fileSize: format === 'csv' ? Math.round(data.length * 0.1) : Math.round(data.length * 0.5), // Rough estimate in KB
      generatedAt: new Date().toLocaleString(),
      formats: [format]
    };
  }, []);

  return {
    sendExportEmail,
    isSending,
    validateEmail,
    generateExportSummary
  };
};