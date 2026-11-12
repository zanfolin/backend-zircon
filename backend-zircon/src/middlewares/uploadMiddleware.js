import { uploadService } from '../services/uploadService.js';

export const uploadMiddleware = {
  single: (fieldName) => {
    return (req, res, next) => {
      const uploadSingle = uploadService.uploadSingle(fieldName);

      uploadSingle(req, res, (error) => {
        if (error) {
          return uploadService.handleUploadError(error, req, res, next);
        }
        next();
      });
    };
  },

  multiple: (fieldName, maxCount) => {
    return (req, res, next) => {
      const uploadMultiple = uploadService.uploadMultiple(fieldName, maxCount);

      uploadMultiple(req, res, (error) => {
        if (error) {
          return uploadService.handleUploadError(error, req, res, next);
        }
        next();
      });
    };
  },
};