require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const songRoutes = require('./routes/songRoutes');

const app = express();

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}

// Create placeholder image if it doesn't exist
const placeholderPath = path.join(uploadsDir, 'song-placeholder.jpg');
if (!fs.existsSync(placeholderPath)) {
    try {
        // Simple 1x1 transparent JPEG
        const placeholderImage = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', 'base64');
        fs.writeFileSync(placeholderPath, placeholderImage);
        console.log('Created placeholder image at:', placeholderPath);
    } catch (error) {
        console.error('Error creating placeholder image:', error);
    }
}

// Log the uploads directory path
console.log('Uploads directory path:', uploadsDir);

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
    // Log the request
    console.log('Static file request:', req.path);
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Check if file exists
    const filePath = path.join(uploadsDir, req.path);
    console.log('Looking for file at:', filePath);
    
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return res.status(404).send('File not found');
    }
    
    next();
}, express.static(uploadsDir, {
    setHeaders: (res, path) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Content-Type', 'image/jpeg');
    }
}));

// Routes
app.use('/api/songs', songRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!', 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Uploads directory: ${uploadsDir}`);
}); 