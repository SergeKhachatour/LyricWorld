const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');

// Get allowed file types from environment variable or default to mp3
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_AUDIO_TYPES || 'mp3').split(',').map(type => type.trim());

// MIME types for different audio formats
const MIME_TYPES = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4'
};

// Ensure uploads directory exists in the backend root
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}

// Configure multer for local storage
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer for S3 storage
const s3Storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (ALLOWED_FILE_TYPES.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`), false);
    }
};

// Create multer upload instance
const createUpload = (storage) => multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Configure AWS S3 (only if using S3 storage)
let s3;
if (process.env.STORAGE_TYPE === 's3') {
    s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });
}

// Create upload instances
const localUpload = createUpload(localStorage);
const s3Upload = createUpload(s3Storage);

// Get storage service based on environment
const getStorageService = () => {
    const storageType = process.env.STORAGE_TYPE || 'local';

    if (storageType === 's3') {
        return {
            upload: s3Upload,
            uploadFile: async (file, key) => {
                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: 'public-read'
                };

                const result = await s3.upload(params).promise();
                return result.Location;
            },
            deleteFile: async (fileUrl) => {
                const key = fileUrl.split('/').pop();
                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key
                };

                await s3.deleteObject(params).promise();
            }
        };
    }

    // Default to local storage
    return {
        upload: localUpload,
        uploadFile: async (file, filename) => {
            const filePath = path.join(uploadsDir, filename);
            await fs.promises.writeFile(filePath, file.buffer);
            return `/uploads/${filename}`;
        },
        deleteFile: async (fileUrl) => {
            const filename = fileUrl.split('/').pop();
            const filePath = path.join(uploadsDir, filename);
            await fs.promises.unlink(filePath);
        }
    };
};

module.exports = getStorageService; 