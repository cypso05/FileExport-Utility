import { useState, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { googleSheetsService } from '../services/googleSheetsService';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleSheets = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ],
  });

  const authenticate = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { access_token } = result.params;
        await googleSheetsService.setAccessToken(access_token);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Google authentication error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [promptAsync]);

  const createSpreadsheet = useCallback(async (title, data, headers) => {
    if (!isAuthenticated) {
      const authSuccess = await authenticate();
      if (!authSuccess) {
        throw new Error('Google authentication required');
      }
    }

    try {
      const spreadsheet = await googleSheetsService.createSpreadsheet(title, data, headers);
      return spreadsheet;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }, [isAuthenticated, authenticate]);

  const appendToSpreadsheet = useCallback(async (spreadsheetId, data) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const result = await googleSheetsService.appendToSheet(spreadsheetId, data);
      return result;
    } catch (error) {
      console.error('Error appending to spreadsheet:', error);
      throw error;
    }
  }, [isAuthenticated]);

  const getSpreadsheetUrl = useCallback((spreadsheetId) => {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  }, []);

  const signOut = useCallback(() => {
    googleSheetsService.clearAccessToken();
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    authenticate,
    createSpreadsheet,
    appendToSpreadsheet,
    getSpreadsheetUrl,
    signOut,
    authenticationInProgress: request && !response
  };
};