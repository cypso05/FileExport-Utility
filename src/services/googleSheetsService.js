class GoogleSheetsService {
  constructor() {
    this.accessToken = null;
    this.baseURL = 'https://sheets.googleapis.com/v4/spreadsheets';
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  async createSpreadsheet(title, data, headers, onProgress) {
    if (!this.accessToken) {
      throw new Error('Google Sheets access token not set');
    }

    try {
      if (onProgress) {
        onProgress({ current: 1, total: 3, status: 'Creating spreadsheet...' });
      }

      // Create new spreadsheet
      const createResponse = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: title || `QR Scanner Export ${new Date().toISOString().split('T')[0]}`
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create spreadsheet: ${createResponse.statusText}`);
      }

      const spreadsheet = await createResponse.json();

      if (onProgress) {
        onProgress({ current: 2, total: 3, status: 'Adding data...' });
      }

      // Add data to the spreadsheet
      await this.updateSheetData(spreadsheet.spreadsheetId, data, headers);

      if (onProgress) {
        onProgress({ current: 3, total: 3, status: 'Spreadsheet created!' });
      }

      return {
        spreadsheetId: spreadsheet.spreadsheetId,
        spreadsheetUrl: spreadsheet.spreadsheetUrl,
        title: spreadsheet.properties.title
      };
    } catch (error) {
      console.error('Google Sheets creation error:', error);
      throw new Error(`Failed to create Google Sheet: ${error.message}`);
    }
  }

  async updateSheetData(spreadsheetId, data, headers) {
    const values = [
      headers || this.generateDefaultHeaders(data),
      ...data.map(item => this.formatItemForSheets(item, headers))
    ];

    const updateResponse = await fetch(
      `${this.baseURL}/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values,
          range: 'A1'
        })
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to update spreadsheet: ${updateResponse.statusText}`);
    }

    return await updateResponse.json();
  }

  generateDefaultHeaders(data) {
    const sampleItem = data[0] || {};
    const headers = ['ID', 'Type', 'Data', 'Timestamp'];
    
    if (sampleItem.product) {
      headers.push('Product Name', 'Product Price', 'Product Category');
    }
    
    if (sampleItem.location) {
      headers.push('Location');
    }
    
    return headers;
  }

  formatItemForSheets(item, headers) {
    if (headers) {
      return headers.map(header => this.getValueByHeader(item, header));
    }

    // Default formatting
    const row = [
      item.id,
      item.type,
      item.data,
      new Date(item.timestamp).toLocaleString()
    ];

    if (item.product) {
      row.push(
        item.product.name || '',
        item.product.price || '',
        item.product.category || ''
      );
    }

    if (item.location) {
      row.push(item.location);
    }

    return row;
  }

  getValueByHeader(item, header) {
    const mapping = {
      'ID': item.id,
      'Type': item.type,
      'Data': item.data,
      'Timestamp': new Date(item.timestamp).toLocaleString(),
      'Product Name': item.product?.name || '',
      'Product Price': item.product?.price || '',
      'Product Category': item.product?.category || '',
      'Product Brand': item.product?.brand || '',
      'Scanned Count': item.scannedCount || 1,
      'Location': item.location || ''
    };

    return mapping[header] || '';
  }

  async appendToSheet(spreadsheetId, newData) {
    if (!this.accessToken) {
      throw new Error('Google Sheets access token not set');
    }

    const values = newData.map(item => this.formatItemForSheets(item));

    const response = await fetch(
      `${this.baseURL}/${spreadsheetId}/values/A:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to append data: ${response.statusText}`);
    }

    return await response.json();
  }

  async getSpreadsheetInfo(spreadsheetId) {
    if (!this.accessToken) {
      throw new Error('Google Sheets access token not set');
    }

    const response = await fetch(
      `${this.baseURL}/${spreadsheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get spreadsheet info: ${response.statusText}`);
    }

    return await response.json();
  }

  async uploadToSheets(data, options, onProgress) {
    return await this.createSpreadsheet(
      options.customFileName || `QR Scanner Export ${new Date().toISOString().split('T')[0]}`,
      data,
      options.customHeaders,
      onProgress
    );
  }
}

export const googleSheetsService = new GoogleSheetsService();