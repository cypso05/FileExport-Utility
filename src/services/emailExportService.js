// emailExportService.jsx

class EmailExportService {
  generateEmailBody(format, itemCount, additionalInfo = {}) {
    const timestamp = new Date().toLocaleString();

    return `
Hello,

Your QR Scanner export is ready!

Export Details:
• Format: ${format.toUpperCase()}
• Items: ${itemCount}
• Generated: ${timestamp}
• File Size: ${additionalInfo.fileSize ?? 'N/A'} KB

This export was generated using the QR Scanner app.

Best regards,
QR Scanner Team
    `.trim();
  }

  generateHTMLBody(format, itemCount, additionalInfo = {}) {
    const timestamp = new Date().toLocaleString();

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .header { color: #007AFF; font-size: 18px; font-weight: bold; }
    .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .detail-item { margin: 5px 0; }
    .label { font-weight: bold; color: #007AFF; }
    .footer { color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">QR Scanner Export Ready</div>
  
  <p>Hello,</p>
  <p>Your QR Scanner export is ready for download.</p>
  
  <div class="details">
    <div class="detail-item"><span class="label">Format:</span> ${format.toUpperCase()}</div>
    <div class="detail-item"><span class="label">Items:</span> ${itemCount}</div>
    <div class="detail-item"><span class="label">Generated:</span> ${timestamp}</div>
    ${additionalInfo.fileSize ? `<div class="detail-item"><span class="label">File Size:</span> ${additionalInfo.fileSize} KB</div>` : ''}
  </div>

  <p>This export was generated using the QR Scanner app.</p>
  
  <div class="footer">
    Best regards,<br>
    QR Scanner Team
  </div>
</body>
</html>
    `.trim();
  }

  async sendExportEmail(fileUri, emailAddress, format, itemCount) {
    console.log('Sending export email:', { to: emailAddress, format, itemCount, fileUri });

    // Here you would call your backend API that sends the email
    // Frontend shouldn't send emails directly

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      sentAt: new Date().toISOString()
    };
  }

  validateEmailConfiguration() {
    // Vite exposes environment variables via import.meta.env
    const requiredConfig = ['VITE_EMAIL_SERVICE_API_KEY', 'VITE_EMAIL_FROM_ADDRESS'];
    const missingConfig = requiredConfig.filter(config => !import.meta.env[config]);

    if (missingConfig.length > 0) {
      throw new Error(`Email service not configured. Missing: ${missingConfig.join(', ')}`);
    }

    return true;
  }

  generateExportSummary(data, format) {
    const timestamps = data.map(item => new Date(item.timestamp).getTime());

    return {
      totalItems: data.length,
      barcodes: data.filter(item => item.type === 'barcode').length,
      qrCodes: data.filter(item => item.type === 'qr').length,
      withProductInfo: data.filter(item => !!item.product).length,
      dateRange: {
        start: new Date(Math.min(...timestamps)),
        end: new Date(Math.max(...timestamps))
      },
      fileFormat: format
    };
  }
}

export const emailExportService = new EmailExportService();
