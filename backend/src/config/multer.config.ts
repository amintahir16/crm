import { memoryStorage } from 'multer';

export const multerConfig = {
  storage: memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      callback(null, true);
    } else {
      callback(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
};
