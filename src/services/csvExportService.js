import { generateCSVHeaders } from '../utils/exportFormatters';

class CSVExportService {
  async generateCSV(data, options = {}) {
    try {
      const {
        includeTimestamps = true,
        includeProductInfo = true,
        customHeaders = null
      } = options;

      // Validate data before processing
      const validationIssues = this.validateCSVData(data);
      if (validationIssues.length > 0) {
        throw new Error(`Data validation failed: ${validationIssues.join(', ')}`);
      }

      // Generate headers based on data structure and options
      const headers = customHeaders || generateCSVHeaders(data, {
        includeTimestamps,
        includeProductInfo
      });

      // Format data rows
      const rows = data.map(item => 
        this.formatItemForCSV(item, headers, options)
      );

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('CSV generation error:', error);
      throw new Error(`Failed to generate CSV file: ${error.message}`);
    }
  }

  formatItemForCSV(item, headers, options) {
    return headers.map(header => {
      const value = this.getValueByHeader(item, header, options);
      
      // Escape CSV special characters and wrap in quotes if needed
      return this.escapeCSVValue(value);
    });
  }

  getValueByHeader(item, header, options) {
    const headerMapping = {
      'id': item.id || '',
      'type': item.type || '',
      'data': item.data || '',
      'timestamp': options.includeTimestamps && item.timestamp ? 
        new Date(item.timestamp).toISOString() : '',
      'product_name': item.product?.name || '',
      'product_price': this.formatPrice(item.product?.price),
      'product_category': item.product?.category || '',
      'product_brand': item.product?.brand || '',
      'scanned_count': item.scannedCount || 1,
      'location': item.location || ''
    };

    return headerMapping[header] !== undefined ? headerMapping[header] : '';
  }

  formatPrice(price) {
    if (price === null || price === undefined || price === '') {
      return '';
    }
    
    // Ensure price is properly formatted as string
    const numericPrice = parseFloat(price);
    return isNaN(numericPrice) ? String(price) : numericPrice.toFixed(2);
  }

  escapeCSVValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // Check if value contains commas, quotes, or newlines
    if (stringValue.includes(',') || 
        stringValue.includes('"') || 
        stringValue.includes('\n') ||
        stringValue.includes('\r')) {
      
      // Escape quotes by doubling them and wrap in quotes
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  async generateCSVWithChunks(data, options, onProgress) {
    try {
      const chunkSize = 1000; // Process 1000 items at a time
      const chunks = [];
      
      // Validate data first
      const validationIssues = this.validateCSVData(data);
      if (validationIssues.length > 0) {
        throw new Error(`Data validation failed: ${validationIssues.join(', ')}`);
      }

      // Generate headers once
      const headers = generateCSVHeaders(data, options);
      const headerRow = headers.join(',');
      
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const csvChunk = await this.generateCSV(chunk, {
          ...options,
          customHeaders: headers // Use the same headers for all chunks
        });
        
        // Remove headers from subsequent chunks
        const chunkWithoutHeaders = csvChunk.split('\n').slice(1).join('\n');
        chunks.push(chunkWithoutHeaders);
        
        if (onProgress) {
          onProgress({
            current: Math.min(i + chunkSize, data.length),
            total: data.length,
            status: `Processing chunk ${Math.ceil(i / chunkSize) + 1} of ${Math.ceil(data.length / chunkSize)}`
          });
        }
      }

      // Combine chunks with headers only at the top
      return [headerRow, ...chunks].join('\n');
    } catch (error) {
      console.error('Chunked CSV generation error:', error);
      throw new Error(`Failed to generate chunked CSV: ${error.message}`);
    }
  }

  validateCSVData(data) {
    const issues = [];
    
    if (!Array.isArray(data)) {
      issues.push('Data must be an array');
      return issues;
    }
    
    if (data.length === 0) {
      issues.push('No data to export');
      return issues;
    }
    
    // Check for required fields in each item
    data.forEach((item, index) => {
      if (!item.id) {
        issues.push(`Item at index ${index} missing ID`);
      }
      if (!item.data) {
        issues.push(`Item at index ${index} missing data field`);
      }
      if (item.timestamp && isNaN(new Date(item.timestamp))) {
        issues.push(`Item at index ${index} has invalid timestamp`);
      }
    });
    
    return issues;
  }

  // New method to generate CSV with custom formatting
  async generateFormattedCSV(data, options = {}) {
    const {
      dateFormat = 'iso',
      numberFormat = 'decimal'
      // Removed unused includeEmptyFields parameter
    } = options;

    const formattedData = data.map(item => {
      const formattedItem = { ...item };
      
      // Format timestamp if present
      if (formattedItem.timestamp) {
        formattedItem.timestamp = this.formatDate(formattedItem.timestamp, dateFormat);
      }
      
      // Format numbers if present
      if (formattedItem.product?.price) {
        formattedItem.product.price = this.formatNumber(formattedItem.product.price, numberFormat);
      }
      
      return formattedItem;
    });

    return this.generateCSV(formattedData, options);
  }

