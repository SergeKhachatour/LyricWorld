const mongoose = require('mongoose');

const songVersionSchema = new mongoose.Schema({
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    country: {
        type: String,
        required: true
    },
    coordinates: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    language: {
        type: String,
        required: true
    },
    audioUrl: {
        type: String,
        required: true
    },
    lyrics: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    originalArtist: {
        type: String,
        required: true,
        trim: true
    },
    originalLanguage: {
        type: String,
        required: true
    },
    originalLyrics: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['hymn', 'worship', 'gospel', 'praise', 'other'],
        required: true
    },
    imageUrl: {
        type: String,
        default: '/uploads/song-placeholder.jpg'
    },
    versions: [songVersionSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
songSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song; 