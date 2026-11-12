import { upload, uploadSingle, uploadMultiple } from '../config/multer.js';

export const uploadService = {
  upload,
  uploadSingle,
  uploadMultiple,

  handleUploadError(error, req, res, next) {
    if (error instanceof Error) {
      if (error.message.includes('Tipo de arquivo não permitido')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes('File too large') || error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Arquivo muito grande. Tamanho máximo: 5MB',
        });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Campo de arquivo inesperado',
        });
      }
    }
    next(error);
  },

  getFileUrl(filename) {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    return `${baseUrl}/uploads/avatars/${filename}`;
  },
};