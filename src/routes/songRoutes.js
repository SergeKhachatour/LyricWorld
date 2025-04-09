const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, isAdmin } = require('../middleware/auth');
const getStorageService = require('../services/storageServiceFactory');
const {
    createSong,
    addSongVersion,
    getAllSongs,
    getSongById,
    updateSong,
    deleteSong,
    verifySongVersion
} = require('../controllers/songController');

const storageService = getStorageService();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Determine file type and prefix
        const fileType = file.fieldname === 'audio' ? 'audio' : 'image';
        cb(null, `${fileType}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'audio') {
            const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type. Only MP3 and WAV files are allowed.'));
            }
        } else if (file.fieldname === 'image') {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
            }
        } else {
            cb(new Error('Invalid field name.'));
        }
    }
});

// Public routes
router.get('/', getAllSongs);
router.get('/:songId', getSongById);

// Protected routes
router.post('/', auth, upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), createSong);
router.post('/:songId/versions', auth, storageService.upload.single('audio'), addSongVersion);
router.put('/:songId', auth, updateSong);
router.delete('/:songId', auth, deleteSong);
router.post('/:songId/versions/:versionId/verify', auth, isAdmin, verifySongVersion);

module.exports = router; 