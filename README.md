📤 FileExport-Utility
https://www.typescriptlang.org/

Enterprise-Grade Export System for React & React Native Applications

🚀 Installation
npm install fileexport-utility
# or
yarn add fileexport-utility


For React Native:

npm install fileexport-utility @react-native-async-storage/async-storage


Native Permissions:

iOS: Add NSDocumentsDirectory to Info.plist

Android: Add WRITE_EXTERNAL_STORAGE permission

✨ Features
📊 Multi-Format Export
await exportUtility.export(data, 'csv');   // Spreadsheets
await exportUtility.export(data, 'pdf');   // Printable documents
await exportUtility.export(data, 'json');  // Developer-friendly
await exportUtility.export(data, 'txt');   // Plain text
await exportUtility.export(data, 'images'); // Visual exports

🎯 Smart Data Handling

Automatic type detection (OCR scans, QR codes, barcodes)

Metadata preservation (timestamps, confidence scores, source info)

Image data extraction

Compression options

Email integration

📱 Cross-Platform Ready

React Native (iOS/Android)

React Web (Browser-based exports)

Hybrid Apps (Capacitor/Expo compatible)

Responsive UI

🎨 Screenshot Preview

Export Modal

Format Selector

Progress Tracker

🏗️ Architecture

Core Components

// 1. ExportModal - Main UI Component
// 2. ExportScreen - Full-page export interface
// 3. ExportButton - Action trigger


Smart Data Processing Pipeline

Raw Data → Type Detection → Format Conversion → File Generation → Delivery


History items: OCR/QR/Barcode → CSV/PDF/JSON → Optimized File → Download/Email

🚀 Quick Start Examples

Example 1: Simple Export Modal

import { ExportModal, useExport } from 'fileexport-utility';

function MyComponent() {
  const [showExport, setShowExport] = useState(false);
  const { exportData, isExporting } = useExport();

  const handleExport = async (data, format, options) => {
    await exportData(data, format, options);
  };

  return (
    <>
      <button onClick={() => setShowExport(true)}>Export Data</button>
      <ExportModal
        visible={showExport}
        onClose={() => setShowExport(false)}
        data={yourData}
        onExport={handleExport}
      />
    </>
  );
}


Example 2: Full Export Screen

import { ExportScreen } from 'fileexport-utility';

function HistoryPage() {
  return <ExportScreen exportType="history" data={historyData} />;
}

🎯 Advanced Features
Custom Export Formats
exportUtility.registerFormat('custom', {
  extension: '.custom',
  mimeType: 'application/custom',
  processor: async (data) => { return processedData; }
});

Email Integration
const options = {
  sendEmail: true,
  emailAddress: 'user@example.com',
  subject: 'Your Export Data',
  body: 'Attached is your requested export.'
};
await exportUtility.export(data, 'pdf', options);

Cloud Upload
const options = {
  autoUpload: true,
  cloudService: 'googleDrive', // 'dropbox' | 'onedrive'
  folderPath: '/exports/'
};
await exportUtility.export(data, 'json', options);

Progress Tracking
await exportUtility.export(data, 'csv', {}, (progress) => {
  console.log(`Export progress: ${progress.current}/${progress.total}`);
  console.log(`Status: ${progress.status}`);
});

📊 Data Types Supported
Data Type	Export Format	Features
OCR Scans	PDF, TXT, JSON	Preserves text, confidence scores, language info
QR Codes	Images, JSON, CSV	Saves visual codes + decoded data
Barcode Scans	CSV, JSON, PDF	Product info, formats, timestamps
Scan History	All formats	Comprehensive metadata
Images	PNG, JPG, ZIP	Compression, quality options
🎨 Customization Options

Theming

import { ExportThemeProvider } from 'fileexport-utility';

<ExportThemeProvider theme={{
  primaryColor: '#3b82f6',
  borderRadius: 12,
  fontFamily: 'Inter, sans-serif',
  darkMode: false
}} />


Localization

exportUtility.setTranslations({
  en: { export: 'Export', cancel: 'Cancel', exporting: 'Exporting...' },
  es: { export: 'Exportar', cancel: 'Cancelar' }
});

🔧 API Reference

Hooks

const { exportData, isExporting, progress, error } = useExport();
const { history, clearHistory } = useExportHistory();
const { settings, updateSettings } = useExportSettings();


Components

Component	Props
ExportModal	visible, onClose, data, onExport
ExportScreen	exportType, data
ExportButton	title, variant, onPress, loading
ProgressIndicator	progress, showPercentage
FormatSelector	selectedFormat, onChange
📱 Platform-Specific Features

React Native

import * as FileSystem from 'react-native-fs';
import Share from 'react-native-share';
import Mailer from 'react-native-mail';


Web (React)

const blob = new Blob([data], { type: mimeType });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = filename;
link.click();

🚀 Performance Optimization

Core: ~25KB gzipped, Full package: ~45KB gzipped

Tree-shaking & code splitting

Stream processing for large datasets

Background processing with Web Workers

Automatic cleanup of temporary files

🔒 Security Features

File type & size validation

Email address validation

Secure file naming

GDPR-ready, no data persistence without permission

🤝 Contributing
git clone https://github.com/cypso05/FileExport-Utility.git
cd FileExport-Utility
npm install
npm start
npm test # or yarn test


We welcome contributions! See the Contributing Guide.

📄 License

MIT License - see LICENSE for details.

🌟 Show Your Support

If this utility helped you, please give it a ⭐️ on GitHub!
