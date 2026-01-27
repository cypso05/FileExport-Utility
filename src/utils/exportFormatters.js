export const formatDataForExport = (data, options = {}) => {
  const {
    includeTimestamps = true,
    includeProductInfo = true,
    includeMetadata = true,
    dateFormat = 'iso'
  } = options;

  return data.map(item => {
    const formattedItem = {
      id: item.id,
      type: item.type,
      data: item.data,
      ...(includeTimestamps && {
        timestamp: formatDate(item.timestamp, dateFormat)
      }),
      ...(includeMetadata && {
        scannedCount: item.scannedCount || 1,
        location: item.location || null
      })
    };

    if (includeProductInfo && item.product) {
      formattedItem.product = {
        name: item.product.name || '',
        price: item.product.price || null,
        category: item.product.category || '',
        brand: item.product.brand || '',
        upc: item.product.upc || '',
        ...(item.product.nutrition && {
          nutrition: item.product.nutrition
        })
      };
    }

    return formattedItem;
  });
};

export const formatDate = (timestamp, format = 'iso') => {
  const date = new Date(timestamp);
  
  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'local':
      return date.toLocaleString();
    case 'date':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    default:
      return date.toISOString();
  }
};

export const generateCSVHeaders = (data, options = {}) => {
  const baseHeaders = ['id', 'type', 'data'];
  
  if (options.includeTimestamps) {
    baseHeaders.push('timestamp');
  }
  
  if (options.includeProductInfo) {
    baseHeaders.push(
      'product_name',
      'product_price', 
      'product_category',
      'product_brand'
    );
  }
  
  if (options.includeMetadata) {
    baseHeaders.push('scanned_count', 'location');
  }

  return baseHeaders;
};

export const flattenObject = (obj, prefix = '') => {
  const flattened = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
};

export const validateExportData = (data, format) => {
  const errors = [];
  
  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return errors;
  }
  
  if (data.length === 0) {
    errors.push('No data to export');
    return errors;
  }
  
  // Validate each item
  data.forEach((item, index) => {
    if (!item.id) {
      errors.push(`Item at index ${index} is missing ID`);
    }
    
    if (!item.data) {
      errors.push(`Item at index ${index} is missing data field`);
    }
    
    if (item.timestamp && isNaN(new Date(item.timestamp))) {
      errors.push(`Item at index ${index} has invalid timestamp`);
    }
  });
  
  // Format-specific validations
  if (format === 'csv') {
    // Check for characters that might break CSV
    data.forEach((item, index) => {
      if (item.data && /[,"\n\r]/.test(item.data)) {
        // This is actually fine, just a note for proper escaping
        console.log(`Item ${index} contains CSV special characters`);
      }
    });
  }
  
  return errors;
};

export const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export const generateExportFilename = (baseName, format, options = {}) => {
  const timestamp = options.timestamp || new Date();
  const dateStr = timestamp.toISOString().split('T')[0];
  const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  let filename = `${baseName}_${dateStr}`;
  
  if (options.includeTime) {
    filename += `_${timeStr}`;
  }
  
  if (options.customSuffix) {
    filename += `_${options.customSuffix}`;
  }
  
  const extensions = {
    csv: '.csv',
    pdf: '.pdf',
    json: '.json',
    xlsx: '.xlsx'
  };
  
  return filename + (extensions[format] || '.txt');
};