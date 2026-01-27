// src/app/components/ExportButton.jsx
import React, { useState } from 'react';
import {
  Button, Menu, MenuItem, IconButton, Tooltip, Box, Typography,
  CircularProgress, Alert, Snackbar
} from '@mui/material';
import {
  Download, PictureAsPdf, Description, TextFields, Code, CloudDownload
} from '@mui/icons-material';
import { handleDocumentExport } from "../../ocr/utils/exportUtils";


const ExportButton = ({ 
  data = {},
  buttonType = 'icon', // 'icon', 'text', or 'full'
  size = 'medium',
  color = 'primary',
  variant = 'outlined',
  showFormats = ['pdf', 'docx', 'txt', 'html', 'json'],
  label = 'Export',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format) => {
    handleCloseMenu();
    setIsExporting(true);
    
    if (onExportStart) onExportStart(format);
    
    try {
      const result = await handleDocumentExport(format, data);
      
      if (result.success) {
        setNotification({
          message: `Exported as ${format.toUpperCase()}`,
          severity: 'success'
        });
        if (onExportComplete) onExportComplete(result);
      } else {
        setNotification({
          message: `Export failed: ${result.error}`,
          severity: 'error'
        });
        if (onExportError) onExportError(result.error);
      }
    } catch (error) {
      setNotification({
        message: `Export error: ${error.message}`,
        severity: 'error'
      });
      if (onExportError) onExportError(error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatIcons = {
    pdf: <PictureAsPdf fontSize="small" />,
    docx: <Description fontSize="small" />,
    txt: <TextFields fontSize="small" />,
    html: <Code fontSize="small" />,
    json: <CloudDownload fontSize="small" />
  };

  const formatLabels = {
    pdf: 'PDF Document',
    docx: 'Word (.docx)',
    txt: 'Plain Text (.txt)',
    html: 'HTML File',
    json: 'JSON (Full Data)'
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <>
      {buttonType === 'icon' ? (
        <Tooltip title="Export Document">
          <IconButton
            onClick={handleOpenMenu}
            color={color}
            size={size}
            disabled={isExporting}
          >
            {isExporting ? <CircularProgress size={24} /> : <Download />}
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          onClick={handleOpenMenu}
          color={color}
          variant={variant}
          size={size}
          startIcon={isExporting ? <CircularProgress size={20} /> : <Download />}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : label}
        </Button>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {showFormats.map((format) => (
          <MenuItem
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {formatIcons[format]}
              <Typography variant="body2">{formatLabels[format]}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification?.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ExportButton;