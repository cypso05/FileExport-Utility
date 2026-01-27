import React, { useState, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ExportScreen.css';
import ExportButton from '../components/ExportButton';
import ExportModal from '../components/ExportModal';
import ProgressIndicator from '../components/ProgressIndicator';
import { useExport } from '../hooks/useExport';
import HistoryContext from '../../../contexts/HistoryContext';
import { HISTORY_TYPES } from '../../../contexts/historyConstants';

const ExportScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { history, getHistoryByType } = useContext(HistoryContext);
  
  const { exportType = 'scanHistory' } = location.state || {};
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  
  const { exportData, isExporting, exportProgress } = useExport();

  // Get the actual data based on export type
  const data = useMemo(() => {
    switch (exportType) {
      case 'scanHistory':
        return history; // All history items
        
      case 'ocrScans':
        return getHistoryByType(HISTORY_TYPES.OCR_SCAN);
        
      case 'qrCodes':
        return getHistoryByType(HISTORY_TYPES.QR_CODE);
        
      case 'barcodeScans':
        return getHistoryByType('barcode_scan') || [];
        
      case 'currentSelection':
        // Handle case where specific items are passed
        return location.state?.data || [];
        
      default:
        return history; // Fallback to all history
    }
  }, [exportType, history, getHistoryByType, location.state]);

  // Transform history data to export format
  const exportReadyData = useMemo(() => {
    return data.map(item => {
      // Handle different data structures from different sources
      let content = '';
      let type = item.type || 'unknown';
      
      if (item.type === HISTORY_TYPES.OCR_SCAN) {
        content = item.data?.text || item.data?.content || '';
        type = 'ocr_text';
      } else if (item.type === HISTORY_TYPES.QR_CODE) {
        content = item.data?.content || item.data?.text || '';
        type = 'qr_code';
      } else if (item.data && typeof item.data === 'string') {
        content = item.data;
      } else if (item.data && item.data.content) {
        content = item.data.content;
      } else if (item.data && item.data.text) {
        content = item.data.text;
      }

      return {
        id: item.id,
        type: type,
        data: content,
        timestamp: item.timestamp,
        title: item.title,
        description: item.description,
        // Include additional metadata
        metadata: {
          confidence: item.data?.confidence,
          mode: item.data?.mode,
          language: item.data?.language,
          characterCount: item.metadata?.characterCount,
          wordCount: item.metadata?.wordCount
        },
        // Include image data if available for visual exports
        imageData: item.data?.imageData || item.preview || item.data?.image,
        // Product info if available (for barcode scans)
        product: item.data?.product || null
      };
    });
  }, [data]);

  const exportSections = [
    {
      title: 'Quick Export',
      data: [
        {
          id: 'quick-csv',
          title: 'Export as CSV',
          description: 'Comma-separated values for spreadsheets',
          format: 'csv',
          icon: '📊',
          type: 'quick'
        },
        {
          id: 'quick-pdf',
          title: 'Export as PDF', 
          description: 'Portable document for printing',
          format: 'pdf',
          icon: '📄',
          type: 'quick'
        },
        {
          id: 'quick-txt',
          title: 'Export as Text',
          description: 'Plain text file',
          format: 'txt',
          icon: '📝',
          type: 'quick'
        }
      ]
    },
    {
      title: 'Advanced Export',
      data: [
        {
          id: 'advanced-json',
          title: 'Export as JSON',
          description: 'Structured data for developers',
          format: 'json',
          icon: '🔧',
          type: 'advanced'
        },
        {
          id: 'advanced-images',
          title: 'Export Images',
          description: 'Save visual content as images',
          format: 'images',
          icon: '🖼️',
          type: 'advanced'
        }
      ]
    }
  ];

  const handleQuickExport = async (format) => {
    if (exportReadyData.length === 0) {
      alert('No data available to export!');
      return;
    }

    try {
      setSelectedFormat(format);
      await exportData(exportReadyData, format, {
        includeTimestamps: true,
        includeMetadata: true
      });
    } catch (error) {
      console.error('Quick export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setSelectedFormat(null);
    }
  };

  const handleAdvancedExport = (format) => {
    if (exportReadyData.length === 0) {
      alert('No data available to export!');
      return;
    }
    
    setSelectedFormat(format);
    setExportModalVisible(true);
  };

  const handleExportAction = (item) => {
    if (item.type === 'quick') {
      handleQuickExport(item.format);
    } else {
      handleAdvancedExport(item.format);
    }
  };

  const getExportButtonState = (itemFormat) => {
    if (isExporting && selectedFormat === itemFormat) {
      return { loading: true, disabled: true };
    }
    return { loading: false, disabled: isExporting || exportReadyData.length === 0 };
  };

  const renderExportItem = (item) => {
    const buttonState = getExportButtonState(item.format);
    
    return (
      <div key={item.id} className="export-item">
        <div className="export-item-content">
          <span className="export-icon">{item.icon}</span>
          <div className="export-text">
            <div className="export-title">{item.title}</div>
            <div className="export-description">{item.description}</div>
            {exportReadyData.length === 0 && (
              <div className="export-warning">No data available</div>
            )}
          </div>
        </div>
        <ExportButton
          title={exportReadyData.length === 0 ? "No Data" : "Export"}
          variant="secondary"
          onPress={() => handleExportAction(item)}
          loading={buttonState.loading}
          disabled={buttonState.disabled || exportReadyData.length === 0}
        />
      </div>
    );
  };

  const getExportStatusText = () => {
    if (!exportProgress) return null;
    
    if (exportProgress.error) {
      return `Export failed: ${exportProgress.error}`;
    }
    
    if (exportProgress.status === 'Export completed!') {
      return `Export completed successfully!`;
    }
    
    return exportProgress.status;
  };

  const getExportTypeDisplayName = () => {
    switch (exportType) {
      case 'scanHistory': return 'Scan History';
      case 'ocrScans': return 'OCR Scans';
      case 'qrCodes': return 'QR Codes';
      case 'barcodeScans': return 'Barcode Scans';
      default: return 'Data';
    }
  };

  // Calculate stats from actual data
  const stats = useMemo(() => {
    const ocrScans = exportReadyData.filter(item => item.type === 'ocr_text').length;
    const qrCodes = exportReadyData.filter(item => item.type === 'qr_code').length;
    const barcodes = exportReadyData.filter(item => item.type === 'barcode').length;
    const withImages = exportReadyData.filter(item => item.imageData).length;

    return {
      totalItems: exportReadyData.length,
      ocrScans,
      qrCodes,
      barcodes,
      withImages
    };
  }, [exportReadyData]);

  return (
    <div className="export-container">
      <div className="export-scroll-view">
        <div className="export-header">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <h1 className="export-title">Export {getExportTypeDisplayName()}</h1>
          <div className="export-subtitle">
            Export {stats.totalItems} items in various formats
          </div>
        </div>

        {exportProgress && (
          <div className="progress-section">
            <div className="progress-title">
              Exporting as {selectedFormat?.toUpperCase() || 'Unknown Format'}
            </div>
            <ProgressIndicator progress={exportProgress} />
            {getExportStatusText() && (
              <div className="status-text">
                {getExportStatusText()}
              </div>
            )}
            {exportProgress.error && (
              <button 
                className="retry-button"
                onClick={() => selectedFormat && handleQuickExport(selectedFormat)}
              >
                <span className="retry-text">Retry Export</span>
              </button>
            )}
          </div>
        )}

        {/* Real data stats */}
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">{stats.totalItems}</div>
            <div className="stat-label">Total Items</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.ocrScans}</div>
            <div className="stat-label">OCR Scans</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.qrCodes}</div>
            <div className="stat-label">QR Codes</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.withImages}</div>
            <div className="stat-label">With Images</div>
          </div>
        </div>

        {exportReadyData.length === 0 ? (
          <div className="no-data-section">
            <div className="no-data-icon">📭</div>
            <h3>No Data Available for Export</h3>
            <p>You don't have any {getExportTypeDisplayName().toLowerCase()} to export.</p>
            <div className="no-data-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/scan')}
              >
                Go to Scanner
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/qr-generator')}
              >
                Create QR Code
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/history')}
              >
                View History
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="sections-container">
              {exportSections.map(section => (
                <div key={section.title} className="section">
                  <div className="section-header">{section.title}</div>
                  {section.data.map(item => renderExportItem(item))}
                </div>
              ))}
            </div>

            <div className="info-box">
              <div className="info-title">Export Information</div>
              <div className="info-text">
                • CSV: Best for Excel, Google Sheets, and data analysis<br />
                • PDF: Ideal for printing and formal reports<br />
                • Text: Simple plain text format<br />
                • JSON: Perfect for developers and data processing<br />
                • Images: Export visual content (QR codes, scanned images)<br />
                • All exports include timestamps and metadata
              </div>
            </div>
          </>
        )}
      </div>

      <ExportModal
        visible={exportModalVisible}
        onClose={() => {
          setExportModalVisible(false);
          setSelectedFormat(null);
        }}
        data={exportReadyData}
        onExport={exportData}
        exportType={exportType}
      />
    </div>
  );
};

export default ExportScreen;