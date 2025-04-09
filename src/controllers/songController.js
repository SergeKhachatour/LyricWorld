const Song = require('../models/Song');
const getStorageService = require('../services/storageServiceFactory');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const storageService = getStorageService();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Create new song
const createSong = async (req, res) => {
    try {
        const { title, artist, country, language, genre, coordinates, originalLyrics, lyrics } = req.body;
        const audioFile = req.files && req.files.audio ? req.files.audio[0] : null;
        const imageFile = req.files && req.files.image ? req.files.image[0] : null;

        if (!audioFile) {
            return res.status(400).json({ message: 'No audio file provided' });
        }

        // Parse coordinates from JSON string
        let parsedCoordinates;
        try {
            parsedCoordinates = JSON.parse(coordinates);
        } catch (err) {
            console.error('Error parsing coordinates:', err);
            return res.status(400).json({ message: 'Invalid coordinates format' });
        }

        // Format the audio URL correctly - ensure forward slashes
        const audioUrl = `/uploads/${path.basename(audioFile.path).replace(/\\/g, '/')}`;
        console.log('Storing audio URL:', audioUrl);
        console.log('Audio file path:', audioFile.path);

        // Format the image URL if an image was uploaded
        let imageUrl = '/uploads/song-placeholder.jpg'; // Default image
        if (imageFile) {
            imageUrl = `/uploads/${path.basename(imageFile.path).replace(/\\/g, '/')}`;
            console.log('Storing image URL:', imageUrl);
            console.log('Image file path:', imageFile.path);
        }

        // Create new song with version
        const song = new Song({
            title,
            originalArtist: artist,
            originalLanguage: language,
            originalLyrics: originalLyrics || '', // Ensure originalLyrics is set
            category: genre,
            imageUrl, // Add the image URL
            versions: [{
                uploadedBy: req.user._id,
                country,
                language,
                audioUrl, // Use the formatted URL
                coordinates: {
                    lat: parsedCoordinates.lat,
                    lng: parsedCoordinates.lng
                },
                lyrics: lyrics || originalLyrics || '' // Use lyrics if provided, fallback to originalLyrics
            }],
            createdBy: req.user._id
        });

        await song.save();

        res.status(201).json(song);
    } catch (err) {
        console.error('Error creating song:', err);
        res.status(500).json({ message: 'Error creating song', error: err.message });
    }
};

// Add song version
const addSongVersion = async (req, res) => {
    try {
        console.log('Adding song version for song:', req.params.songId);
        const { songId } = req.params;
        const { country, language, lyrics } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'No audio file uploaded' });
        }

        // Validate required fields
        if (!country || !language || !lyrics) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['country', 'language', 'lyrics']
            });
        }

        // Get the appropriate audio URL based on storage type
        const audioUrl = process.env.STORAGE_TYPE === 's3' 
            ? req.file.location 
            : `/uploads/${req.file.filename}`;

        console.log('Audio file uploaded:', audioUrl);

        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        song.versions.push({
            uploadedBy: req.user._id,
            country,
            language,
            audioUrl,
            lyrics
        });

        await song.save();
        console.log('Song version added successfully');
        res.status(201).json(song);
    } catch (error) {
        console.error('Error adding song version:', error);
        res.status(500).json({
            message: 'Error adding song version',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all songs
const getAllSongs = async (req, res) => {
    try {
        console.log('Fetching all songs...');
        const { category, language, country } = req.query;
        const query = {};

        if (category) query.category = category;
        if (language) query['versions.language'] = language;
        if (country) query['versions.country'] = country;

        console.log('Query parameters:', query);

        const songs = await Song.find(query)
            .populate('createdBy', 'username')
            .populate('versions.uploadedBy', 'username')
            .sort({ createdAt: -1 });

        console.log(`Found ${songs.length} songs`);
        res.json(songs);
    } catch (error) {
        console.error('Error in getAllSongs:', error);
        res.status(500).json({
            message: 'Error fetching songs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get song by ID
const getSongById = async (req, res) => {
    try {
        const song = await Song.findById(req.params.songId)
            .populate('createdBy', 'username')
            .populate('versions.uploadedBy', 'username');

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        res.json(song);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching song', error: error.message });
    }
};

// Update song
const updateSong = async (req, res) => {
    try {
        const { title, originalArtist, originalLanguage, originalLyrics, category } = req.body;
        const song = await Song.findById(req.params.songId);

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Check if user is admin or song creator
        if (req.user.role !== 'admin' && song.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this song' });
        }

        song.title = title || song.title;
        song.originalArtist = originalArtist || song.originalArtist;
        song.originalLanguage = originalLanguage || song.originalLanguage;
        song.originalLyrics = originalLyrics || song.originalLyrics;
        song.category = category || song.category;

        await song.save();
        res.json(song);
    } catch (error) {
        res.status(500).json({ message: 'Error updating song', error: error.message });
    }
};

// Delete song
const deleteSong = async (req, res) => {
    try {
        const song = await Song.findById(req.params.songId);

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Check if user is admin or song creator
        if (req.user.role !== 'admin' && song.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this song' });
        }

        // Delete audio files
        for (const version of song.versions) {
            await storageService.deleteFile(version.audioUrl);
        }

        await song.remove();
        res.json({ message: 'Song deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting song', error: error.message });
    }
};

// Verify song version
const verifySongVersion = async (req, res) => {
    try {
        const { songId, versionId } = req.params;
        const song = await Song.findById(songId);

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        const version = song.versions.id(versionId);
        if (!version) {
            return res.status(404).json({ message: 'Version not found' });
        }

        version.verified = true;
        version.verifiedBy = req.user._id;
        version.verifiedAt = Date.now();

        await song.save();
        res.json(song);
    } catch (error) {
        res.status(500).json({ message: 'Error verifying song version', error: error.message });
    }
};

module.exports = {
    createSong,
    addSongVersion,
    getAllSongs,
    getSongById,
    updateSong,
    deleteSong,
    verifySongVersion
}; 