  formatDate(timestamp, format = 'iso') {
    const date = new Date(timestamp);
    
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'local':
        return date.toLocaleString();
      case 'date-only':
        return date.toLocaleDateString();
      case 'time-only':
        return date.toLocaleTimeString();
      default:
        return date.toISOString();
    }
  }

  formatNumber(value, format = 'decimal') {
    const number = parseFloat(value);
    if (isNaN(number)) return value;
    
    switch (format) {
      case 'decimal':
        return number.toFixed(2);
      case 'integer':
        return Math.round(number).toString();
      case 'currency':
        return `$${number.toFixed(2)}`;
      default:
        return number.toString();
    }
  }

  // Utility method to get CSV file info
  getCSVFileInfo(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0]?.split(',') || [];
    const dataRows = lines.length - 1; // Subtract header row
    
    return {
      rowCount: dataRows,
      columnCount: headers.length,
      headers,
      fileSize: new Blob([csvContent]).size,
      lineCount: lines.length
    };
  }

  // Method to sanitize CSV content for special characters
sanitizeCSVContent(content) {
  const pattern = "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]";
  const re = new RegExp(pattern, "g");
  return content.replace(re, "");
}


  // Enhanced method to handle empty fields based on options
  async generateCSVWithEmptyFieldHandling(data, options = {}) {
    const {
      includeEmptyFields = false,
      emptyFieldPlaceholder = 'N/A'
    } = options;

    const processedData = data.map(item => {
      const processedItem = { ...item };
      
      // Handle empty fields based on options
      if (!includeEmptyFields) {
        // Remove empty fields
        Object.keys(processedItem).forEach(key => {
          if (processedItem[key] === null || processedItem[key] === undefined || processedItem[key] === '') {
            delete processedItem[key];
          }
        });
        
        // Handle nested product object
        if (processedItem.product) {
          Object.keys(processedItem.product).forEach(key => {
            if (processedItem.product[key] === null || processedItem.product[key] === undefined || processedItem.product[key] === '') {
              delete processedItem.product[key];
            }
          });
        }
      } else {
        // Replace empty fields with placeholder
        Object.keys(processedItem).forEach(key => {
          if (processedItem[key] === null || processedItem[key] === undefined || processedItem[key] === '') {
            processedItem[key] = emptyFieldPlaceholder;
          }
        });
        
        // Handle nested product object
        if (processedItem.product) {
          Object.keys(processedItem.product).forEach(key => {
            if (processedItem.product[key] === null || processedItem.product[key] === undefined || processedItem.product[key] === '') {
              processedItem.product[key] = emptyFieldPlaceholder;
            }
          });
        }
      }
      
      return processedItem;
    });

    return this.generateCSV(processedData, options);
  }

  // Method to generate CSV with custom column ordering
  async generateCSVWithColumnOrder(data, columnOrder = [], options = {}) {
    const csvContent = await this.generateCSV(data, options);
    
    if (!columnOrder.length) {
      return csvContent;
    }

    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    // Create mapping for column reordering
    const headerIndexMap = headers.reduce((map, header, index) => {
      map[header] = index;
      return map;
    }, {});

    // Reorder columns based on provided order
    const reorderedLines = lines.map(line => {
      const columns = line.split(',');
      const reorderedColumns = columnOrder.map(header => {
        const index = headerIndexMap[header];
        return index !== undefined ? columns[index] : '';
      });
      return reorderedColumns.join(',');
    });

    return reorderedLines.join('\n');
  }

  // Method to add BOM for Excel compatibility
  addBOM(csvContent) {
    // Add UTF-8 BOM for better Excel compatibility
    return '\uFEFF' + csvContent;
  }

  // Method to validate CSV content structure
  validateCSVStructure(csvContent) {
    const issues = [];
    const lines = csvContent.split('\n');
    
    if (lines.length === 0) {
      issues.push('CSV content is empty');
      return issues;
    }

    const headers = lines[0].split(',');
    const expectedColumns = headers.length;

    // Check if all rows have the same number of columns
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) { // Skip empty lines
        const columns = lines[i].split(',');
        if (columns.length !== expectedColumns) {
          issues.push(`Row ${i + 1} has ${columns.length} columns, expected ${expectedColumns}`);
        }
      }
    }

    return issues;
  }
}

export const csvExportService = new CSVExportService();